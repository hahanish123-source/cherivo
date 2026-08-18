"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from "lucide-react";

const pages=[
 {emoji:"💗",label:"A little beginning",title:"Happy Birthday, Someone Special",text:"Today is a little reminder of how much joy one person can bring into the lives around them."},
 {emoji:"🦋",label:"What I love",title:"What I love about you",text:"Your laugh. Your kindness. Your way of making ordinary days memorable."},
 {emoji:"📸",label:"Little moments",title:"Little moments, big memories",text:"A place for dates, photos and tiny stories that deserve to stay."},
 {emoji:"💌",label:"For you",title:"A little letter",text:"Write something only they should read here."},
 {emoji:"🎂",label:"Birthday moment",title:"Make a wish",text:"Tap the flames and watch a tiny puff of smoke rise when the candles go out."}
];
export default function Demo(){const [i,setI]=useState(0);const p=pages[i];return <main className="demoPage"><div className="demoTop"><Link href="/"><ArrowLeft size={16}/> Cherivo</Link><button type="button" onClick={()=>setI(0)}><RotateCcw size={15}/> Replay</button></div><div className="demoCard"><div className="demoHint"><Sparkles size={14}/> Interactive preview</div><div className="progress">{pages.map((_,n)=><i className={n<=i?"on":""} key={n}/>)}</div><div className="demoScene" key={i}><div className="demoEmoji">{p.emoji}</div><div className="eyebrow">{p.label}</div><h1>{p.title}</h1><p>{p.text}</p><div className="demoActions"><button type="button" onClick={()=>setI(Math.max(0,i-1))}><ArrowLeft size={16}/> Back</button>{i<pages.length-1?<button type="button" className="primary" onClick={()=>setI(i+1)}>Keep going <ArrowRight size={16}/></button>:<button type="button" className="primary" onClick={()=>setI(0)}>Replay</button>}</div></div></div></main>}
