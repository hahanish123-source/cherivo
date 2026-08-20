import { createGreeting, getGreeting } from "../lib/greetingStore";
import { normalizeProject } from "../lib/greetingConfig";
import type { GreetingProject } from "../lib/types";

const testProjectPayload: GreetingProject = {
  blocks: [
    {
      id: "welcome-block",
      type: "welcome",
      title: "To Dearest Elena",
      subtitle: "A Special Milestone",
      heading: "Happy 25th Birthday, Elena!",
      text: "Wishing you a year filled with magic, laughter, and endless adventure.",
      emoji: "💖",
      font: "caveat",
      titleFont: "caveat",
      subtitleFont: "script",
      headingFont: "caveat",
      bodyFont: "caveat",
      accent: "#ff1493",
      headingColor: "#ffe4e6",
      subtitleColor: "#f472b6",
      bodyColor: "#fce7f3",
      emojiColor: "#ff1493",
      headingSize: 85,
      bodySize: 20,
      lineHeight: 1.8,
      letterSpacing: 1,
      radius: 28,
      cardColor: "#1e1025",
      cardOpacity: 35,
      imageOpacity: 95,
      visible: true,
      image: "data:image/jpeg;base64,welcome-photo-data",
      imageAdjustments: {
        "hero": { scale: 125, x: 55, y: 45 },
        "0": { scale: 125, x: 55, y: 45 }
      }
    },
    {
      id: "reasons-block",
      type: "reasons",
      title: "25 Reasons Why",
      subtitle: "The Little Things",
      heading: "Why You Are Extraordinary",
      text: "Here are just a few reasons why you mean so much to all of us.",
      emoji: "✨",
      font: "caveat",
      titleFont: "caveat",
      subtitleFont: "caveat",
      headingFont: "caveat",
      bodyFont: "caveat",
      accent: "#ff1493",
      headingColor: "#ffe4e6",
      subtitleColor: "#f472b6",
      bodyColor: "#fce7f3",
      emojiColor: "#ff1493",
      headingSize: 75,
      bodySize: 18,
      lineHeight: 1.75,
      letterSpacing: 0,
      radius: 24,
      cardColor: "#1e1025",
      cardOpacity: 30,
      imageOpacity: 100,
      visible: true,
      items: [
        { id: "r1", title: "Your radiant smile", text: "Lights up any room instantly.", emoji: "🌟" },
        { id: "r2", title: "Your thoughtful heart", text: "Always putting others first.", emoji: "🌸" },
        { id: "r3", title: "Your endless kindness", text: "Making every moment feel warm and safe.", emoji: "💖" }
      ]
    },
    {
      id: "memories-block",
      type: "memories",
      title: "Unforgettable Days",
      subtitle: "Our Journey",
      heading: "Moments We Cherish",
      text: "From our midnight drives to summer trips by the sea.",
      emoji: "📸",
      font: "caveat",
      titleFont: "caveat",
      subtitleFont: "caveat",
      headingFont: "caveat",
      bodyFont: "caveat",
      accent: "#ff1493",
      headingColor: "#ffe4e6",
      subtitleColor: "#f472b6",
      bodyColor: "#fce7f3",
      emojiColor: "#ff1493",
      headingSize: 70,
      bodySize: 17,
      lineHeight: 1.75,
      letterSpacing: 0,
      radius: 24,
      cardColor: "#1e1025",
      cardOpacity: 30,
      galleryLayout: "scattered",
      galleryBackground: "black",
      imageOpacity: 100,
      visible: true,
      images: [
        "data:image/jpeg;base64,memories-photo-1",
        "data:image/jpeg;base64,memories-photo-2",
        "data:image/jpeg;base64,memories-photo-3"
      ],
      imageAdjustments: {
        "0": { scale: 120, x: 45, y: 55 },
        "1": { scale: 110, x: 50, y: 50 }
      }
    },
    {
      id: "letter-block",
      type: "letter",
      title: "A Private Note",
      subtitle: "Just for You",
      heading: "Dear Elena",
      text: "May this next chapter be your brightest and most joyful one yet.\n\nWith all my love,\nAlex",
      emoji: "💌",
      font: "script",
      titleFont: "sans",
      subtitleFont: "script",
      headingFont: "script",
      bodyFont: "caveat",
      accent: "#ff1493",
      headingColor: "#ffe4e6",
      subtitleColor: "#f472b6",
      bodyColor: "#fce7f3",
      emojiColor: "#ff1493",
      headingSize: 70,
      bodySize: 18,
      lineHeight: 1.8,
      letterSpacing: 0,
      radius: 24,
      cardColor: "#fff8ea",
      cardOpacity: 100,
      letterColor: "#4a154b",
      letterSize: 20,
      letterLineHeight: 1.9,
      letterAlign: "left",
      image: "data:image/jpeg;base64,memories-photo-1",
      imageOpacity: 100,
      visible: true
    },
    {
      id: "secret-block",
      type: "secret",
      title: "A Surprise",
      subtitle: "Hidden Moment",
      heading: "Pack your bags!",
      text: "We booked the weekend getaway to the mountains!",
      emoji: "🎁",
      font: "caveat",
      titleFont: "caveat",
      subtitleFont: "caveat",
      headingFont: "caveat",
      bodyFont: "caveat",
      accent: "#ff1493",
      headingColor: "#ffe4e6",
      subtitleColor: "#f472b6",
      bodyColor: "#fce7f3",
      emojiColor: "#ff1493",
      headingSize: 70,
      bodySize: 18,
      lineHeight: 1.75,
      letterSpacing: 0,
      radius: 24,
      cardColor: "#1e1025",
      cardOpacity: 30,
      imageOpacity: 100,
      visible: true
    },
    {
      id: "cake-block",
      type: "cake",
      title: "Make a Wish",
      subtitle: "Blow the Candles",
      heading: "Here's to 25!",
      text: "Tap the candles to blow them out and make a wish.",
      emoji: "🎂",
      font: "caveat",
      titleFont: "caveat",
      subtitleFont: "caveat",
      headingFont: "caveat",
      bodyFont: "caveat",
      accent: "#ffb45c",
      headingColor: "#ffe4e6",
      subtitleColor: "#f472b6",
      bodyColor: "#fce7f3",
      emojiColor: "#ffb45c",
      headingSize: 70,
      bodySize: 18,
      lineHeight: 1.75,
      letterSpacing: 0,
      radius: 24,
      cardColor: "#1e1025",
      cardOpacity: 30,
      imageOpacity: 100,
      visible: true
    }
  ],
  theme: "romantic",
  background: "petals",
  cardBackgroundMode: "same",
  emojiAnimation: "pulse",
  globalFont: "caveat",
  globalTextColor: "#fff0f7",
  globalCardOpacity: 25,
  globalRadius: 28,
  globalSpacing: 22,
  globalMotion: "soft",
  customBg: "data:image/jpeg;base64,custom-bg-data",
  customBgName: "romantic-stars.jpg",
  customBgRotation: 15,
  backgroundBaseColor: "#180914",
  bgColor1: "#ff1493",
  bgColor2: "#db2777",
  bgColor3: "#f472b6",
  bgColor4: "#fda4af",
  backgroundOverlay: 25
};

