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
    <main className="demoPage">
      <div className="demoTop">
        <Link href="/">
          <ArrowLeft size={16} /> Hanora
        </Link>
        <button type="button" onClick={() => setSceneIndex(0)}>
          <RotateCcw size={15} /> Replay
        </button>
      </div>
      <div className="demoCard">
        <GreetingView
          project={demoProject}
          sceneIndex={sceneIndex}
          onSceneChange={setSceneIndex}
          isEditable={false}
          title="Interactive Hanora Demo"
        />
      </div>
    </main>
  );
}
