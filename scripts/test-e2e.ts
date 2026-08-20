import { createGreeting, getGreeting } from "../lib/greetingStore";
import { normalizeProject } from "../lib/greetingConfig";
import type { GreetingProject } from "../lib/types";

async function runTest() {
  console.log("==================================================");
  console.log("HANORA END-TO-END PERSISTENCE & PARITY TEST");
  console.log("==================================================");

  const customPayload: GreetingProject = {
    blocks: [
      {
        id: "welcome-test",
        type: "welcome",
        title: "To My Favorite Person",
        subtitle: "Special Day",
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
        image: "data:image/jpeg;base64,test-image-welcome"
      },
      {
        id: "reasons-test",
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
          { id: "r2", title: "Your thoughtful heart", text: "Always putting others first.", emoji: "🌸" }
        ]
      },
      {
        id: "memories-test",
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
        imageOpacity: 100,
        visible: true,
        images: [
          "data:image/jpeg;base64,photo1",
          "data:image/jpeg;base64,photo2"
        ],
        imageAdjustments: {
          "0": { scale: 120, x: 45, y: 55 },
          "1": { scale: 110, x: 50, y: 50 }
        }
      },
      {
        id: "letter-test",
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
        imageOpacity: 100,
        visible: true
      },
      {
        id: "secret-test",
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
        id: "cake-test",
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
    globalFont: "caveat",
    globalTextColor: "#fff0f7",
    globalCardOpacity: 25,
    globalRadius: 28,
    globalSpacing: 22,
    globalMotion: "soft",
    backgroundBaseColor: "#180914",
    bgColor1: "#ff1493",
    bgColor2: "#db2777",
    bgColor3: "#f472b6",
    bgColor4: "#fda4af",
    backgroundOverlay: 25
  };

  const title = "Elena's 25th Birthday Celebration";

  // Step 1: Normalization test
  const normalized = normalizeProject(customPayload);
  console.log("1. Project normalization check: PASSED");

  // Step 2: Save to storage
  const { token } = await createGreeting(title, normalized as unknown as Record<string, unknown>);
  console.log(`2. Greeting creation & token generation check: PASSED (token: ${token.slice(0, 16)}...)`);

  // Step 3: Retrieve from storage
  const retrieved = await getGreeting(token);
  if (!retrieved) {
    throw new Error("FAIL: Could not retrieve greeting by token: " + token);
  }
  console.log("3. Storage retrieval check: PASSED");

  // Step 4: Verify title
  if (retrieved.title !== title) {
    throw new Error(`FAIL: Title mismatch: expected "${title}", got "${retrieved.title}"`);
  }
  console.log("4. Title match check: PASSED");

  // Step 5: Verify all project properties
  const retrievedData = normalizeProject(retrieved.data);
  const checks: [string, any, any][] = [
    ["Theme", retrievedData.theme, customPayload.theme],
    ["Background", retrievedData.background, customPayload.background],
    ["Global Font", retrievedData.globalFont, customPayload.globalFont],
    ["Global Text Color", retrievedData.globalTextColor, customPayload.globalTextColor],
    ["Global Card Opacity", retrievedData.globalCardOpacity, customPayload.globalCardOpacity],
    ["Global Radius", retrievedData.globalRadius, customPayload.globalRadius],
    ["Global Spacing", retrievedData.globalSpacing, customPayload.globalSpacing],
    ["Global Motion", retrievedData.globalMotion, customPayload.globalMotion],
    ["Background Base Color", retrievedData.backgroundBaseColor, customPayload.backgroundBaseColor],
    ["BG Color 1", retrievedData.bgColor1, customPayload.bgColor1],
    ["BG Color 2", retrievedData.bgColor2, customPayload.bgColor2],
    ["BG Color 3", retrievedData.bgColor3, customPayload.bgColor3],
    ["BG Color 4", retrievedData.bgColor4, customPayload.bgColor4],
    ["Background Overlay", retrievedData.backgroundOverlay, customPayload.backgroundOverlay],
    ["Blocks count", retrievedData.blocks.length, customPayload.blocks.length],
    ["Welcome Title (Kicker)", retrievedData.blocks[0].title, customPayload.blocks[0].title],
    ["Welcome Subtitle (Eyebrow)", retrievedData.blocks[0].subtitle, customPayload.blocks[0].subtitle],
    ["Welcome Heading", retrievedData.blocks[0].heading, customPayload.blocks[0].heading],
    ["Welcome Text", retrievedData.blocks[0].text, customPayload.blocks[0].text],
    ["Welcome Font", retrievedData.blocks[0].headingFont, "caveat"],
    ["Welcome Heading Size", retrievedData.blocks[0].headingSize, 85],
    ["Welcome Body Size", retrievedData.blocks[0].bodySize, 20],
    ["Welcome Line Height", retrievedData.blocks[0].lineHeight, 1.8],
    ["Welcome Letter Spacing", retrievedData.blocks[0].letterSpacing, 1],
    ["Welcome Card Radius", retrievedData.blocks[0].radius, 28],
    ["Welcome Card Opacity", retrievedData.blocks[0].cardOpacity, 35],
    ["Welcome Image", retrievedData.blocks[0].image, customPayload.blocks[0].image],
    ["Reasons Items Count", retrievedData.blocks[1].items?.length, 2],
    ["Reasons First Title", retrievedData.blocks[1].items?.[0]?.title, "Your radiant smile"],
    ["Reasons First Text", retrievedData.blocks[1].items?.[0]?.text, "Lights up any room instantly."],
    ["Reasons First Emoji", retrievedData.blocks[1].items?.[0]?.emoji, "🌟"],
    ["Memories Layout", retrievedData.blocks[2].galleryLayout, "scattered"],
    ["Memories Images Count", retrievedData.blocks[2].images?.length, 2],
    ["Memories Image Adjustments", retrievedData.blocks[2].imageAdjustments?.["0"]?.scale, 120],
    ["Letter Heading", retrievedData.blocks[3].heading, "Dear Elena"],
    ["Letter Text", retrievedData.blocks[3].text, customPayload.blocks[3].text],
    ["Letter Color", retrievedData.blocks[3].letterColor, "#4a154b"],
    ["Letter Size", retrievedData.blocks[3].letterSize, 20],
    ["Letter Line Height", retrievedData.blocks[3].letterLineHeight, 1.9],
    ["Letter Align", retrievedData.blocks[3].letterAlign, "left"],
    ["Secret Heading", retrievedData.blocks[4].heading, "Pack your bags!"],
    ["Secret Text", retrievedData.blocks[4].text, "We booked the weekend getaway to the mountains!"],
    ["Cake Heading", retrievedData.blocks[5].heading, "Here's to 25!"],
    ["Cake Text", retrievedData.blocks[5].text, customPayload.blocks[5].text]
  ];

  let passed = 0;
  for (const [name, actual, expected] of checks) {
    if (actual !== expected) {
      throw new Error(`FAIL: Assertion failed for ${name}: expected ${expected}, got ${actual}`);
    }
    passed++;
  }

  console.log(`5. Exact property parity check: PASSED (${passed}/${checks.length} field assertions verified)`);
  console.log("==================================================");
  console.log("ALL PERSISTENCE AND PARITY CHECKS PASSED (100%)");
  console.log("==================================================");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