const testTitle = "Elena's 25th Birthday Celebration";

async function runStorageFidelityTest() {
  console.log("\n=======================================================");
  console.log("TEST 1: STORAGE FIDELITY (createGreeting -> getGreeting)");
  console.log("=======================================================");

  const normalized = normalizeProject(testProjectPayload);
  const { token } = await createGreeting(testTitle, normalized as unknown as Record<string, unknown>);
  console.log(`✓ Stored greeting created with token: ${token.slice(0, 16)}...`);

  const retrieved = await getGreeting(token);
  if (!retrieved) {
    throw new Error(`FAIL: Could not retrieve greeting for token ${token}`);
  }

  if (retrieved.title !== testTitle) {
    throw new Error(`FAIL: Title mismatch: expected "${testTitle}", got "${retrieved.title}"`);
  }

  const data = normalizeProject(retrieved.data);

  const checks: [string, any, any][] = [
    ["Theme", data.theme, "romantic"],
    ["Background", data.background, "petals"],
    ["Card Background Mode", data.cardBackgroundMode, "same"],
    ["Emoji Animation", data.emojiAnimation, "pulse"],
    ["Global Font", data.globalFont, "caveat"],
    ["Global Text Color", data.globalTextColor, "#fff0f7"],
    ["Global Card Opacity", data.globalCardOpacity, 25],
    ["Global Radius", data.globalRadius, 28],
    ["Global Spacing", data.globalSpacing, 22],
    ["Global Motion", data.globalMotion, "soft"],
    ["Custom BG Name", data.customBgName, "romantic-stars.jpg"],
    ["Custom BG Rotation", data.customBgRotation, 15],
    ["Background Base Color", data.backgroundBaseColor, "#180914"],
    ["BG Color 1", data.bgColor1, "#ff1493"],
    ["BG Color 2", data.bgColor2, "#db2777"],
    ["BG Color 3", data.bgColor3, "#f472b6"],
    ["BG Color 4", data.bgColor4, "#fda4af"],
    ["Background Overlay", data.backgroundOverlay, 25],
    ["Blocks Count", data.blocks.length, 6],
    ["Welcome Heading", data.blocks[0].heading, "Happy 25th Birthday, Elena!"],
    ["Welcome Text", data.blocks[0].text, testProjectPayload.blocks[0].text],
    ["Welcome Font", data.blocks[0].headingFont, "caveat"],
    ["Welcome Heading Size", data.blocks[0].headingSize, 85],
    ["Welcome Hero Adjustment Scale", data.blocks[0].imageAdjustments?.["hero"]?.scale, 125],
    ["Reasons Items Count", data.blocks[1].items?.length, 3],
    ["Reasons Item 1", data.blocks[1].items?.[0]?.title, "Your radiant smile"],
    ["Reasons Item 2", data.blocks[1].items?.[1]?.title, "Your thoughtful heart"],
    ["Reasons Item 3", data.blocks[1].items?.[2]?.title, "Your endless kindness"],
    ["Memories Layout", data.blocks[2].galleryLayout, "scattered"],
    ["Memories Gallery Background", data.blocks[2].galleryBackground, "black"],
    ["Memories Images Count", data.blocks[2].images?.length, 3],
    ["Memories Image Adjustments", data.blocks[2].imageAdjustments?.["0"]?.scale, 120],
    ["Letter Heading", data.blocks[3].heading, "Dear Elena"],
    ["Letter Text", data.blocks[3].text, testProjectPayload.blocks[3].text],
    ["Letter Image", data.blocks[3].image, "data:image/jpeg;base64,memories-photo-1"],
    ["Letter Color", data.blocks[3].letterColor, "#4a154b"],
    ["Letter Size", data.blocks[3].letterSize, 20],
    ["Letter Line Height", data.blocks[3].letterLineHeight, 1.9],
    ["Secret Heading", data.blocks[4].heading, "Pack your bags!"],
    ["Secret Text", data.blocks[4].text, "We booked the weekend getaway to the mountains!"],
    ["Cake Heading", data.blocks[5].heading, "Here's to 25!"],
    ["Cake Text", data.blocks[5].text, testProjectPayload.blocks[5].text]
  ];

  for (const [label, actual, expected] of checks) {
    if (actual !== expected) {
      throw new Error(`FAIL: Storage mismatch on ${label}: expected ${expected}, got ${actual}`);
    }
  }

  console.log(`✓ Passed all ${checks.length} storage fidelity assertions (100% exact match)`);
  return token;
}

