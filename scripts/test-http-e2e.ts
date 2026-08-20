async function runHttpTest() {
  console.log("==================================================");
  console.log("HANORA FULL HTTP END-TO-END FLOW TEST");
  console.log("==================================================");

  const baseUrl = "http://localhost:3030";

  // Step 1: Health check
  console.log("1. Testing GET /api/greetings...");
  const healthRes = await fetch(`${baseUrl}/api/greetings`);
  const healthData = await healthRes.json();
  if (!healthRes.ok || !healthData.ok) {
    throw new Error("GET /api/greetings failed: " + JSON.stringify(healthData));
  }
  console.log("✓ API Health Check: OK", healthData.mode);

  // Step 2: Publish a fully customized greeting
  console.log("2. Testing POST /api/greetings (publishing custom greeting)...");
  const customPayload = {
    title: "Sophia's Dreamy Birthday Celebration",
    project: {
      blocks: [
        {
          id: "welcome-1",
          type: "welcome",
          title: "To Dearest Sophia",
          subtitle: "A Wonderful Milestone",
          heading: "Happy 21st Birthday, Sophia!",
          text: "May your day be filled with sparkle, endless smiles, and beautiful memories.",
          emoji: "🌸",
          font: "caveat",
          titleFont: "caveat",
          subtitleFont: "script",
          headingFont: "caveat",
          bodyFont: "caveat",
          accent: "#ff3d78",
          headingColor: "#fff0f7",
          subtitleColor: "#ff86b0",
          bodyColor: "#fce7f3",
          emojiColor: "#ff3d78",
          headingSize: 80,
          bodySize: 19,
          lineHeight: 1.75,
          letterSpacing: 0,
          radius: 26,
          cardColor: "#ffffff",
          cardOpacity: 16,
          imageOpacity: 100,
          visible: true
        },
        {
          id: "reasons-1",
          type: "reasons",
          title: "Things We Love",
          subtitle: "Reasons",
          heading: "Why You Are So Cherished",
          text: "Every day with you is brighter.",
          emoji: "✨",
          font: "caveat",
          titleFont: "caveat",
          subtitleFont: "sans",
          headingFont: "caveat",
          bodyFont: "sans",
          accent: "#ff3d78",
          headingColor: "#fff0f7",
          subtitleColor: "#ff86b0",
          bodyColor: "#fce7f3",
          emojiColor: "#ff3d78",
          headingSize: 72,
          bodySize: 17,
          lineHeight: 1.75,
          letterSpacing: 0,
          radius: 24,
          cardColor: "#ffffff",
          cardOpacity: 14,
          imageOpacity: 100,
          visible: true,
          items: [
            { id: "r1", title: "Your sparkling laughter", text: "It brings pure joy everywhere you go.", emoji: "💖" },
            { id: "r2", title: "Your infinite empathy", text: "The way you listen and care so deeply.", emoji: "🌟" }
          ]
        },
        {
          id: "cake-1",
          type: "cake",
          title: "Make a Wish",
          subtitle: "Blow the Candles",
          heading: "A Wish for Year 21",
          text: "Tap the candles to blow them out!",
          emoji: "🎂",
          font: "caveat",
          titleFont: "caveat",
          subtitleFont: "caveat",
          headingFont: "caveat",
          bodyFont: "caveat",
          accent: "#ffb45c",
          headingColor: "#fff0f7",
          subtitleColor: "#ff86b0",
          bodyColor: "#fce7f3",
          emojiColor: "#ffb45c",
          headingSize: 70,
          bodySize: 18,
          lineHeight: 1.75,
          letterSpacing: 0,
          radius: 24,
          cardColor: "#ffffff",
          cardOpacity: 14,
          imageOpacity: 100,
          visible: true
        }
      ],
      theme: "romantic",
      background: "petals",
      globalFont: "caveat",
      globalTextColor: "#fff8fc",
      globalCardOpacity: 20,
      globalRadius: 26,
      globalSpacing: 20,
      globalMotion: "soft",
      backgroundBaseColor: "#160914",
      bgColor1: "#ff3d78",
      bgColor2: "#ff86b0",
      bgColor3: "#fda4af",
      bgColor4: "#f59e0b",
      backgroundOverlay: 20
    }
  };

  const publishRes = await fetch(`${baseUrl}/api/greetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customPayload)
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.ok || !publishData.token) {
    throw new Error("POST /api/greetings failed: " + JSON.stringify(publishData));
  }

  const { token, url } = publishData;
  console.log(`✓ Published greeting successfully! Token: ${token.slice(0, 16)}... URL: ${url}`);

  // Step 3: Fetch the generated greeting page via HTTP
  console.log(`3. Testing GET /g/${token}...`);
  const pageRes = await fetch(`${baseUrl}/g/${token}`);
  if (!pageRes.ok) {
    throw new Error(`GET /g/${token} returned status ${pageRes.status}`);
  }

  const pageHtml = await pageRes.text();
  console.log(`✓ Greeting page response: HTTP ${pageRes.status} (${pageHtml.length} bytes)`);

  // Verify critical custom content is rendered in the HTML
  const checks = [
    ["Page Title / Kicker", "To Dearest Sophia"],
    ["Hero Heading", "Happy 21st Birthday, Sophia!"],
    ["Hero Message", "May your day be filled with sparkle, endless smiles, and beautiful memories."],
    ["Reasons Heading", "Why You Are So Cherished"],
    ["Reason 1 Title", "Your sparkling laughter"],
    ["Reason 2 Title", "Your infinite empathy"],
    ["Cake Heading", "A Wish for Year 21"],
    ["Theme class", "theme-romantic"],
    ["Background class", "bg-petals"],
    ["Motion class", "motion-soft"]
  ];

  let matches = 0;
  for (const [label, expectedText] of checks) {
    if (!pageHtml.includes(expectedText)) {
      throw new Error(`FAIL: Generated HTML missing expected content: "${expectedText}" (${label})`);
    }
    matches++;
  }
  console.log(`✓ Verified ${matches}/${checks.length} custom content strings rendered in HTML!`);

  // Step 4: Test 404 fallback with invalid token
  console.log("4. Testing GET /g/non-existent-token-12345 (404 handling)...");
  const missingRes = await fetch(`${baseUrl}/g/non-existent-token-12345`);
  const missingHtml = await missingRes.text();
  if (!missingHtml.includes("This moment isn&#x27;t available") && !missingHtml.includes("This moment isn't available")) {
    throw new Error("FAIL: 404 page missing expected friendly message");
  }
  console.log("✓ Friendly 404 handling verified!");

  console.log("==================================================");
  console.log("ALL HTTP END-TO-END TESTS PASSED (100%)");
  console.log("==================================================");
}

runHttpTest().catch((err) => {
  console.error("HTTP Test failed:", err);
  process.exit(1);
});
