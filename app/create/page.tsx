"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import Link from "next/link";
import type { StoredMedia } from "@/lib/greetingMedia";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Cake, Eye, EyeOff,
  Image as ImageIcon, Mail, Music2, Pencil, Plus, RotateCcw,
  Sparkles, Trash2, X
} from "lucide-react";

type BlockType = "welcome" | "reasons" | "memories" | "letter" | "secret" | "cake" | "text" | "image" | "music" | "gallery" | "custom";
type FontName = "sans" | "serif" | "script" | "caveat";

type ReasonItem = { id: string; title: string; text: string; emoji: string };
type MediaValue = string | StoredMedia;
type Block = {
  id: string; type: BlockType; title: string; subtitle: string; heading: string; text: string; emoji: string;
  font: FontName; titleFont: FontName; subtitleFont: FontName; headingFont: FontName; bodyFont: FontName;
  accent: string; headingColor: string; subtitleColor: string; bodyColor: string; emojiColor: string; headingSize: number; bodySize: number; lineHeight: number;
  letterSpacing: number; radius: number; cardColor: string; cardOpacity: number; image?: string; images?: string[]; imageOpacity: number; backgroundVideo?: MediaValue; backgroundVideoOpacity?: number; audioName?: string; audioUrl?: MediaValue; galleryLayout?: string; visible: boolean; items?: ReasonItem[];
};

const reasonDefaults: ReasonItem[] = [
  {id:"r1", title:"Your laugh", text:"The way your laugh makes an ordinary moment feel lighter.", emoji:"😊"},
  {id:"r2", title:"Your kindness", text:"The little things you do that make people feel seen.", emoji:"💗"},
  {id:"r3", title:"Your way of making ordinary days memorable", text:"Somehow even the smallest moments become memories with you.", emoji:"✨"}
];

const defaults: Block[] = [
  {id:"welcome",type:"welcome",title:"Welcome",subtitle:"A little beginning",heading:"Happy Birthday, Someone Special",text:"Today is a little reminder of how much joy one person can bring into the lives around them.",emoji:"💗",font:"serif",titleFont:"sans",subtitleFont:"sans",headingFont:"serif",bodyFont:"sans",accent:"#ff4f8b",headingColor:"#fff7fb",subtitleColor:"#ff9fc2",bodyColor:"#c8bacb",emojiColor:"#ff86b0",headingSize:70,bodySize:17,lineHeight:1.75,letterSpacing:0,radius:21,cardColor:"#ffffff",cardOpacity:14,imageOpacity:100,visible:true},
  {id:"reasons",type:"reasons",title:"What I Love",subtitle:"Reasons",heading:"What I love about you",text:"Every little reason is yours to rewrite.",emoji:"🦋",font:"serif",titleFont:"sans",subtitleFont:"sans",headingFont:"serif",bodyFont:"sans",accent:"#ff6f9e",headingColor:"#fff7fb",subtitleColor:"#ff9fc2",bodyColor:"#c8bacb",emojiColor:"#ff86b0",headingSize:70,bodySize:17,lineHeight:1.75,letterSpacing:0,radius:21,cardColor:"#ffffff",cardOpacity:14,imageOpacity:100,visible:true,items:reasonDefaults},
  {id:"memories",type:"memories",title:"Our Memories",subtitle:"Little moments",heading:"Little moments, big memories",text:"Add dates, photos and tiny stories that deserve to stay.",emoji:"📸",font:"serif",titleFont:"sans",subtitleFont:"sans",headingFont:"serif",bodyFont:"sans",accent:"#c084fc",headingColor:"#fff7fb",subtitleColor:"#ff9fc2",bodyColor:"#c8bacb",emojiColor:"#ff86b0",headingSize:70,bodySize:17,lineHeight:1.75,letterSpacing:0,radius:21,cardColor:"#ffffff",cardOpacity:14,imageOpacity:100,visible:true},
  {id:"letter",type:"letter",title:"A Letter",subtitle:"For you",heading:"A little letter",text:"Write something only they should read here.",emoji:"💌",font:"script",titleFont:"sans",subtitleFont:"script",headingFont:"script",bodyFont:"serif",accent:"#ff86b0",headingColor:"#fff7fb",subtitleColor:"#ff9fc2",bodyColor:"#c8bacb",emojiColor:"#ff86b0",headingSize:70,bodySize:17,lineHeight:1.75,letterSpacing:0,radius:21,cardColor:"#ffffff",cardOpacity:14,imageOpacity:100,visible:true},
  {id:"secret",type:"secret",title:"One More Thing",subtitle:"A secret reveal",heading:"There's one more thing...",text:"Tap the heart to reveal what comes next.",emoji:"💗",font:"serif",titleFont:"sans",subtitleFont:"sans",headingFont:"serif",bodyFont:"sans",accent:"#ff3d78",headingColor:"#fff7fb",subtitleColor:"#ff9fc2",bodyColor:"#c8bacb",emojiColor:"#ff86b0",headingSize:70,bodySize:17,lineHeight:1.75,letterSpacing:0,radius:21,cardColor:"#ffffff",cardOpacity:14,imageOpacity:100,visible:true},
  {id:"cake",type:"cake",title:"Make a Wish",subtitle:"Birthday moment",heading:"Make a wish",text:"Blow the candles or tap them.",emoji:"🎂",font:"serif",titleFont:"sans",subtitleFont:"sans",headingFont:"serif",bodyFont:"sans",accent:"#ffb45c",headingColor:"#fff7fb",subtitleColor:"#ff9fc2",bodyColor:"#c8bacb",emojiColor:"#ff86b0",headingSize:70,bodySize:17,lineHeight:1.75,letterSpacing:0,radius:21,cardColor:"#ffffff",cardOpacity:14,imageOpacity:100,visible:true}
];

const themes: Record<string,[string,string,string,string]> = {
  dark:["#0b0810","#ff4f8b","#ff9fc2","#fff7fb"],
  light:["#fff7f4","#d34f75","#a23d60","#2d2027"],
  system:["#101015","#e879a0","#f4a6c0","#f8f7fb"],
  romantic:["#160914","#ff3d78","#ff86b0","#fff4f8"],
  dreamy:["#0d1020","#9b7cff","#cbbdff","#f7f5ff"]
};

