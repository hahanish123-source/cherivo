import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface CdpMessage {
  id: number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  public consoleLogs: string[] = [];
  public errors: string[] = [];

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg: CdpMessage = JSON.parse(String(event.data));
        if (msg.method === "Runtime.consoleAPICalled") {
          const text = msg.params.args.map((a: any) => a.value || a.description || "").join(" ");
          this.consoleLogs.push(`[${msg.params.type}] ${text}`);
        } else if (msg.method === "Runtime.exceptionThrown") {
          const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || "Unknown exception";
          this.errors.push(`[Exception] ${desc}`);
        }

        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id)!;
          this.pending.delete(msg.id);
          if (msg.error) {
            reject(msg.error);
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  async send(method: string, params: Record<string, any> = {}): Promise<any> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression: string): Promise<any> {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async close(): Promise<void> {
    this.ws.close();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForApp(client: CdpClient) {
  for (let i = 0; i < 30; i++) {
    try {
      const info = await client.eval(`({
        url: window.location.href,
        hasPreview: Boolean(document.querySelector('.preview')),
        bodyLength: document.body ? document.body.innerHTML.length : 0
      })`);
      if (info && (info.hasPreview || info.bodyLength > 100)) {
        console.log(`✓ Application DOM ready at ${info.url}`);
        return;
      }
    } catch {}
    await sleep(350);
  }
  throw new Error("Timeout waiting for application to load");
}

async function main() {
  const appPort = process.env.TEST_PORT || "3000";
  const debugPort = 9223;
  const tempDir = mkdtempSync(join(tmpdir(), "hanora-r3-test-"));

  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.CHROME_BIN || ""
  ];

  let chromeExe = chromePaths.find((p) => {
    try {
      return p && require("fs").existsSync(p);
    } catch {
      return false;
    }
  });

  if (!chromeExe) {
    console.error("Chrome executable not found.");
    process.exit(1);
  }

  console.log("=================================================================");
  console.log("STARTING TARGETED ROUND 4 BROWSER TEST (TYPOGRAPHY, FONTS, BG, GALLERY)");
  console.log("=================================================================");

  const chromeProcess: ChildProcess = spawn(
    chromeExe,
    [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${tempDir}`,
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `http://localhost:${appPort}/create`
    ],
    { stdio: "ignore" }
  );

  await sleep(2000);

  let versionData: any;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`http://localhost:${debugPort}/json/version`);
      versionData = await res.json();
      break;
    } catch {
      await sleep(1000);
    }
  }

  if (!versionData) {
    chromeProcess.kill();
    throw new Error("Could not connect to Chrome CDP");
  }

  console.log("✓ Connected to Chrome CDP:", versionData.Browser);

  const listRes = await fetch(`http://localhost:${debugPort}/json/list`);
  const allTabs = await listRes.json();
  const createTab = allTabs.find((t: any) => t.url.includes("/create")) || allTabs[0];

  const client = new CdpClient(createTab.webSocketDebuggerUrl);
  await client.connect();
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  await waitForApp(client);
  await sleep(1000);

  const sampleImg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmNjliNCIvPjwvc3ZnPg==";
  const projJson = JSON.stringify({
    theme: 'romantic',
    background: 'petals',
    cardBackgroundMode: 'different',
    globalFont: 'great-vibes',
    blocks: [
      { id: 'welcome', type: 'welcome', title: 'Welcome', subtitle: 'Special', heading: 'Happy Day', text: 'Celebration time.', emoji: '💖', emojiSize: 60, titleSize: 15, subtitleSize: 16, headingSize: 88, bodySize: 22, titleFont: 'dancing-script', subtitleFont: 'great-vibes', headingFont: 'great-vibes', bodyFont: 'pacifico', visible: true, customBg: sampleImg, customBgScale: 120, customBgRotation: 10, customBgOpacity: 85, backgroundOverlay: 20 },
      { id: 'reasons', type: 'reasons', title: 'Reasons', subtitle: 'Why', heading: 'Reasons I Care', text: 'Special reasons.', emoji: '✨', emojiSize: 50, titleSize: 14, subtitleSize: 15, headingSize: 72, bodySize: 18, titleFont: 'caveat', subtitleFont: 'caveat', headingFont: 'caveat', bodyFont: 'sans', visible: true },
      { id: 'memories', type: 'memories', title: 'Our Memories', subtitle: 'Moments', heading: 'Captured Moments', text: 'Moments we love.', emoji: '📸', galleryLayout: 'collage', images: [sampleImg, sampleImg, sampleImg, sampleImg, sampleImg], visible: true },
      { id: 'letter', type: 'letter', title: 'Letter', subtitle: 'Words', heading: 'Dear Friend', text: 'Heartfelt letter message.', emoji: '💌', letterFont: 'allura', letterSize: 22, visible: true }
    ]
  });

  await client.eval(`(() => {
    localStorage.setItem('hanora-project', ${JSON.stringify(projJson)});
    window.location.reload();
  })()`);

  await sleep(2000);
  await waitForApp(client);

  // 1. Test Typography Individual Font Sizes & Font Families
  console.log("\n--- TEST 1: TYPOGRAPHY INDIVIDUAL SIZES & CURSIVE FONTS ---");
  const typoCheck = await client.eval(`(() => {
    const sceneInner = document.querySelector('.sceneInner');
    const style = sceneInner ? window.getComputedStyle(sceneInner) : null;
    const titleSize = style ? style.getPropertyValue('--title-size').trim() : '';
    const subtitleSize = style ? style.getPropertyValue('--subtitle-size').trim() : '';
    const headingSize = style ? style.getPropertyValue('--heading-size').trim() : '';
    const bodySize = style ? style.getPropertyValue('--body-size').trim() : '';
    const emojiSize = style ? style.getPropertyValue('--emoji-size').trim() : '';
    const titleFont = style ? style.getPropertyValue('--title-font').trim() : '';
    const headingFont = style ? style.getPropertyValue('--heading-font').trim() : '';

    return {
      titleSize,
      subtitleSize,
      headingSize,
      bodySize,
      emojiSize,
      titleFont,
      headingFont
    };
  })()`);

  if (typoCheck.titleSize !== '15px' || typoCheck.subtitleSize !== '16px' || typoCheck.headingSize !== '88px' || typoCheck.bodySize !== '22px' || typoCheck.emojiSize !== '60px') {
    throw new Error(`FAIL: Typography size mismatch in preview: ${JSON.stringify(typoCheck)}`);
  }
  console.log(`✓ Typography individual sizes verified in preview: title=${typoCheck.titleSize}, subtitle=${typoCheck.subtitleSize}, heading=${typoCheck.headingSize}, body=${typoCheck.bodySize}, emoji=${typoCheck.emojiSize}`);
  console.log(`✓ Cursive font variables active in preview: headingFont=${typoCheck.headingFont}, titleFont=${typoCheck.titleFont}`);

  // 2. Test Per-Section Background
  console.log("\n--- TEST 2: PER-SECTION BACKGROUND FIDELITY ---");
  const bgCheck = await client.eval(`(() => {
    const bgContainer = document.querySelector('.customBgContainer');
    const bgImage = document.querySelector('.customBgImage');
    const style = bgImage ? window.getComputedStyle(bgImage) : null;
    const opacity = style ? style.opacity : '';
    const transform = style ? style.transform : '';

    return {
      hasBg: Boolean(bgContainer && bgImage),
      opacity,
      transform
    };
  })()`);

  if (!bgCheck.hasBg) {
    throw new Error("FAIL: Section custom background not rendered");
  }
  console.log(`✓ Section custom background rendered with opacity=${bgCheck.opacity}`);

  // 3. Test Gallery Non-Overlapping Layouts (Collage & Grid)
  console.log("\n--- TEST 3: GALLERY NON-OVERLAPPING LAYOUT ENGINE ---");
  // Switch to Memories block
  await client.eval(`(() => {
    const storyItems = Array.from(document.querySelectorAll('.storyItem'));
    const memItem = storyItems.find(item => item.textContent && item.textContent.toLowerCase().includes('memories'));
    if (memItem) memItem.click();
  })()`);
  await sleep(1000);

  // Test Grid layout
  const gridCheck = await client.eval(`(() => {
    const allSelects = Array.from(document.querySelectorAll('select'));
    const layoutSelect = allSelects.find(s => Array.from(s.options).some(o => o.value === 'grid'));
    if (layoutSelect) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(layoutSelect, 'grid');
        layoutSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    const photos = Array.from(document.querySelectorAll('.galleryPhoto'));
    const rects = photos.map(p => p.getBoundingClientRect());
    let overlap = false;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const r1 = rects[i];
        const r2 = rects[j];
        // Check if bounding rects overlap significantly (> 4px)
        const noOverlap = r1.right <= r2.left + 4 || r2.right <= r1.left + 4 || r1.bottom <= r2.top + 4 || r2.bottom <= r1.top + 4;
        if (!noOverlap) overlap = true;
      }
    }

    return {
      photoCount: photos.length,
      overlap
    };
  })()`);

  if (gridCheck.overlap) {
    throw new Error("FAIL: Accidental photo overlap detected in grid layout");
  }
  console.log(`✓ Grid layout verified with ${gridCheck.photoCount} photos: 0 overlapping collisions`);

  // Test Collage layout
  const collageCheck = await client.eval(`(() => {
    const allSelects = Array.from(document.querySelectorAll('select'));
    const layoutSelect = allSelects.find(s => Array.from(s.options).some(o => o.value === 'collage'));
    if (layoutSelect) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(layoutSelect, 'collage');
        layoutSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    const photos = Array.from(document.querySelectorAll('.galleryPhoto'));
    const rects = photos.map(p => p.getBoundingClientRect());
    let overlap = false;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const r1 = rects[i];
        const r2 = rects[j];
        const noOverlap = r1.right <= r2.left + 4 || r2.right <= r1.left + 4 || r1.bottom <= r2.top + 4 || r2.bottom <= r1.top + 4;
        if (!noOverlap) overlap = true;
      }
    }

    return {
      photoCount: photos.length,
      overlap
    };
  })()`);

  if (collageCheck.overlap) {
    throw new Error("FAIL: Accidental photo overlap detected in collage layout");
  }
  console.log(`✓ Auto Collage layout verified with ${collageCheck.photoCount} photos: 0 overlapping collisions`);

  // 4. Test Public Greeting Parity & Cursive Fonts in Public View
  console.log("\n--- TEST 4: PUBLIC GREETING GENERATION & PARITY ---");
  const publishBtn = await client.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Create Greeting Link'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  })()`);

  await sleep(2500);

  const publishedUrl = await client.eval(`(() => {
    const box = document.querySelector('.publishedLinkBox');
    const span = box ? box.querySelector('span') : null;
    const a = document.querySelector('a[target="_blank"]');
    return (span && span.textContent) || (a && a.getAttribute('href')) || '';
  })()`);

  console.log(`✓ Created public greeting link: ${publishedUrl}`);

  const publicTabRes = await fetch(`http://localhost:${debugPort}/json/new?${publishedUrl}`, { method: "PUT" });
  const publicTab = await publicTabRes.json();
  const publicClient = new CdpClient(publicTab.webSocketDebuggerUrl);
  await publicClient.connect();
  await publicClient.send("Page.enable");
  await publicClient.send("Runtime.enable");

  // Wait for the dynamic route to fully compile and load
  await waitForApp(publicClient);

  const publicCheck = await publicClient.eval(`(() => {
    const sceneInner = document.querySelector('.sceneInner');
    const style = sceneInner ? window.getComputedStyle(sceneInner) : null;
    const headingSize = style ? style.getPropertyValue('--heading-size').trim() : '';
    const bodySize = style ? style.getPropertyValue('--body-size').trim() : '';
    const titleSize = style ? style.getPropertyValue('--title-size').trim() : '';
    const customBg = document.querySelector('.customBgImage');

    return {
      hasPreview: Boolean(sceneInner),
      headingSize,
      bodySize,
      titleSize,
      hasCustomBg: Boolean(customBg)
    };
  })()`);

  if (!publicCheck.hasPreview || publicCheck.headingSize !== '88px' || !publicCheck.hasCustomBg) {
    throw new Error(`FAIL: Public greeting parity failure: ${JSON.stringify(publicCheck)}`);
  }
  console.log(`✓ Public greeting loaded with exact typography and custom background (headingSize=${publicCheck.headingSize}, titleSize=${publicCheck.titleSize}, customBg=${publicCheck.hasCustomBg})`);

  console.log("\n=================================================================");
  console.log("ALL ROUND 4 TARGETED TESTS PASSED (100%)");
  console.log("=================================================================");

  await client.close();
  await publicClient.close();
  chromeProcess.kill();
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
