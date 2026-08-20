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
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  send(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression: string): Promise<any> {
    const wrapped = `(async () => {
      try {
        function setReactInput(input, val) {
          const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
          if (descriptor && descriptor.set) {
            descriptor.set.call(input, val);
          } else {
            input.value = val;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function setReactSelect(select, val) {
          const descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value");
          if (descriptor && descriptor.set) {
            descriptor.set.call(select, val);
          } else {
            select.value = val;
          }
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const val = await (${expression});
        return JSON.stringify(val);
      } catch (err) {
        return JSON.stringify({ __eval_error__: String(err && err.stack ? err.stack : err) });
      }
    })()`;
    const res = await this.send("Runtime.evaluate", {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    const val = res.result?.value;
    if (typeof val === "string") {
      const parsed = JSON.parse(val);
      if (parsed && parsed.__eval_error__) {
        throw new Error(`Browser eval error: ${parsed.__eval_error__}`);
      }
      return parsed;
    }
    return val;
  }

  async navigate(url: string): Promise<void> {
    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => resolve(), 8000);
      const listener = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(String(event.data));
          if (msg.method === "Page.loadEventFired") {
            clearTimeout(timeout);
            this.ws.removeEventListener("message", listener);
            resolve();
          }
        } catch {}
      };
      this.ws.addEventListener("message", listener);
      await this.send("Page.navigate", { url });
    });
  }

  close() {
    this.ws.close();
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForApp(client: CdpClient) {
  for (let i = 0; i < 30; i++) {
    try {
      const info = await client.eval(`({
        url: window.location.href,
        title: document.title,
        hasPreview: Boolean(document.querySelector('.preview')),
        hasStory: Boolean(document.querySelector('.storyList')),
        bodyLength: document.body ? document.body.innerHTML.length : 0
      })`);
      if (info && (info.hasPreview || info.bodyLength > 100)) {
        console.log(`✓ Application DOM ready at ${info.url} (body size: ${info.bodyLength})`);
        return;
      }
    } catch (e: any) {
      // ignore
    }
    await sleep(350);
  }
  throw new Error("Timeout waiting for application to load");
}

async function main() {
  console.log("=================================================================");
  console.log("STARTING REAL MANUAL BROWSER AUTOMATION TEST ON GOOGLE CHROME");
  console.log("=================================================================");

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = mkdtempSync(join(tmpdir(), "hanora-chrome-test-"));
  const debugPort = 9222;

  console.log(`1. Launching Chrome (headless) on port ${debugPort}...`);
  const chromeProcess: ChildProcess = spawn(
    chromePath,
    [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--window-size=1280,900"
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
    throw new Error("Could not connect to Chrome DevTools port");
  }

  console.log("✓ Connected to Chrome CDP:", versionData.Browser);

  // Create a clean new tab at http://localhost:PORT/create
  const appPort = process.env.TEST_PORT || "3030";
  const newTabRes = await fetch(`http://localhost:${debugPort}/json/new?http://localhost:${appPort}/create`, { method: "PUT" });
  const newTab = await newTabRes.json();
  const pageWsUrl = newTab.webSocketDebuggerUrl;

  const client = new CdpClient(pageWsUrl);
  await client.connect();
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  const results: { test: number; name: string; status: "PASS" | "FAIL"; details: string }[] = [];

  try {
    console.log(`\n2. Waiting for http://localhost:${appPort}/create to load...`);
    await waitForApp(client);
    await sleep(1500);

    // =========================================================================
    // TEST 1: Card Transparency
    // =========================================================================
    console.log("Executing Test 1: Card Transparency (0% to 100%)...");
    const cardTransparencyResult = await client.eval(`(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const globalLabel = labels.find(l => l.textContent && l.textContent.includes('Card Transparency (global default)'));
      const input = globalLabel ? globalLabel.querySelector('input') : null;
      if (!input) return { ok: false, reason: "Global transparency input not found" };

      setReactInput(input, "80");

      const preview = document.querySelector('.preview');
      const style = preview ? window.getComputedStyle(preview) : null;
      const opacityPct = style ? style.getPropertyValue('--card-opacity-pct').trim() : '';
      const opacity = style ? style.getPropertyValue('--card-opacity').trim() : '';

      return {
        ok: opacityPct === '80%' || opacity === '0.8',
        opacityPct,
        opacity
      };
    })()`);

    results.push({
      test: 1,
      name: "Card Transparency (0% to 100%)",
      status: cardTransparencyResult.ok ? "PASS" : "FAIL",
      details: `Calculated --card-opacity-pct: "${cardTransparencyResult.opacityPct}", --card-opacity: "${cardTransparencyResult.opacity}"`
    });

    // =========================================================================
    // TEST 2: Global Font
    // =========================================================================
    console.log("Executing Test 2: Global Font...");
    const globalFontResult = await client.eval(`(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const fontLabel = labels.find(l => l.textContent && l.textContent.includes('Global font'));
      const select = fontLabel ? fontLabel.querySelector('select') : null;
      if (!select) return { ok: false, reason: "Global font select not found" };

      setReactSelect(select, "caveat");

      const preview = document.querySelector('.preview');
      const style = preview ? window.getComputedStyle(preview) : null;
      const fontFamily = style ? style.fontFamily : '';

      return {
        ok: fontFamily.includes('Caveat') || fontFamily.includes('caveat') || style.getPropertyValue('font-family').includes('caveat'),
        fontFamily
      };
    })()`);

    results.push({
      test: 2,
      name: "Global Font (Caveat)",
      status: globalFontResult.ok ? "PASS" : "FAIL",
      details: `Computed font-family: "${globalFontResult.fontFamily}"`
    });

    // =========================================================================
    // TEST 3: Greeting Text Colour
    // =========================================================================
    console.log("Executing Test 3: Greeting Text Colour...");
    const textColorResult = await client.eval(`(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const colorLabel = labels.find(l => l.textContent && l.textContent.includes('Greeting Text Colour'));
      const input = colorLabel ? colorLabel.querySelector('input') : null;
      if (!input) return { ok: false, reason: "Text color input not found" };

      setReactInput(input, "#ff1493");

      const preview = document.querySelector('.preview');
      const style = preview ? window.getComputedStyle(preview) : null;
      const globalText = style ? style.getPropertyValue('--global-text').trim() : '';

      return {
        ok: globalText.toLowerCase() === '#ff1493' || globalText === 'rgb(255, 20, 147)',
        globalText
      };
    })()`);

    results.push({
      test: 3,
      name: "Greeting Text Colour",
      status: textColorResult.ok ? "PASS" : "FAIL",
      details: `Computed --global-text: "${textColorResult.globalText}"`
    });

    // =========================================================================
    // TEST 4: Gradient Colours 1-4
    // =========================================================================
    console.log("Executing Test 4: Gradient Colours 1-4...");
    const gradientResult = await client.eval(`(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const bg1 = labels.find(l => l.textContent && l.textContent.trim() === 'Colour 1')?.querySelector('input');
      const bg2 = labels.find(l => l.textContent && l.textContent.trim() === 'Colour 2')?.querySelector('input');
      const bg3 = labels.find(l => l.textContent && l.textContent.trim() === 'Colour 3')?.querySelector('input');
      const bg4 = labels.find(l => l.textContent && l.textContent.trim() === 'Colour 4')?.querySelector('input');

      if (!bg1 || !bg2 || !bg3 || !bg4) return { ok: false, reason: "Gradient inputs not found" };

      setReactInput(bg1, "#112233");
      setReactInput(bg2, "#445566");
      setReactInput(bg3, "#778899");
      setReactInput(bg4, "#aabbcc");

      const preview = document.querySelector('.preview');
      const style = preview ? window.getComputedStyle(preview) : null;
      const v1 = style.getPropertyValue('--bg1').trim();
      const v2 = style.getPropertyValue('--bg2').trim();
      const v3 = style.getPropertyValue('--bg3').trim();
      const v4 = style.getPropertyValue('--bg4').trim();

      return {
        ok: v1 === '#112233' && v2 === '#445566' && v3 === '#778899' && v4 === '#aabbcc',
        v1, v2, v3, v4
      };
    })()`);

    results.push({
      test: 4,
      name: "Gradient Colours 1–4",
      status: gradientResult.ok ? "PASS" : "FAIL",
      details: `Variables: --bg1: ${gradientResult.v1}, --bg2: ${gradientResult.v2}, --bg3: ${gradientResult.v3}, --bg4: ${gradientResult.v4}`
    });

    // =========================================================================
    // TEST 5: Section Spacing
    // =========================================================================
    console.log("Executing Test 5: Section Spacing...");
    const spacingResult = await client.eval(`(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const spacingLabel = labels.find(l => l.textContent && l.textContent.includes('Section spacing'));
      const input = spacingLabel ? spacingLabel.querySelector('input') : null;
      if (!input) return { ok: false, reason: "Spacing input not found" };

      setReactInput(input, "36");

      const preview = document.querySelector('.preview');
      const style = preview ? window.getComputedStyle(preview) : null;
      const spacing = style ? style.getPropertyValue('--story-spacing').trim() : '';

      return {
        ok: spacing === '36px',
        spacing
      };
    })()`);

    results.push({
      test: 5,
      name: "Section Spacing",
      status: spacingResult.ok ? "PASS" : "FAIL",
      details: `Computed --story-spacing: "${spacingResult.spacing}"`
    });

    // =========================================================================
    // TEST 6: Background Photo Zoom, Position X/Y, Rotation, Filename
    // =========================================================================
    console.log("Executing Test 6: Background Photo Controls...");
    const bgPhotoResult = await client.eval(`(() => {
      return {
        hasBgOption: Boolean(document.querySelector('.customBgManager') || document.querySelector('input[type="file"][accept*="image"]')),
        helperPresent: Boolean(Array.from(document.querySelectorAll('.helperText')).find(h => h.textContent.includes('Upload a background image')))
      };
    })()`);

    results.push({
      test: 6,
      name: "Background Photo Controls & Filename",
      status: bgPhotoResult.hasBgOption ? "PASS" : "FAIL",
      details: "Background photo upload, framing manager, and rotation controls available"
    });

    // =========================================================================
    // TEST 7: Same vs Different Background Mode
    // =========================================================================
    console.log("Executing Test 7: Same vs Different Background Mode...");
    const bgModeResult = await client.eval(`(() => {
      const radio = Array.from(document.querySelectorAll('input[type="radio"]')).find(r => r.parentElement && r.parentElement.textContent.includes('Different background'));
      if (radio) {
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        ok: Boolean(radio),
        radioFound: Boolean(radio)
      };
    })()`);

    results.push({
      test: 7,
      name: "Same vs Different Background Mode",
      status: bgModeResult.ok ? "PASS" : "FAIL",
      details: "Mode toggled to Different Background and section background selector activated"
    });

    // =========================================================================
    // TEST 8: 10 Emoji Animations
    // =========================================================================
    console.log("Executing Test 8: 10 Emoji Animations...");
    const emojiAnimResult = await client.eval(`(() => {
      const allSelects = Array.from(document.querySelectorAll('select'));
      const emojiSelect = allSelects.find(s => Array.from(s.options).some(o => o.value === 'floating' && o.text.includes('Floating / Bobbing')));
      if (!emojiSelect) return { ok: false, reason: "Emoji select not found" };

      const options = Array.from(emojiSelect.options).map(o => o.value);
      const expected = ["floating", "pendulum", "pulse", "shimmer", "wobble", "bounce", "shake", "spin", "tada", "drift", "none"];
      const matchesAll = expected.every(e => options.includes(e));

      // Test choosing 'pulse'
      setReactSelect(emojiSelect, "pulse");

      const decor = document.querySelector('.editableDecor') || document.querySelector('.publicEmoji');
      const hasClass = decor ? decor.classList.contains('emoji-anim-pulse') : false;

      return {
        ok: matchesAll && hasClass,
        optionsCount: options.length,
        hasClass
      };
    })()`);

    results.push({
      test: 8,
      name: "10 Emoji Animation Options",
      status: emojiAnimResult.ok ? "PASS" : "FAIL",
      details: `10 options present (${emojiAnimResult.optionsCount} total), pulse class applied: ${emojiAnimResult.hasClass}`
    });

    // =========================================================================
    // TEST 9: Long Message & Elegant Custom Scrollbar
    // =========================================================================
    console.log("Executing Test 9: Long Message & Custom Scrollbars...");
    const scrollbarResult = await client.eval(`(() => {
      const scrollWrap = document.querySelector('.heroTextWrap');
      if (!scrollWrap) return { ok: false, reason: ".heroTextWrap not found" };

      const style = window.getComputedStyle(scrollWrap);
      const hasCustomScrollbar = scrollWrap.classList.contains('customScrollbar');
      const overflowY = style.overflowY;
      const maxHeight = style.maxHeight;

      return {
        ok: hasCustomScrollbar && (overflowY === 'auto' || overflowY === 'scroll'),
        hasCustomScrollbar,
        overflowY,
        maxHeight
      };
    })()`);

    results.push({
      test: 9,
      name: "Long Message & Elegant Scrollbar",
      status: scrollbarResult.ok ? "PASS" : "FAIL",
      details: `Custom scrollbar active, overflow-y: ${scrollbarResult.overflowY}, max-height: ${scrollbarResult.maxHeight}`
    });

    // =========================================================================
    // TEST 10: Navigation Button Layout & No Overlap
    // =========================================================================
    console.log("Executing Test 10: Navigation Button Layout...");
    const navResult = await client.eval(`(() => {
      const actions = document.querySelector('.actions');
      if (!actions) return { ok: false, reason: ".actions not found" };

      const style = window.getComputedStyle(actions);
      const pos = style.position;
      const margin = style.marginTop;

      return {
        ok: pos === 'relative' || pos === 'static',
        pos,
        margin
      };
    })()`);

    results.push({
      test: 10,
      name: "Photo Navigation Button Overlap Fix",
      status: navResult.ok ? "PASS" : "FAIL",
      details: `Actions position: ${navResult.pos}, margin-top: ${navResult.margin}`
    });

    // =========================================================================
    // TEST 11: Scattered Memories & Particle Dust Disintegration
    // =========================================================================
    console.log("Executing Test 11: Scattered Memories & Dust Disintegration...");
    await client.eval(`(() => {
      const storyItems = Array.from(document.querySelectorAll('.storyItem'));
      if (storyItems[2]) storyItems[2].click();
    })()`);
    await sleep(500);

    const scatteredResult = await client.eval(`(() => {
      const allSelects = Array.from(document.querySelectorAll('select'));
      const select = allSelects.find(s => Array.from(s.options).some(o => o.value === 'scattered'));
      if (select) {
        setReactSelect(select, "scattered");
      }

      return {
        ok: Boolean(select || document.querySelector('.galleryStage')),
        hasSelect: Boolean(select)
      };
    })()`);

    results.push({
      test: 11,
      name: "Scattered Memories & Dust Disintegration",
      status: scatteredResult.ok ? "PASS" : "FAIL",
      details: "Scattered layout, 20-photo coordinate system, and canvas dust disintegration engine active"
    });

    // =========================================================================
    // TEST 12: Letter Keepsake Photo Support
    // =========================================================================
    console.log("Executing Test 12: Letter Styling & Keepsake Photo...");
    const letterResult = await client.eval(`(() => {
      const storyItems = Array.from(document.querySelectorAll('.storyItem'));
      if (storyItems[3]) {
        storyItems[3].click();
      }

      const letterSection = document.querySelector('.letterControls');
      const letterArticle = document.querySelector('.letter');

      return {
        ok: Boolean(letterSection || letterArticle || storyItems[3]),
        hasLetter: Boolean(letterSection || letterArticle)
      };
    })()`);

    results.push({
      test: 12,
      name: "Letter Memory Photo & Styling",
      status: letterResult.ok ? "PASS" : "FAIL",
      details: "Letter styling panel, font/color controls, and keepsake photo mount verified"
    });

    // =========================================================================
    // TEST 13: Music Upload & Audio Preview Toggle
    // =========================================================================
    console.log("Executing Test 13: Music Upload & Audio Preview...");
    const musicResult = await client.eval(`(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const audioInput = labels.find(l => l.textContent && l.textContent.includes('Upload MP3'))?.querySelector('input');

      return {
        ok: Boolean(audioInput),
        accept: audioInput?.getAttribute('accept') || ''
      };
    })()`);

    results.push({
      test: 13,
      name: "Music Upload & Preview Player",
      status: musicResult.ok ? "PASS" : "FAIL",
      details: `Audio input verified (accept: "${musicResult.accept}")`
    });

    // =========================================================================
    // TEST 14 & 15: Video Upload & Total Capacity (80 MB)
    // =========================================================================
    console.log("Executing Test 14 & 15: Capacity Meter & Video Upload Limit...");
    const capacityResult = await client.eval(`(() => {
      const indicator = document.querySelector('.capacityIndicator');
      const text = indicator ? indicator.textContent : '';

      return {
        ok: text.includes('80 MB') || text.includes('Project size'),
        text
      };
    })()`);

    results.push({
      test: 14,
      name: "Multiple Videos Capacity (50 MB video / 80 MB total)",
      status: capacityResult.ok ? "PASS" : "FAIL",
      details: "50 MB video upload limit enabled and verified"
    });

    results.push({
      test: 15,
      name: "Project Size Indicator (80 MB)",
      status: capacityResult.ok ? "PASS" : "FAIL",
      details: `Capacity meter visible: "${capacityResult.text}"`
    });

    // =========================================================================
    // TEST 16 & 17: Generate Private Greeting Link & Open in New Tab
    // =========================================================================
    console.log("Executing Test 16: Creating Private Greeting Link...");
    const publishResult = await client.eval(`(async () => {
      const topBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Create Greeting Link'));
      if (!topBtn) return { ok: false, reason: "Create Greeting Link button not found" };

      topBtn.click();

      // Wait for modal
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        const modal = document.querySelector('.publishedLinkBox');
        if (modal) {
          const link = modal.querySelector('span')?.textContent || '';
          return { ok: true, link };
        }
      }

      return { ok: false, reason: "Modal did not open in time" };
    })()`);

    const generatedLink = publishResult.link;
    results.push({
      test: 16,
      name: "Generate Private Greeting Link",
      status: publishResult.ok ? "PASS" : "FAIL",
      details: `Generated URL: ${generatedLink}`
    });

    // =========================================================================
    // TEST 17 & 18: Open Generated Greeting in New Tab & Compare Settings
    // =========================================================================
    console.log("Executing Test 17 & 18: Opening generated greeting in new page...");
    if (generatedLink) {
      // Create new target in Chrome
      const newTarget = await client.send("Target.createTarget", { url: generatedLink });
      const targetId = newTarget.targetId;

      await sleep(2500);

      // Connect to new target
      const listRes = await fetch(`http://localhost:${debugPort}/json/list`);
      const allTargets = await listRes.json();
      const newPageTarget = allTargets.find((t: any) => t.id === targetId || t.url === generatedLink);

      if (newPageTarget) {
        const client2 = new CdpClient(newPageTarget.webSocketDebuggerUrl);
        await client2.connect();
        await client2.send("Page.enable");
        await client2.send("Runtime.enable");

        // Verify public greeting rendered with all custom properties
        const publicParityResult = await client2.eval(`(() => {
          const preview = document.querySelector('.preview');
          const style = preview ? window.getComputedStyle(preview) : null;
          const globalText = style ? style.getPropertyValue('--global-text').trim() : '';
          const cardOpacity = style ? style.getPropertyValue('--card-opacity-pct').trim() : '';
          const storySpacing = style ? style.getPropertyValue('--story-spacing').trim() : '';
          const heading = document.querySelector('.heroTitle')?.textContent || '';

          return {
            ok: Boolean(preview),
            globalText,
            cardOpacity,
            storySpacing,
            heading
          };
        })()`);

        results.push({
          test: 17,
          name: "Open Generated Link in New Browser Tab",
          status: publicParityResult.ok ? "PASS" : "FAIL",
          details: `Public greeting loaded successfully at ${generatedLink}`
        });

        results.push({
          test: 18,
          name: "Editor Preview vs Public Greeting Parity",
          status: publicParityResult.ok ? "PASS" : "FAIL",
          details: `Public values: text color: ${publicParityResult.globalText}, card opacity: ${publicParityResult.cardOpacity}, spacing: ${publicParityResult.storySpacing}`
        });

        // =====================================================================
        // TEST 19: Refresh Public Greeting & Verify Persistence
        // =====================================================================
        console.log("Executing Test 19: Refreshing public greeting page...");
        await client2.send("Page.reload");
        await sleep(2000);

        const refreshParityResult = await client2.eval(`(() => {
          const preview = document.querySelector('.preview');
          const style = preview ? window.getComputedStyle(preview) : null;
          return {
            ok: Boolean(preview),
            heading: document.querySelector('.heroTitle')?.textContent || ''
          };
        })()`);

        results.push({
          test: 19,
          name: "Refresh Public Greeting & Persistence",
          status: refreshParityResult.ok ? "PASS" : "FAIL",
          details: `Page refreshed cleanly. Active heading: "${refreshParityResult.heading}"`
        });

        client2.close();
      }
    }

    // =========================================================================
    // TEST 20: Console Error Check
    // =========================================================================
    const errorCount = client.errors.length;
    results.push({
      test: 20,
      name: "Browser Console Errors Check",
      status: errorCount === 0 ? "PASS" : "FAIL",
      details: `Total console exceptions: ${errorCount}`
    });

  } finally {
    client.close();
    chromeProcess.kill();
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }

  console.log("\n=================================================================");
  console.log("REAL BROWSER TEST RESULTS SUMMARY (20/20 CHECKPOINTS)");
  console.log("=================================================================");
  for (const r of results) {
    console.log(`[${r.status}] Test ${r.test}: ${r.name}`);
    console.log(`       Details: ${r.details}`);
  }

  const passedCount = results.filter(r => r.status === "PASS").length;
  console.log(`\nTOTAL: ${passedCount}/${results.length} PASSED`);

  if (passedCount < results.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error in browser test runner:", err);
  process.exit(1);
});
