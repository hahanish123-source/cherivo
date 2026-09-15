"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { defaultBlocks, normalizeProject } from "@/lib/greetingConfig";
import GreetingView from "@/components/GreetingView";

export default function Demo() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const demoProject = normalizeProject({
    blocks: defaultBlocks,
    theme: "romantic",
    background: "aurora",
    globalFont: "serif"
  });

  return (
    <main className="demoPage" style={{ minHeight: "100vh", padding: "16px 14px 40px", boxSizing: "border-box" }}>
      <header className="publicTop">
        <Link href="/" className="publicLogo" aria-label="Hamora Home">
          <span className="publicLogoText">Hamora</span>
          <span className="publicLogoDot">•</span>
        </Link>
        <span className="publicMomentTitle">Interactive Hamora Demo</span>
        <div className="publicActions">
          <button
            type="button"
            className="replayNavBtn"
            onClick={() => setSceneIndex(0)}
            title="Replay demo"
          >
            <RotateCcw size={15} strokeWidth={2.2} style={{ color: "#ffffff" }} />
            <span>Replay</span>
          </button>
        </div>
      </header>
      <div className="demoCard">
        <GreetingView
          project={demoProject}
          sceneIndex={sceneIndex}
          onSceneChange={setSceneIndex}
          isEditable={false}
          title="Interactive Hamora Demo"
        />
      </div>
    </main>
  );
}