const backgrounds: Record<string,string> = {
  aurora:"radial-gradient(circle at 12% 18%, rgba(255,61,120,.52), transparent 28%),radial-gradient(circle at 88% 18%, rgba(124,92,255,.58), transparent 30%),radial-gradient(circle at 72% 82%, rgba(34,211,238,.26), transparent 28%),linear-gradient(135deg,#090713 0%,#21102e 48%,#070914 100%)",
  mesh:"radial-gradient(circle at 15% 20%, rgba(255,70,150,.64), transparent 25%),radial-gradient(circle at 82% 18%, rgba(126,87,255,.62), transparent 28%),radial-gradient(circle at 72% 78%, rgba(0,220,210,.34), transparent 26%),radial-gradient(circle at 20% 82%, rgba(255,170,65,.24), transparent 25%),linear-gradient(120deg,#130a18,#27123a 45%,#08141b)",
  gradient:"linear-gradient(125deg,#ff4f8b 0%,#a855f7 38%,#38bdf8 72%,#111827 100%)",
  stars:"radial-gradient(circle at 20% 25%,#ffffffaa 0 1px,transparent 2px),radial-gradient(circle at 70% 18%,#ffffff88 0 1px,transparent 2px),linear-gradient(145deg,#070611,#15102b 55%,#050611)",
  minimal:"radial-gradient(circle at 50% 15%, rgba(255,255,255,.16), transparent 28%),linear-gradient(180deg,#17131b,#0a090d)",
  lightGradient:"linear-gradient(135deg,#fff0f5 0%,#f4e9ff 45%,#e8f7ff 100%)"
};

function uid(){return Math.random().toString(36).slice(2,10)}
function normalizeBlock(raw:any):Block{
  const items = raw?.type === "reasons"
    ? (Array.isArray(raw.items) ? raw.items.map((x:any,i:number)=>typeof x === "string" ? ({id:`legacy-${i}`,title:x,text:"Make this reason yours.",emoji:"✨"}) : ({id:x.id ?? uid(),title:x.title ?? "A reason",text:x.text ?? "Make this reason yours.",emoji:x.emoji ?? "✨"})) : reasonDefaults)
    : undefined;
  return {
    ...raw,
    title:raw?.title ?? "Untitled section", subtitle:raw?.subtitle ?? "A little moment", heading:raw?.heading ?? "Your moment",
    text:raw?.text ?? "Write something beautiful.", emoji:raw?.emoji ?? "✨", font:raw?.font ?? "serif",
    titleFont:raw?.titleFont ?? "sans", subtitleFont:raw?.subtitleFont ?? "sans", headingFont:raw?.headingFont ?? raw?.font ?? "serif", bodyFont:raw?.bodyFont ?? "sans", accent:raw?.accent ?? "#ff4f8b", headingColor:raw?.headingColor ?? "#fff7fb", subtitleColor:raw?.subtitleColor ?? "#ff9fc2", bodyColor:raw?.bodyColor ?? "#c8bacb", emojiColor:raw?.emojiColor ?? "#ff86b0",
    headingSize:Number(raw?.headingSize ?? 70), bodySize:Number(raw?.bodySize ?? 17), lineHeight:Number(raw?.lineHeight ?? 1.75),
    letterSpacing:Number(raw?.letterSpacing ?? 0), radius:Number(raw?.radius ?? 21), cardColor:raw?.cardColor ?? "#ffffff", cardOpacity:Number(raw?.cardOpacity ?? 8), imageOpacity:Number(raw?.imageOpacity ?? 100), backgroundVideo:raw?.backgroundVideo, backgroundVideoOpacity:Number(raw?.backgroundVideoOpacity ?? 50), audioName:raw?.audioName ?? "", audioUrl:raw?.audioUrl, galleryLayout:raw?.galleryLayout ?? "collage", image:raw?.image ?? "", images:Array.isArray(raw?.images) ? raw.images.filter((x:any)=>typeof x === "string") : (raw?.image ? [raw.image] : []), visible:raw?.visible !== false, ...(items ? {items} : {})
  } as Block;
}