async function runRenderingFidelityTest(baseUrl: string) {
  console.log("\n=======================================================");
  console.log("TEST 2: RENDERING FIDELITY (API -> /g/[token] -> HTML)");
  console.log("=======================================================");

  // Step A: Publish via API
  console.log("A. Publishing test greeting via POST /api/greetings...");
  const publishRes = await fetch(`${baseUrl}/api/greetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: testTitle,
      project: testProjectPayload
    })
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.ok || !publishData.token) {
    throw new Error(`FAIL: API publish failed: ${JSON.stringify(publishData)}`);
  }

  const { token, url } = publishData;
  console.log(`✓ API publish returned token: ${token.slice(0, 16)}... and URL: ${url}`);

  // Step B: Fetch /g/[token]
  console.log(`B. Requesting public greeting page GET /g/${token}...`);
  const pageRes = await fetch(`${baseUrl}/g/${token}`);
  if (pageRes.status !== 200) {
    throw new Error(`FAIL: GET /g/${token} returned status ${pageRes.status} (expected 200)`);
  }
  const pageHtml = await pageRes.text();
  console.log(`✓ Page returned HTTP 200 (${pageHtml.length} bytes)`);

  // Step C: Verify all custom values in rendered HTML & client payload
  console.log("C. Verifying rendered HTML contains exact custom configuration...");
  const requiredSubstrings: [string, string][] = [
    ["Custom Page Title", testTitle],
    ["Custom Name (Heading)", "Happy 25th Birthday, Elena!"],
    ["Custom Welcome Subtitle", "A Special Milestone"],
    ["Custom Welcome Message", "Wishing you a year filled with magic, laughter, and endless adventure."],
    ["Romantic Theme Class", "theme-romantic"],
    ["Soft Motion Class", "motion-soft"],
    ["Petals Background Class", "bg-petals"],
    ["Caveat Font Family Variable", "--caveat"],
    ["Custom Background Base Color", "#180914"],
    ["Custom BG Color 1", "#ff1493"],
    ["Custom BG Color 2", "#db2777"],
    ["Custom BG Color 3", "#f472b6"],
    ["Reasons Section Title", "25 Reasons Why"],
    ["Reasons Section Heading", "Why You Are Extraordinary"],
    ["Reason 1 Title", "Your radiant smile"],
    ["Reason 2 Title", "Your thoughtful heart"],
    ["Reason 3 Title", "Your endless kindness"],
    ["Memories Section Heading", "Moments We Cherish"],
    ["Gallery Layout Scattered Setting", "scattered"],
    ["Letter Heading", "Dear Elena"],
    ["Letter Text", "May this next chapter be your brightest and most joyful one yet."],
    ["Letter Custom Color", "#4a154b"],
    ["Secret Section Heading", "Pack your bags!"],
    ["Secret Text", "We booked the weekend getaway to the mountains!"],
    ["Cake Section Heading", "Here's to 25!"],
    ["Cake Section Text", "Tap the candles to blow them out and make a wish."]
  ];

  let found = 0;
  for (const [label, text] of requiredSubstrings) {
    const v1 = text;
    const v2 = text.replace(/'/g, "&#x27;");
    const v3 = text.replace(/&#x27;/g, "'");
    if (!pageHtml.includes(v1) && !pageHtml.includes(v2) && !pageHtml.includes(v3)) {
      throw new Error(`FAIL: Rendered HTML missing: "${text}" (${label})`);
    }
    found++;
  }
  console.log(`✓ Passed all ${found} rendering content assertions (100% exact match)`);

  // Step D: Refresh test
  console.log("D. Testing page refresh (second GET /g/[token])...");
  const refreshRes = await fetch(`${baseUrl}/g/${token}`);
  if (refreshRes.status !== 200) {
    throw new Error(`FAIL: Refresh GET /g/${token} returned status ${refreshRes.status}`);
  }
  const refreshHtml = await refreshRes.text();
  for (const [label, text] of requiredSubstrings) {
    const v1 = text;
    const v2 = text.replace(/'/g, "&#x27;");
    const v3 = text.replace(/&#x27;/g, "'");
    if (!refreshHtml.includes(v1) && !refreshHtml.includes(v2) && !refreshHtml.includes(v3)) {
      throw new Error(`FAIL: Refreshed HTML missing: "${text}" (${label})`);
    }
  }
  console.log("✓ Refresh test passed: all custom configurations retrieved and rendered on refresh");

  // Step E: 404 test
  console.log("E. Testing invalid token (GET /g/invalid-token-xyz)...");
  const notFoundRes = await fetch(`${baseUrl}/g/invalid-token-xyz`);
  const notFoundHtml = await notFoundRes.text();
  if (!notFoundHtml.includes("This moment isn&#x27;t available") && !notFoundHtml.includes("This moment isn't available")) {
    throw new Error("FAIL: 404 page missing expected friendly message");
  }
  console.log("✓ Invalid token 404 handling passed");

  console.log("\n=======================================================");
  console.log("ALL TESTS (STORAGE & RENDERING FIDELITY) PASSED (100%)");
  console.log("=======================================================");
}

async function main() {
  const port = process.env.TEST_PORT || "3030";
  const baseUrl = `http://localhost:${port}`;

  await runStorageFidelityTest();
  await runRenderingFidelityTest(baseUrl);
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
