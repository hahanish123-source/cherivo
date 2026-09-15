import Link from "next/link";
import { WebsiteThemeToggle } from "@/components/WebsiteThemeToggle";

const steps = [
  {
    step: "01",
    title: "Curate the Moment",
    desc: "Birthday, anniversary, love letter, cherished memories, or simply a day worth celebrating forever.",
    icon: "✨",
    tag: "Themes & Layouts"
  },
  {
    step: "02",
    title: "Craft with Intention",
    desc: "Personalize with heartfelt letters, surprise media reveals, interactive cakes, music, and bespoke typography.",
    icon: "🎨",
    tag: "Visual Story Studio"
  },
  {
    step: "03",
    title: "Share One Private Link",
    desc: "Your recipient opens an unforgettable cinematic greeting on any phone or desktop instantly. No app or signup needed.",
    icon: "💌",
    tag: "Instant Experience"
  }
];

const highlights = [
  { icon: "✨", title: "Liquid Glass Transitions", desc: "Silky smooth scene fades, particle disintegrations, and light sweep sheens." },
  { icon: "🎂", title: "Interactive Celebration Cakes", desc: "Real blowing flame physics, delicate sparkler fountains, and joyful confetti." },
  { icon: "🎵", title: "Cinematic Background Melodies", desc: "Immersive background music that begins playing the moment your recipient opens their card." },
  { icon: "🔒", title: "Private & Ad-Free Forever", desc: "No signups required for recipients. Secure, direct links with no third-party tracking." }
];

export default function Home() {
  return (
    <main className="siteShell landingPage">
      <header className="siteNav">
        <Link href="/" className="logo animatedLogoGlow">
          Hamora<span className="logoDotPulse">•</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="#how" className="navLinkHover">How it works</a>
          <a href="#highlights" className="navLinkHover">Features</a>
          <WebsiteThemeToggle />
          <Link href="/create" className="navButton luxuryGlowBtn">
            <span>Create Greeting</span>
          </Link>
        </nav>
      </header>

      <section className="landingHero">
        <div className="heroCopy">
          <div className="luxuryEyebrowBadge animSlideDown">
            <span className="sparkleGold rotateStar">✦</span> BESPOKE DIGITAL MOMENTS & KEEPSAKES <span className="sparkleGold rotateStarRev">✦</span>
          </div>
          <h1 className="animTitleShimmer">
            Make something<br />
            they&apos;ll <em className="animatedGradientText">treasure forever.</em>
          </h1>
          <p className="animFadeUp">
            Hamora is an ultra-premium creative studio for crafting breathtaking, interactive personal greetings, heartfelt letters, and memorable digital keepsakes shared through private links.
          </p>
          <div className="heroActions animFadeUp">
            <Link href="/create" className="btn primary big luxuryPrimaryBtn glowingSweep">
              <span>Begin Creating</span> <span className="btnArrowAnim">→</span>
            </Link>
            <a href="#preview" className="btn luxuryGhostBtn">Explore Live Demo</a>
          </div>
          <div className="luxuryFeaturePillsRow animFadeUp">
            <span className="featurePillItem"><span className="pillSparkle">✦</span> 100% Free to Try</span>
            <span className="featurePillItem"><span className="pillSparkle">✦</span> No App Required</span>
            <span className="featurePillItem"><span className="pillSparkle">✦</span> Full Mobile Parity</span>
          </div>
        </div>

        <div className="landingVisual luxuryVisualStage">
          <div className="visualGlow luxuryAura animatedAuraPulse" />
          <div className="floatingCard cardOne luxuryFloatingGlass floatPhysicsA">
            <span className="floatingCardIcon">💌</span>
            <div className="floatingCardBody">
              <b className="floatingCardTitle">A Heartfelt Letter</b>
              <span className="floatingCardDesc">Crafted for their eyes only</span>
            </div>
          </div>
          <div className="visualCenter">
            <span className="luxuryHeartIcon pulseHeartAnim">💖</span>
            <h2>
              Designed for<br />
              <em className="animatedGradientText">pure emotion.</em>
            </h2>
            <p>Interactive Cakes · Secret Reveals · Audio · Memories</p>
          </div>
          <div className="floatingCard cardTwo luxuryFloatingGlass floatPhysicsB">
            <span className="floatingCardIcon">🎵</span>
            <div className="floatingCardBody">
              <b className="floatingCardTitle">Your Chosen Melody</b>
              <span className="floatingCardDesc">Plays the moment they arrive</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Showcase */}
      <section id="highlights" className="highlightsSection">
        <div className="sectionHeading animScrollReveal">
          <div className="luxuryEyebrowBadge" style={{ margin: "0 auto 10px" }}>
            <span className="sparkleGold">✦</span> CRAFTED FOR EMOTION <span className="sparkleGold">✦</span>
          </div>
          <h2>
            Every detail designed to<br />
            <em className="animatedGradientText">take their breath away.</em>
          </h2>
        </div>

        <div className="highlightsGrid">
          {highlights.map((h, i) => (
            <div key={i} className="highlightCard luxuryGlassCard">
              <div className="highlightIconBubble">{h.icon}</div>
              <h3>{h.title}</h3>
              <p>{h.desc}</p>
              <div className="highlightGlowCorner" />
            </div>
          ))}
        </div>
      </section>

      {/* 3 Steps How It Works */}
      <section id="how" className="darkSection luxurySectionWrap">
        <div className="sectionHeading animScrollReveal">
          <span className="stepCountBadge">SIMPLE & EFFORTLESS</span>
          <h2>
            Three steps.<br />
            <em className="animatedGradientText">One unforgettable feeling.</em>
          </h2>
        </div>
        <div className="stepGrid">
          {steps.map(({ step, title, desc, icon, tag }) => (
            <article key={step} className="luxuryStepCard interactiveTiltCard">
              <div className="stepCardGleam" />
              <div className="stepHeader">
                <span className="stepNumberGold glowNum">{step}</span>
                <span className="stepIconEmoji bounceEmoji">{icon}</span>
              </div>
              <span className="stepMiniTag">{tag}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Final Animated CTA */}
      <section className="finalCTA luxuryCtaWrap animScrollReveal">
        <div className="ctaGlowingBackdrop" />
        <div className="luxuryEyebrowBadge" style={{ margin: "0 auto 12px" }}>
          <span className="sparkleGold">✦</span> THE PERFECT CELEBRATION <span className="sparkleGold">✦</span>
        </div>
        <h2>
          Make it feel truly<br />
          <em className="animatedGradientText">unforgettable.</em>
        </h2>
        <p>Step into the creative studio. Customize every word, photo, melody, and animation to perfection.</p>
        <Link href="/create" className="btn primary big luxuryPrimaryBtn glowingSweep" style={{ margin: "22px auto 0" }}>
          <span>Create Your Greeting Now</span> <span className="btnArrowAnim">→</span>
        </Link>
      </section>

      <footer className="siteFooter luxuryFooter">
        <span className="logo animatedLogoGlow">Hamora<span className="logoDotPulse">•</span></span>
        <small>Bespoke digital moments, crafted with elegance.</small>
        <small>© Hamora • Ultra-Premium Keepsakes</small>
      </footer>
    </main>
  );
}