export default function CreatePage(){
  const [blocks,setBlocks]=useState<Block[]>(defaults);
  const [selected,setSelected]=useState(0);
  const [selectedReason,setSelectedReason]=useState(0);
  const [scene,setScene]=useState(0);
  const [theme,setTheme]=useState("dark");
  const [background,setBackground]=useState("aurora");
  const [globalFont,setGlobalFont]=useState<FontName>("serif");
  const [globalTextColor,setGlobalTextColor]=useState("#fff8fc");
  const [globalCardOpacity,setGlobalCardOpacity]=useState(14);
  const [globalRadius,setGlobalRadius]=useState(21);
  const [globalSpacing,setGlobalSpacing]=useState(18);
  const [globalMotion,setGlobalMotion]=useState("cinematic");
  const [audioName,setAudioName]=useState("");
  const [audioUrl,setAudioUrl]=useState<MediaValue>("");
  const [audioPreviewUrl,setAudioPreviewUrl]=useState("");
  const [audioError,setAudioError]=useState("");
  const [backgroundVideo,setBackgroundVideo]=useState<MediaValue>("");
  const [backgroundVideoPreviewUrl,setBackgroundVideoPreviewUrl]=useState("");
  const [backgroundVideoOpacity,setBackgroundVideoOpacity]=useState(50);
  const [mediaUploading,setMediaUploading]=useState<"video"|"audio"|"">("");
  const [customBg,setCustomBg]=useState("");
  const [customBgOpacity,setCustomBgOpacity]=useState(100);
  const [backgroundBaseColor,setBackgroundBaseColor]=useState("#100917");
  const [bgColor1,setBgColor1]=useState("#ff4f8b");
  const [bgColor2,setBgColor2]=useState("#7c5cff");
  const [bgColor3,setBgColor3]=useState("#38bdf8");
  const [bgColor4,setBgColor4]=useState("#f59e0b");
  const [backgroundOverlay,setBackgroundOverlay]=useState(18);
  const [themeOverride,setThemeOverride]=useState(false);
  const [previewOnly,setPreviewOnly]=useState(false);
  const [toast,setToast]=useState("");
  const [publishOpen,setPublishOpen]=useState(false);
  const [publishTitle,setPublishTitle]=useState("A Hanora moment");
  const [publishedLink,setPublishedLink]=useState("");
  const [publishing,setPublishing]=useState(false);
  const [publishError,setPublishError]=useState("");
  const [addOpen,setAddOpen]=useState(false);
  const [candles,setCandles]=useState([false,false,false]);
  const [smoke,setSmoke]=useState<number[]>([]);
  const [secretRevealed,setSecretRevealed]=useState(false);
  const [galleryViewer,setGalleryViewer]=useState<{images:string[];index:number}|null>(null);
  const [galleryScatter,setGalleryScatter]=useState(false);
  const [dustedPhotos,setDustedPhotos]=useState<number[]>([]);
  const visible=useMemo(()=>blocks.filter(b=>b.visible),[blocks]);
  const current=normalizeBlock(blocks[selected] ?? defaults[0]);
  const shown=visible[Math.min(scene,Math.max(visible.length-1,0))] ?? current;

  useEffect(()=>{
    const saved=localStorage.getItem("hanora-project") ?? localStorage.getItem("cherivo-project"); if(!saved)return;
    try{
      const x=JSON.parse(saved);
      if(x.blocks)setBlocks(x.blocks.map(normalizeBlock)); if(x.theme && themes[x.theme])setTheme(x.theme); if(x.background && (backgrounds[x.background] || x.background==="stars"))setBackground(x.background);
      if(x.globalFont)setGlobalFont(x.globalFont); if(x.globalTextColor)setGlobalTextColor(x.globalTextColor); if(x.globalCardOpacity!==undefined)setGlobalCardOpacity(x.globalCardOpacity);
      if(x.globalRadius!==undefined)setGlobalRadius(x.globalRadius); if(x.globalSpacing!==undefined)setGlobalSpacing(x.globalSpacing); if(x.globalMotion)setGlobalMotion(x.globalMotion);
      if(x.audioName)setAudioName(x.audioName); if(x.audioUrl)setAudioUrl(x.audioUrl); if(x.backgroundVideo)setBackgroundVideo(x.backgroundVideo); if(x.backgroundVideoOpacity!==undefined)setBackgroundVideoOpacity(Number(x.backgroundVideoOpacity)); if(x.customBg)setCustomBg(x.customBg); if(x.customBgOpacity!==undefined)setCustomBgOpacity(Number(x.customBgOpacity));
      if(x.backgroundBaseColor){setBackgroundBaseColor(x.backgroundBaseColor);setThemeOverride(true);}
      if(x.bgColor1)setBgColor1(x.bgColor1); if(x.bgColor2)setBgColor2(x.bgColor2); if(x.bgColor3)setBgColor3(x.bgColor3); if(x.bgColor4)setBgColor4(x.bgColor4);
      if(x.backgroundOverlay!==undefined)setBackgroundOverlay(Number(x.backgroundOverlay));
    }catch{}
  },[]);
  useEffect(()=>{const [bg,accent,accent2,text]=themes[theme] ?? themes.dark;
    document.documentElement.style.setProperty("--bg",bg);
    document.documentElement.style.setProperty("--accent",accent);
    document.documentElement.style.setProperty("--accent2",accent2);
    document.documentElement.style.setProperty("--global-theme-text",text);
    if(!themeOverride){ setBackgroundBaseColor(bg); setBgColor1(accent); setBgColor2(accent2); setBgColor3(theme==="light"?"#e8f7ff":"#38bdf8"); setBgColor4(theme==="light"?"#fff0f5":"#f59e0b"); }
  },[theme,themeOverride]);
  useEffect(()=>{if(scene>visible.length-1)setScene(Math.max(0,visible.length-1))},[visible.length,scene]);

  function notify(m:string){setToast(m);window.setTimeout(()=>setToast(""),1600)}
  function selectBlock(i:number){setSelected(i);setSelectedReason(0);const visibleIndex=visible.findIndex(v=>v.id===blocks[i]?.id);if(visibleIndex>=0)setScene(visibleIndex)}
  function updateCurrent(patch:Partial<Block>){setBlocks(prev=>prev.map((b,i)=>i===selected?normalizeBlock({...b,...patch}):b))}
  function updateReason(index:number,patch:Partial<ReasonItem>){setBlocks(prev=>prev.map((b,i)=>{if(i!==selected||b.type!=="reasons")return b;const items=(b.items??reasonDefaults).map((r,j)=>j===index?{...r,...patch}:r);return normalizeBlock({...b,items})}))}
  function addReason(){if(current.type!=="reasons")return;const item={id:uid(),title:"A new reason",text:"Write what makes this person special.",emoji:"✨"};updateCurrent({items:[...(current.items??[]),item]});setSelectedReason((current.items??[]).length);notify("Reason added ✨")}
  function deleteReason(index:number){if(current.type!=="reasons")return;const next=(current.items??[]).filter((_,i)=>i!==index);updateCurrent({items:next});setSelectedReason(Math.max(0,Math.min(selectedReason,next.length-1)))}
  function projectData(){return {blocks:blocks.map(normalizeBlock),theme,background,globalFont,globalTextColor,globalCardOpacity,globalRadius,globalSpacing,globalMotion,audioName,audioUrl,backgroundVideo,backgroundVideoOpacity,customBg,customBgOpacity,backgroundBaseColor,bgColor1,bgColor2,bgColor3,bgColor4,backgroundOverlay}}
  function save(){localStorage.setItem("hanora-project",JSON.stringify(projectData()));localStorage.removeItem("cherivo-project");notify("Draft saved ✨")}
  async function publishGreeting(){
    setPublishError("");
    setPublishing(true);
    try{
      const project=projectData();
      const bytes=new Blob([JSON.stringify(project)]).size;
      if(bytes>3_800_000) throw new Error("This greeting is too large to publish. Reduce photo/audio sizes or remove unused media.");
      const res=await fetch("/api/greetings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:publishTitle,project})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Could not publish");
      setPublishedLink(data.url);
      setPublishOpen(true);
      await navigator.clipboard?.writeText(data.url).catch(()=>{});
      notify("Private link created and copied 🔐");
    }catch(e:any){
      const message=e?.message||"Publish failed";
      setPublishError(message);
      notify(message);
    }finally{setPublishing(false)}
  }
  function mediaUrl(value:MediaValue,previewUrl=""){return typeof value === "string" ? value : previewUrl}
  async function uploadMedia(e:ChangeEvent<HTMLInputElement>,kind:"video"|"audio",setter:(value:MediaValue)=>void,nameSetter?:(name:string)=>void){const file=e.target.files?.[0];if(!file)return;const max=kind==="video"?20_000_000:10_000_000;if(file.size>max){notify(`${kind==="video"?"Video":"Audio"} must be under ${kind==="video"?20:10}MB`);e.target.value="";return}const header=new Uint8Array(await file.slice(0,32).arrayBuffer());const isValid=kind==="video"?new TextDecoder().decode(header.slice(4,8))==="ftyp":header[0]===0x49&&header[1]===0x44&&header[2]===0x33;if(file.type!==(kind==="video"?"video/mp4":"audio/mpeg")||!file.name.toLowerCase().endsWith(kind==="video"?".mp4":".mp3")||!isValid){notify(kind==="video"?"Choose a valid MP4 video file":"Choose a valid MP3 audio file");e.target.value="";return}setMediaUploading(kind);try{const body=new FormData();body.append("file",file);body.append("kind",kind);const response=await fetch("/api/media",{method:"POST",body});const data=await response.json();if(!response.ok)throw new Error(data.error||"Media upload failed");setter(data.media);if(kind==="video")setBackgroundVideoPreviewUrl(data.previewUrl||"");if(kind==="audio"){setAudioPreviewUrl(data.previewUrl||"");setAudioError("")}nameSetter?.(file.name);notify(`${kind==="video"?"Background video":"Music"} added ✨`)}catch(error){notify(error instanceof Error?error.message:"Media upload failed")}finally{setMediaUploading("");e.target.value=""}}
  function setDirectAudioUrl(value:string,setter:(next:MediaValue)=>void){const trimmed=value.trim();if(!trimmed){setter("");setAudioPreviewUrl("");setAudioError("");return true}try{const url=new URL(trimmed);if((url.protocol!=="http:"&&url.protocol!=="https:")||/youtube\.com|youtu\.be|spotify\.com/i.test(url.hostname))throw new Error();setter(trimmed);setAudioPreviewUrl(trimmed);setAudioError("");return true}catch{notify("Use a valid HTTP or HTTPS audio URL. YouTube and Spotify links are not supported.");return false}}
  function remove(i:number){if(blocks.length===1)return;setBlocks(prev=>prev.filter((_,idx)=>idx!==i));setSelected(Math.max(0,Math.min(selected,blocks.length-2)))}
  function move(i:number,d:number){const j=i+d;if(j<0||j>=blocks.length)return;const next=[...blocks];[next[i],next[j]]=[next[j],next[i]];setBlocks(next);setSelected(j)}
  function add(type:BlockType){const names:Record<string,string>={text:"A New Thought",image:"A Photo",reasons:"What I Love",memories:"A Memory",letter:"A Little Letter",music:"A Song",secret:"A Secret",cake:"Make a Wish",gallery:"Photo Gallery",custom:"Something Special"};const block=normalizeBlock({id:uid(),type,title:names[type],subtitle:"Custom section",heading:names[type],text:"Write your own content here.",emoji:type==="image"?"📸":type==="letter"?"💌":type==="cake"?"🎂":"✨",font:globalFont,titleFont:"sans",subtitleFont:"sans",headingFont:globalFont,bodyFont:"sans",accent:themes[theme][1],headingColor:themes[theme][3],subtitleColor:themes[theme][2],bodyColor:theme==="light"?"#6b5961":"#c8bacb",emojiColor:themes[theme][1],headingSize:60,bodySize:17,lineHeight:1.75,letterSpacing:0,radius:globalRadius,cardColor:"#ffffff",cardOpacity:8,visible:true,items:type==="reasons"?[]:undefined});setBlocks(prev=>[...prev,block]);setSelected(blocks.length);setAddOpen(false);notify("New section added")}
  function blow(){const idx=candles.findIndex(x=>!x);if(idx<0)return;const next=[...candles];next[idx]=true;setCandles(next);setSmoke(v=>[...v,idx]);window.setTimeout(()=>setSmoke(v=>v.filter(x=>x!==idx)),2200);if(next.every(Boolean))window.setTimeout(()=>{setScene(Math.min(scene+1,visible.length-1));setCandles([false,false,false])},1600)}
  async function pickImage(e:ChangeEvent<HTMLInputElement>,setter:(url:string)=>void,max=5_000_000){const f=e.target.files?.[0];if(!f)return;if(f.size>max)return notify(`Use a file under ${Math.round(max/1_000_000)}MB`);try{setter(await compressImage(f,1400,.68))}catch{notify("That image could not be processed")};e.target.value=""}
  function compressImage(file:File,maxSide=800,quality=.58):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error("Could not read image"));r.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,maxSide/Math.max(img.width,img.height));const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext("2d");if(!ctx)return reject(new Error("Canvas unavailable"));ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL("image/jpeg",quality))};img.onerror=()=>reject(new Error("Invalid image"));img.src=String(r.result)};r.readAsDataURL(file)})}
  async function pickGalleryImages(e:ChangeEvent<HTMLInputElement>){const files=Array.from(e.target.files??[]);if(!files.length)return;if(current.type!=="memories"&&current.type!=="gallery")return;const existing=current.images??(current.image?[current.image]:[]);if(existing.length>=20)return notify("You can add up to 20 photos");const chosen=files.slice(0,20-existing.length);try{const urls=await Promise.all(chosen.map(f=>compressImage(f)));updateCurrent({images:[...existing,...urls],image:[...existing,...urls][0]});notify(`${urls.length} photo${urls.length>1?"s":""} added ✨`)}catch{notify("One of the photos could not be processed")};e.target.value=""}
  function removeGalleryImage(index:number){const imgs=(current.images??(current.image?[current.image]:[])).filter((_,i)=>i!==index);updateCurrent({images:imgs,image:imgs[0]??""});notify("Photo removed")}


  function openGalleryPhoto(images:string[], index:number){
    // Scattered Memories is an interaction, not a lightbox.
    // Tapping a photo triggers a snap/dust disappearance.
    setGalleryScatter(true);
    setDustedPhotos(v=>v.includes(index) ? v : [...v,index]);
    window.setTimeout(()=>setGalleryScatter(false), 1050);
  }
  function closeGalleryPhoto(){setGalleryViewer(null);setGalleryScatter(false)}
  function galleryPrev(){setGalleryViewer(v=>v?{...v,index:(v.index-1+v.images.length)%v.images.length}:v)}
  function galleryNext(){setGalleryViewer(v=>v?{...v,index:(v.index+1)%v.images.length}:v)}
  function resetDustedPhotos(){setDustedPhotos([]);setGalleryScatter(false)}

  const fontFamily=(f:FontName)=>f==="script"?"var(--script)":f==="serif"?"var(--serif)":f==="caveat"?"var(--caveat)":"var(--sans)";
  function editShown(){
    const idx=blocks.findIndex(b=>b.id===shown.id);
    if(idx>=0){setPreviewOnly(false);selectBlock(idx);window.setTimeout(()=>document.querySelector(".editor")?.scrollTo({top:0,behavior:"smooth"}),0);}
  }
  function editReason(i:number){const idx=blocks.findIndex(b=>b.id===shown.id);if(idx>=0){setSelected(idx);setSelectedReason(i)}}

  function sectionView(block:Block){
    const style={fontFamily:fontFamily(block.font),"--title-font":fontFamily(block.titleFont),"--subtitle-font":fontFamily(block.subtitleFont),"--heading-font":fontFamily(block.headingFont),"--body-font":fontFamily(block.bodyFont),"--local":block.accent,"--heading-size":`${block.headingSize}px`,"--body-size":`${block.bodySize}px`,"--line-height":block.lineHeight,"--letter-spacing":`${block.letterSpacing}px`,"--card-radius":`${block.radius}px`,"--story-spacing":`${globalSpacing}px`,"--global-text":globalTextColor,"--heading-color":block.headingColor,"--subtitle-color":block.subtitleColor,"--body-color":block.bodyColor,"--emoji-color":block.emojiColor,"--card-color":block.cardColor,"--section-card-opacity":`${block.cardOpacity}%`} as CSSProperties;
    const nav=<div className="actions"><button type="button" className="btn" onClick={()=>setScene(Math.max(0,scene-1))}><ArrowLeft size={16}/> Back</button>{scene<visible.length-1?<button type="button" className="btn primary" onClick={()=>setScene(scene+1)}>Keep going <ArrowRight size={16}/></button>:<button type="button" className="btn primary" onClick={()=>setScene(0)}><RotateCcw size={16}/> Replay</button>}</div>;
    const edit=<button type="button" className="previewEdit" onClick={editShown}><Pencil size={13}/> Edit this page</button>;
    if(block.type==="welcome")return <div className="sceneInner" style={style}>{edit}<button type="button" className="editableDecor" onClick={editShown}>{block.emoji}</button><button type="button" className="editableText sectionKicker" onClick={editShown}>{block.title}</button><button type="button" className="editableText eyebrow" onClick={editShown}>{block.subtitle}</button><button type="button" className="editableText heroTitle" onClick={editShown}>{block.heading}</button><button type="button" className="editableText heroText" onClick={editShown}>{block.text}</button>{block.image&&<div className="photoFrame"><img className="photo" src={block.image} alt="" style={{opacity:(block.imageOpacity ?? 100)/100}}/></div>}{nav}</div>;
    if(block.type==="reasons")return <div className="sceneInner" style={style}>{edit}<button type="button" className="editableDecor" onClick={editShown}>{block.emoji}</button><button type="button" className="editableText sectionKicker" onClick={editShown}>{block.title}</button><button type="button" className="editableText eyebrow" onClick={editShown}>{block.subtitle}</button><button type="button" className="editableText heroTitle" onClick={editShown}>{block.heading}</button><div className="cards">{(block.items??[]).map((r,i)=><button type="button" className="memoryCard editableCard" key={r.id} onClick={()=>editReason(i)}><span className="cardEdit"><Pencil size={13}/></span><div className="reasonEmoji">{r.emoji}</div><h3>{r.title}</h3><p>{r.text}</p></button>)}</div><button type="button" className="addReasonPreview" onClick={()=>{editShown();addReason()}}><Plus size={15}/> Add another reason</button>{nav}</div>;
    if(block.type==="memories"||block.type==="gallery")return <div className={`sceneInner galleryPage layout-${block.galleryLayout ?? "collage"}`} style={style}>{edit}<button type="button" className="editableDecor" onClick={editShown}>{block.emoji}</button><button type="button" className="editableText sectionKicker" onClick={editShown}>{block.title}</button><button type="button" className="editableText eyebrow" onClick={editShown}>{block.subtitle}</button><button type="button" className="editableText heroTitle" onClick={editShown}>{block.heading}</button><button type="button" className="editableText heroText" onClick={editShown}>{block.text}</button>{(block.images?.length??0)>0&&<div className={`galleryStage gallery-count-${Math.min(block.images!.length,20)} ${galleryScatter&&block.galleryLayout==="scattered"?"scatter-active":""}`}><div className="galleryShape a"/><div className="galleryShape b"/>{block.images!.map((src,i)=><button type="button" className={`galleryPhoto galleryPhoto-${i+1} ${block.galleryLayout==="scattered" && dustedPhotos.includes(i) ? "photo-dusted" : ""}`} key={`${i}-${src.slice(-10)}`} aria-label={block.galleryLayout==="scattered" ? `Make memory ${i+1} disappear` : `Open memory photo ${i+1}`} onClick={e=>{e.stopPropagation();openGalleryPhoto(block.images!,i)}}><img src={src} alt={`Memory ${i+1}`} style={{opacity:(block.imageOpacity ?? 100)/100}}/><span className="galleryPhotoHint">View</span></button>)}</div>}<div className="galleryHint">{(block.images?.length??0)>0?`${block.images!.length} memories arranged automatically • ${block.galleryLayout??"collage"}`:"Add up to 20 photos in the editor to create a collage."}</div>{block.galleryLayout==="scattered" && dustedPhotos.length>0 && <button type="button" className="btn ghost small restoreMemories" onClick={resetDustedPhotos}>↻ Restore memories</button>}{nav}</div>;
    if(block.type==="letter")return <div className="sceneInner" style={style}>{edit}<button type="button" className="editableDecor" onClick={editShown}>{block.emoji}</button><button type="button" className="editableText sectionKicker" onClick={editShown}>{block.title}</button><button type="button" className="editableText eyebrow" onClick={editShown}>{block.subtitle}</button><button type="button" className="editableText heroTitle scriptTitle" onClick={editShown}>{block.heading}</button><button type="button" className="letter editableLetter" onClick={editShown}><h2>{block.heading}</h2><p>{block.text}</p></button>{nav}</div>;
    if(block.type==="secret")return <div className="sceneInner secretScene" style={style}>{edit}<button type="button" className="editableDecor secretHeart" onClick={editShown}>{block.emoji}</button><button type="button" className="editableText sectionKicker" onClick={editShown}>{block.title}</button><button type="button" className="editableText eyebrow" onClick={editShown}>{block.subtitle}</button><button type="button" className="editableText heroTitle" onClick={editShown}>{block.heading}</button>{!secretRevealed?<><p className="heroText">{block.text}</p><button type="button" className="btn primary revealBtn" onClick={()=>setSecretRevealed(true)}>Tap to reveal <span>♥</span></button></>:<div className="secretReveal"><span>✦</span><h2>{block.text}</h2><button type="button" className="btn" onClick={()=>setSecretRevealed(false)}>Hide again</button></div>}{nav}</div>;
    if(block.type==="cake")return <div className="sceneInner cakeScene" style={style}>{edit}<button type="button" className="editableText sectionKicker" onClick={editShown}>{block.title}</button><button type="button" className="editableText eyebrow" onClick={editShown}>{block.subtitle}</button><button type="button" className="editableText heroTitle" onClick={editShown}>{block.heading}</button><div className="cakeGraphic"><div className="cakePlate"/><div className="cakeBody"><div className="cakeTop"/><div className="cakeCream"/></div><div className="candles">{candles.map((off,i)=><span className="candleWrap" key={i}><span className={`flame ${off?"flameOff":""}`}/>{smoke.includes(i)&&<span className="smokePuff"/>}<button type="button" aria-label={`Candle ${i+1}`} className={`candleStick ${off?"off":""}`} onClick={blow}/></span>)}</div></div><p className="heroText">Tap a candle to blow it out. Watch the flame flicker, fade and leave a soft trail of smoke.</p><button type="button" className="btn" onClick={blow}>Blow a candle</button>{nav}</div>;
    return <div className="sceneInner" style={style}>{edit}<button type="button" className="editableDecor" onClick={editShown}>{block.emoji}</button><button type="button" className="editableText sectionKicker" onClick={editShown}>{block.title}</button><button type="button" className="editableText eyebrow" onClick={editShown}>{block.subtitle}</button><button type="button" className="editableText heroTitle" onClick={editShown}>{block.heading}</button><button type="button" className="editableText heroText" onClick={editShown}>{block.text}</button>{block.image&&<div className="photoFrame"><img className="photo" src={block.image} alt="" style={{opacity:(block.imageOpacity ?? 100)/100}}/></div>}{nav}</div>;
  }

  const reason=current.type==="reasons"?(current.items??[])[selectedReason]:null;
  return <main className="creator">
    {galleryViewer&&<div className="galleryLightbox" role="dialog" aria-modal="true" aria-label="Memory photo viewer" onClick={closeGalleryPhoto}>
      <button type="button" className="galleryLightboxClose" aria-label="Close photo viewer" onClick={closeGalleryPhoto}><X size={20}/></button>
      <button type="button" className="galleryLightboxNav prev" aria-label="Previous photo" onClick={e=>{e.stopPropagation();galleryPrev()}}><ArrowLeft size={24}/></button>
      <div className="galleryLightboxContent" onClick={e=>e.stopPropagation()}><img key={galleryViewer.index} src={galleryViewer.images[galleryViewer.index]} alt={`Memory ${galleryViewer.index+1}`} /><span>{galleryViewer.index+1} / {galleryViewer.images.length}</span></div>
      <button type="button" className="galleryLightboxNav next" aria-label="Next photo" onClick={e=>{e.stopPropagation();galleryNext()}}><ArrowRight size={24}/></button>
    </div>}
    <header className="creatorTop"><Link href="/" className="logo">HANORA<span>•</span></Link><div className="topActions"><button type="button" className="btn" onClick={()=>setPreviewOnly(!previewOnly)}>{previewOnly?"Exit preview":"Preview"}</button><button type="button" className="btn" onClick={()=>setPublishOpen(true)}>Create private link</button><button type="button" className="btn primary" onClick={save}>Save draft</button></div></header>
    <div className="creatorGrid">
      {!previewOnly&&<aside className="sidePanel"><div className="sideTitle"><h2>Your story</h2><p>Edit anything. Nothing is locked.</p></div><div className="storyList">{blocks.map((b,i)=><div className={`storyItem ${i===selected?"selected":""}`} key={b.id} onClick={()=>selectBlock(i)}><span className="drag">☰</span><div className="storyMain"><b>{b.title}</b><small>{b.subtitle}</small></div><button type="button" title="Edit" onClick={e=>{e.stopPropagation();selectBlock(i)}} className="editIcon"><Pencil size={13}/></button><button type="button" title="Move up" onClick={e=>{e.stopPropagation();move(i,-1)}}><ArrowUp size={13}/></button><button type="button" title="Move down" onClick={e=>{e.stopPropagation();move(i,1)}}><ArrowDown size={13}/></button><button type="button" title="Show / hide" onClick={e=>{e.stopPropagation();setBlocks(p=>p.map((x,j)=>j===i?{...x,visible:!x.visible}:x))}}>{b.visible?<Eye size={13}/>:<EyeOff size={13}/>}</button><button type="button" title="Delete" onClick={e=>{e.stopPropagation();remove(i)}}><Trash2 size={13}/></button></div>)}</div><button type="button" className="addAnything" onClick={()=>setAddOpen(true)}><Plus size={16}/> Add anything</button></aside>}
      <section className={`preview bg-${background} theme-${theme} motion-${globalMotion}`} style={{"--card-opacity":globalCardOpacity/100,"--page-bg":backgroundBaseColor,"--bg1":bgColor1,"--bg2":bgColor2,"--bg3":bgColor3,"--bg4":bgColor4,"--bg-overlay":backgroundOverlay/100} as CSSProperties}>
        {customBg&&<><div className="customBgLayer" style={{backgroundImage:`url("${customBg}")`,opacity:customBgOpacity/100}}/><div className="backgroundOverlayLayer" style={{opacity:backgroundOverlay/100}}/></>}
        {mediaUrl(backgroundVideo,backgroundVideoPreviewUrl)&&<video
          className="previewBackgroundVideo"
          src={mediaUrl(backgroundVideo,backgroundVideoPreviewUrl)}
          autoPlay muted loop playsInline aria-hidden="true"
          style={{opacity:backgroundVideoOpacity/100}}
          onError={()=>notify("Background video could not be loaded")}
        />}
        {(customBg||mediaUrl(backgroundVideo,backgroundVideoPreviewUrl))&&<div className="backgroundOverlayLayer" style={{opacity:backgroundOverlay/100}}/>}
        {mediaUrl(audioUrl,audioPreviewUrl)&&<div className="previewAudio"><audio controls loop src={mediaUrl(audioUrl,audioPreviewUrl)} onCanPlay={()=>setAudioError("")} onError={()=>setAudioError("This URL could not be played as audio. Please provide a playable audio URL.")}/>{audioError&&<span>{audioError}</span>}</div>}
        <div className="previewHint">Tap, swipe or use the button to continue ✨</div><div className="progress">{visible.map((b,i)=><i className={i<=scene?"on":""} key={b.id}/>)}</div>{shown?sectionView(shown):<div className="sceneInner"><h1>No visible sections</h1></div>}</section>
      {!previewOnly&&<aside className="sidePanel editor"><div className="editorHead"><div><h2>Edit anything</h2><small>Selected: {current.title}</small></div><span>{selected+1}/{blocks.length}</span></div>
        <div className="editNotice"><Pencil size={14}/><span>Everything below is live. Change it and the preview updates instantly.</span></div>
        {mediaUploading&&<div className="mediaUploadStatus">Uploading {mediaUploading === "video" ? "background video" : "music"}…</div>}
        <label>Section title<input value={current.title ?? "Untitled section"} onChange={e=>updateCurrent({title:e.target.value})}/></label><label>Subtitle<input value={current.subtitle ?? "A little moment"} onChange={e=>updateCurrent({subtitle:e.target.value})}/></label><label>Heading<input value={current.heading ?? "Your moment"} onChange={e=>updateCurrent({heading:e.target.value})}/></label><label>Message<textarea value={current.text ?? "Write something beautiful."} onChange={e=>updateCurrent({text:e.target.value})}/></label>
        <div className="divider">🔤 Typography for this page</div>
        <div className="fontGrid">
          <label>Section title font<select value={current.titleFont ?? "sans"} onChange={e=>updateCurrent({titleFont:e.target.value as FontName})}><option value="sans">DM Sans</option><option value="serif">Playfair Display</option><option value="script">Great Vibes</option><option value="caveat">Caveat</option></select></label>
          <label>Subtitle font<select value={current.subtitleFont ?? "sans"} onChange={e=>updateCurrent({subtitleFont:e.target.value as FontName})}><option value="sans">DM Sans</option><option value="serif">Playfair Display</option><option value="script">Great Vibes</option><option value="caveat">Caveat</option></select></label>
          <label>Heading font<select value={current.headingFont ?? current.font ?? "serif"} onChange={e=>updateCurrent({headingFont:e.target.value as FontName,font:e.target.value as FontName})}><option value="sans">DM Sans</option><option value="serif">Playfair Display</option><option value="script">Great Vibes</option><option value="caveat">Caveat</option></select></label>
          <label>Message font<select value={current.bodyFont ?? "sans"} onChange={e=>updateCurrent({bodyFont:e.target.value as FontName})}><option value="sans">DM Sans</option><option value="serif">Playfair Display</option><option value="script">Great Vibes</option><option value="caveat">Caveat</option></select></label>
        </div>
        <div className="two"><label>Emoji<input value={current.emoji ?? "✨"} onChange={e=>updateCurrent({emoji:e.target.value})}/></label><label>Page accent<input className="color" type="color" value={current.accent ?? "#ff4f8b"} onChange={e=>updateCurrent({accent:e.target.value})}/></label></div>
        {(current.type==="gallery"||current.type==="memories")&&<div className="divider">🖼️ Photo page</div>}
        {(current.type==="gallery"||current.type==="memories")&&<><label>Photo layout<select value={current.galleryLayout ?? "collage"} onChange={e=>updateCurrent({galleryLayout:e.target.value})}><option value="collage">✨ Auto collage</option><option value="grid">▦ Clean grid</option><option value="masonry">▥ Masonry wall</option><option value="polaroid">▱ Polaroid pile</option><option value="filmstrip">▤ Film strip</option><option value="scattered">✦ Scattered memories</option><option value="hero">🖼️ Hero photo</option></select></label><div className="photoManager"><div className="photoManagerTop"><b>Memory photos</b><span>{(current.images??(current.image?[current.image]:[])).length}/20</span></div><p className="helperText">Choose up to 20 photos. Hanora automatically arranges them into the selected collage.</p><input type="file" accept="image/*" multiple onChange={pickGalleryImages} disabled={(current.images??(current.image?[current.image]:[])).length>=20}/>{(current.images??(current.image?[current.image]:[])).length>0&&<div className="thumbGrid">{(current.images??(current.image?[current.image]:[])).map((src,i)=><div className="thumbItem" key={`${i}-${src.slice(-12)}`}><img src={src} alt={`Memory ${i+1}`}/><button type="button" title="Remove photo" onClick={()=>removeGalleryImage(i)}><Trash2 size={13}/></button><small>{i+1}</small></div>)}</div>}</div></>}
        {current.type==="reasons"&&<div className="reasonEditor"><div className="divider">💗 Edit every reason</div>{(current.items??[]).map((r,i)=><div className={`reasonRow ${i===selectedReason?"active":""}`} key={r.id}><button type="button" className="reasonRowMain" onClick={()=>setSelectedReason(i)}><span>{r.emoji}</span><b>{r.title}</b></button><button type="button" onClick={()=>setSelectedReason(i)} title="Edit reason"><Pencil size={13}/></button><button type="button" onClick={()=>deleteReason(i)} title="Delete reason"><Trash2 size={13}/></button></div>)}<button type="button" className="smallAdd" onClick={addReason}><Plus size={14}/> Add reason</button>{reason&&<div className="reasonFields"><label>Reason title<input value={reason.title} onChange={e=>updateReason(selectedReason,{title:e.target.value})}/></label><label>Reason text<textarea value={reason.text} onChange={e=>updateReason(selectedReason,{text:e.target.value})}/></label><label>Reason emoji<input value={reason.emoji} onChange={e=>updateReason(selectedReason,{emoji:e.target.value})}/></label></div>}</div>}
        <div className="two">
          <label>Accent<input className="color" type="color" value={current.accent ?? "#ff4f8b"} onChange={e=>updateCurrent({accent:e.target.value})}/></label>
          <label>Heading colour<input className="color" type="color" value={current.headingColor ?? "#fff7fb"} onChange={e=>updateCurrent({headingColor:e.target.value})}/></label>
        </div>
        <div className="two">
          <label>Subtitle colour<input className="color" type="color" value={current.subtitleColor ?? "#ff9fc2"} onChange={e=>updateCurrent({subtitleColor:e.target.value})}/></label>
          <label>Message colour<input className="color" type="color" value={current.bodyColor ?? "#c8bacb"} onChange={e=>updateCurrent({bodyColor:e.target.value})}/></label>
        </div>
        <div className="two">
          <label>Emoji / icon colour<input className="color" type="color" value={current.emojiColor ?? "#ff86b0"} onChange={e=>updateCurrent({emojiColor:e.target.value})}/></label>
          <label>Photo opacity <strong>{current.imageOpacity}%</strong><input type="range" min="0" max="100" value={current.imageOpacity ?? 100} onChange={e=>updateCurrent({imageOpacity:Number(e.target.value)})}/></label>
        </div>
        <div className="heroPhotoEditor">
          <div className="divider">🖼️ Page photo</div>
          <p className="helperText">For Welcome / Hero pages this is the main hero photo. You can replace or remove it anytime.</p>
          <label>Choose hero photo<input type="file" accept="image/*" onChange={e=>pickImage(e,url=>updateCurrent({image:url}))}/></label>
          {current.image && <div className="selectedMediaRow"><img src={current.image} alt="Selected page photo"/><button type="button" className="btn danger small" onClick={()=>updateCurrent({image:""})}>Remove photo</button></div>}
        </div>
        <div className="divider">🔤 Typography</div><label>Heading size <strong>{current.headingSize}px</strong><input type="range" min="28" max="120" step="1" value={current.headingSize ?? 70} onChange={e=>updateCurrent({headingSize:Number(e.target.value)})}/></label><label>Body size <strong>{current.bodySize}px</strong><input type="range" min="12" max="30" step="1" value={current.bodySize ?? 17} onChange={e=>updateCurrent({bodySize:Number(e.target.value)})}/></label><label>Line height <strong>{Number(current.lineHeight ?? 1.75).toFixed(2)}</strong><input type="range" min="1" max="2.2" step=".05" value={current.lineHeight ?? 1.75} onChange={e=>updateCurrent({lineHeight:Number(e.target.value)})}/></label><label>Letter spacing <strong>{current.letterSpacing}px</strong><input type="range" min="-2" max="8" step=".5" value={current.letterSpacing ?? 0} onChange={e=>updateCurrent({letterSpacing:Number(e.target.value)})}/></label>
        <div className="divider">🧱 Cards & spacing</div><div className="two"><label>Card radius <strong>{current.radius}px</strong><input type="range" min="0" max="48" value={current.radius ?? 21} onChange={e=>updateCurrent({radius:Number(e.target.value)})}/></label><label>Card colour<input className="color" type="color" value={current.cardColor ?? "#ffffff"} onChange={e=>updateCurrent({cardColor:e.target.value})}/></label></div><label>Card opacity <strong>{current.cardOpacity ?? globalCardOpacity}%</strong><input type="range" min="0" max="100" value={current.cardOpacity ?? globalCardOpacity} onChange={e=>updateCurrent({cardOpacity:Number(e.target.value)})}/></label><label>Section spacing <strong>{globalSpacing}px</strong><input type="range" min="6" max="40" value={globalSpacing} onChange={e=>setGlobalSpacing(Number(e.target.value))}/></label>
        <div className="divider">🎬 Motion</div><select value={globalMotion} onChange={e=>setGlobalMotion(e.target.value)}><option value="cinematic">Cinematic</option><option value="soft">Soft</option><option value="snappy">Snappy</option><option value="none">None</option></select>
        <div className="divider">🎨 Greeting theme</div><div className="themeGrid">{[["dark","Dark"],["light","Light"],["system","System default"],["romantic","Romantic"],["dreamy","Dreamy"]].map(([v,l])=><button type="button" key={v} className={`themeOption ${theme===v?"active":""}`} onClick={()=>{setTheme(v);setThemeOverride(false)}}><span className={`themeSwatch sw-${v}`}/>{l}</button>)}</div><label>Global font<select value={globalFont} onChange={e=>setGlobalFont(e.target.value as FontName)}><option value="serif">Playfair Display</option><option value="sans">DM Sans</option><option value="script">Great Vibes</option><option value="caveat">Caveat</option></select></label><label>Greeting text colour<input className="color" type="color" value={globalTextColor} onChange={e=>setGlobalTextColor(e.target.value)}/></label><label>Global card glass opacity <strong>{globalCardOpacity}%</strong><input type="range" min="0" max="50" value={globalCardOpacity} onChange={e=>setGlobalCardOpacity(Number(e.target.value))}/></label>
        <div className="divider">🌈 Greeting background</div><div className="backgroundOptions">{Object.entries({aurora:"🌌 Aurora",mesh:"🫧 Liquid mesh",stars:"✨ Starfield",petals:"🌸 Floating petals",gradient:"🎨 Gradient",minimal:"◌ Minimal glow"}).map(([v,l])=><button type="button" key={v} className={`bgOption ${background===v?"active":""}`} onClick={()=>setBackground(v)}>{l}</button>)}</div><div className="colorPanel"><label>Base colour<input className="color" type="color" value={backgroundBaseColor} onChange={e=>{setThemeOverride(true);setBackgroundBaseColor(e.target.value)}}/></label><label>Colour 1<input className="color" type="color" value={bgColor1} onChange={e=>{setThemeOverride(true);setBgColor1(e.target.value)}}/></label><label>Colour 2<input className="color" type="color" value={bgColor2} onChange={e=>{setThemeOverride(true);setBgColor2(e.target.value)}}/></label><label>Colour 3<input className="color" type="color" value={bgColor3} onChange={e=>{setThemeOverride(true);setBgColor3(e.target.value)}}/></label><label>Colour 4<input className="color" type="color" value={bgColor4} onChange={e=>{setThemeOverride(true);setBgColor4(e.target.value)}}/></label></div><label>Background overlay <strong>{backgroundOverlay}%</strong><input type="range" min="0" max="60" value={backgroundOverlay} onChange={e=>setBackgroundOverlay(Number(e.target.value))}/></label><label>Background photo<input type="file" accept="image/*" onChange={e=>pickImage(e,setCustomBg,8_000_000)}/></label>{customBg&&<><label>Photo opacity <strong>{customBgOpacity}%</strong><input type="range" min="0" max="100" value={customBgOpacity} onChange={e=>setCustomBgOpacity(Number(e.target.value))}/></label><button type="button" className="btn danger full" onClick={()=>setCustomBg("")}>Remove background photo</button></>}<label>Background Video<input type="file" accept="video/mp4,.mp4" onChange={e=>uploadMedia(e,"video",setBackgroundVideo)}/></label>{backgroundVideo&&<button type="button" className="btn danger small full" onClick={()=>setBackgroundVideo("")}>Remove background video</button>}<label>Video opacity <strong>{backgroundVideoOpacity}%</strong><input type="range" min="0" max="100" value={backgroundVideoOpacity} onChange={e=>setBackgroundVideoOpacity(Number(e.target.value))}/></label>
        <div className="divider">🎵 Music</div><p className="helperText">Upload an MP3 or use a direct audio-file URL. YouTube and Spotify links are not supported.</p><label>Upload MP3<input type="file" accept="audio/mpeg,.mp3" onChange={e=>uploadMedia(e,"audio",setAudioUrl,setAudioName)}/></label><label>Direct audio URL<input value={typeof audioUrl === "string" && !audioUrl.startsWith("data:") ? audioUrl : ""} onChange={e=>{setDirectAudioUrl(e.target.value,setAudioUrl);setAudioName("Direct audio")}} placeholder="https://example.com/song.mp3"/></label>{audioUrl&&<div className="audioControlCard"><b>🎵 {audioName||"Music"}</b><button type="button" className="btn small" onClick={()=>{setAudioName("");setAudioUrl("")}}>Remove music</button></div>}
        <button type="button" className="btn primary full" onClick={save}>Save changes</button>
      </aside>}
    </div>
    {publishOpen&&<div className="modal publishModal" onClick={()=>{if(!publishing && publishedLink)setPublishOpen(false)}}><div className="modalCard publishCard" onClick={e=>e.stopPropagation()}><div className="modalTop"><div><h2>{publishedLink?"Your private greeting is ready 🔐":"Create a private greeting link"}</h2><p>{publishedLink?"Only someone with this link can open the greeting.":"Give your greeting a private title, then create its unique link."}</p></div><button type="button" onClick={()=>setPublishOpen(false)} aria-label="Close"><X/></button></div>{!publishedLink?<><label>Greeting title<input value={publishTitle} onChange={e=>setPublishTitle(e.target.value)} placeholder="A birthday moment"/></label>
          {publishError && <div className="publishError">⚠️ {publishError}</div>}
          <button type="button" className="btn primary full" onClick={publishGreeting} disabled={publishing}>{publishing?"Creating private link…":"Create private link 🔐"}</button></>:<><div className="publishedLinkBox"><span>{publishedLink}</span><button type="button" className="btn" onClick={async()=>{await navigator.clipboard?.writeText(publishedLink).catch(()=>{});notify("Link copied 🔗")}}>Copy link</button></div><a className="btn primary full" href={publishedLink}>Open greeting ↗</a><button type="button" className="btn full" onClick={()=>{setPublishedLink("");setPublishOpen(false)}}>Done</button></>}</div></div>}
    {addOpen&&<div className="modal"><div className="modalCard"><div className="modalTop"><div><h2>Add anything</h2><p>Every extra is optional.</p></div><button type="button" onClick={()=>setAddOpen(false)}><X/></button></div><div className="addGrid">{[["text","📝 Text"],["image","📸 Photo"],["reasons","💗 Reasons"],["memories","📅 Memory"],["letter","💌 Letter"],["music","🎵 Music"],["secret","🔐 Secret"],["cake","🎂 Cake"],["gallery","🖼️ Gallery"],["custom","✨ Custom"]].map(([type,label])=><button type="button" key={type} onClick={()=>add(type as BlockType)}>{label}</button>)}</div></div></div>}
{toast&&<div className="toast">{toast}</div>}
  </main>
}
