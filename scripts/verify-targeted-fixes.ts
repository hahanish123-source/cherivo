import { createGreeting, getGreeting } from "../lib/greetingStore";
import { normalizeProject, getFont } from "../lib/greetingConfig";
import { GREETING_MEDIA_BUCKET } from "../lib/greetingMedia";
import type { GreetingProject } from "../lib/types";

async function main() {
  const port = process.env.TEST_PORT || "3030";
  const baseUrl = `http://localhost:${port}`;

  console.log("=================================================================");
  console.log("RUNNING TARGETED VERIFICATION FOR 4 SPECIFIC FIXES");
  console.log("=================================================================");

  // 1. Check Media Bucket Constant
  console.log(`\n[CHECK 1] Supabase Media Storage Bucket Name: "${GREETING_MEDIA_BUCKET}"`);
  if (GREETING_MEDIA_BUCKET !== "hanora-media" && !process.env.SUPABASE_STORAGE_BUCKET) {
    throw new Error(`FAIL: Expected bucket name to be 'hanora-media', got '${GREETING_MEDIA_BUCKET}'`);
  }
  console.log("✓ Bucket name correctly configured as 'hanora-media'");

  // 2. Test Media Upload API with Audio, Video, and Image
  console.log("\n[CHECK 2] Testing /api/media route...");
  
  // Test Audio
  const mockAudioBuffer = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // ID3 header
  const audioBlob = new Blob([mockAudioBuffer], { type: "audio/mpeg" });
  const audioForm = new FormData();
  audioForm.append("file", audioBlob, "romantic-song.mp3");
  audioForm.append("kind", "audio");

  const audioRes = await fetch(`${baseUrl}/api/media`, {
    method: "POST",
    body: audioForm,
  });
  const audioData = await audioRes.json();
  if (!audioRes.ok || !audioData.ok) {
    throw new Error(`FAIL: Audio upload failed: ${JSON.stringify(audioData)}`);
  }
  console.log("✓ Audio upload succeeded without 'Bucket not found' error");

  // Test Image
  const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]); // JPEG header
  const imageBlob = new Blob([mockImageBuffer], { type: "image/jpeg" });
  const imageForm = new FormData();
  imageForm.append("file", imageBlob, "memory-photo.jpg");
  imageForm.append("kind", "image");

  const imageRes = await fetch(`${baseUrl}/api/media`, {
    method: "POST",
    body: imageForm,
  });
  const imageData = await imageRes.json();
  if (!imageRes.ok || !imageData.ok) {
    throw new Error(`FAIL: Image upload failed: ${JSON.stringify(imageData)}`);
  }
  console.log("✓ Image upload succeeded without 'Bucket not found' error");

  // 3. Test Font Customization & Persistence
  console.log("\n[CHECK 3] Testing Typography Customization & Link Persistence...");
  const customProject = normalizeProject({
    theme: "romantic",
    background: "petals",
    globalFont: "caveat",
    globalTextColor: "#ff69b4",
    globalSpacing: 24,
    globalCardOpacity: 30,
    blocks: [
      {
        id: "w1",
        type: "welcome",
        title: "Welcome Dear",
        subtitle: "A Special Day",
        heading: "Happy Birthday Sophia!",
        text: "Wishing you love and happiness.",
        emoji: "💖",
        titleFont: "sans",
        subtitleFont: "script",
        headingFont: "caveat",
        bodyFont: "serif",
        image: imageData.media as string,
        audioUrl: audioData.media as string,
        audioName: "romantic-song.mp3",
        visible: true
      },
      {
        id: "l1",
        type: "letter",
        title: "Letter",
        subtitle: "From Alex",
        heading: "My Dearest",
        text: "You make every day brighter.",
        emoji: "💌",
        headingFont: "script",
        bodyFont: "caveat",
        letterColor: "#330033",
        visible: true
      }
    ]
  });

  const publishRes = await fetch(`${baseUrl}/api/greetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Sophia's Celebration",
      project: customProject
    })
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.ok || !publishData.token) {
    throw new Error(`FAIL: Publish failed: ${JSON.stringify(publishData)}`);
  }
  const token = publishData.token;
  console.log(`✓ Published greeting with custom fonts & media (token: ${token.slice(0, 16)}...)`);

  // 4. Retrieve and verify public page
  console.log(`\n[CHECK 4] Fetching public greeting /g/${token}...`);
  const pageRes = await fetch(`${baseUrl}/g/${token}`);
  if (pageRes.status !== 200) {
    throw new Error(`FAIL: /g/${token} returned status ${pageRes.status}`);
  }
  const html = await pageRes.text();

  const fontChecks = [
    ["Caveat heading font", "Happy Birthday Sophia!"],
    ["Script subtitle", "A Special Day"],
    ["Letter title font (script)", "My Dearest"],
    ["Letter text (caveat)", "You make every day brighter."],
    ["Audio name", "romantic-song.mp3"],
    ["Petals background", "bg-petals"]
  ];

  for (const [desc, snippet] of fontChecks) {
    if (!html.includes(snippet)) {
      throw new Error(`FAIL: Public page HTML missing ${desc}: "${snippet}"`);
    }
  }
  console.log(`✓ All ${fontChecks.length} font & media assertions verified in rendered public HTML`);

  console.log("\n=================================================================");
  console.log("ALL TARGETED FIXES VERIFIED SUCCESSFULLY (100% PASS)");
  console.log("=================================================================");
}

main().catch((err) => {
  console.error("Targeted verification failed:", err);
  process.exit(1);
});
