import Link from "next/link";

const features = [
  ["📸","Photo worlds","Turn memories into galleries, polaroids and full-screen moments."],
  ["💌","Letters","Write a tiny note or a whole chapter. Change every word, font and colour."],
  ["📅","Memory timeline","Give each memory a date, photo, title and story."],
  ["🔐","Private surprises","Secrets, PIN reveals and hidden moments are optional, never forced."],
  ["🎵","Music & motion","Add a song, choose transitions and make every scene feel alive."],
  ["🎨","Total control","Theme, background, typography, spacing, cards and animations are yours."]
];

export default function Home(){
  return <main className="siteShell landingPage">
    <header className="siteNav"><Link href="/" className="logo">CHERIVO<span>•</span></Link><nav><a href="#how">How it works</a><a href="#features">Features</a><Link href="/create" className="navButton">Create</Link></nav></header>
    <section className="landingHero"><div className="heroCopy"><span className="eyebrow">CREATE MOMENTS • SHARE FEELINGS</span><h1>Make something<br/>they'll <em>keep forever.</em></h1><p>Build a private interactive greeting from your words, photos, memories, music and little surprises. Start beautiful, then customise absolutely everything.</p><div className="heroActions"><Link href="/create" className="btn primary big">Create a moment <span>→</span></Link><a href="#how" className="btn">See how it works</a></div><small>Everything is optional. Nothing is locked.</small></div><div className="landingVisual"><div className="visualGlow"/><div className="floatingCard cardOne">💌<b>A little letter</b><span>Only they should read this.</span></div><div className="visualCenter"><span>💗</span><h2>Something<br/><em>made for them.</em></h2><p>Photos · memories · words · surprises</p></div><div className="floatingCard cardTwo">🎵<b>Your song</b><span>Play it when the moment feels right.</span></div></div></section>
    <section id="how" className="darkSection"><div className="sectionHeading"><span>01</span><h2>Three steps.<br/><em>One feeling.</em></h2></div><div className="stepGrid">{[["01","Choose the moment","Birthday, anniversary, love letter, friendship or simply a day worth remembering."],["02","Make it yours","Edit the defaults, add your own sections, upload photos, choose music and style every detail."],["03","Share one private link","They open the greeting. Nobody else needs an account or an app."]].map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div></section>
    <section id="features" className="darkSection softer"><div className="sectionHeading"><span>02</span><h2>Beautiful by default.<br/><em>Flexible by design.</em></h2></div><div className="featureGridDark">{features.map(([i,t,d])=><article key={t}><div>{i}</div><h3>{t}</h3><p>{d}</p></article>)}</div></section>
    <section className="finalCTA"><span className="eyebrow">THEIR DAY IS COMING</span><h2>Make it feel like<br/><em>them.</em></h2><p>Open the editor. Change anything. Add what matters. Delete what doesn't.</p><Link href="/create" className="btn primary big">Begin creating →</Link></section>
    <footer className="siteFooter"><span>CHERIVO<span>•</span></span><small>Private moments, made carefully.</small><small>made with care · H</small></footer>
  </main>
}
