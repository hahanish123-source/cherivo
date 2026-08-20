"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import type { GreetingProject } from "@/lib/types";
import { normalizeProject, themes } from "@/lib/greetingConfig";
import GreetingView from "@/components/GreetingView";

export default function GreetingClient({
  project: rawProject,
  title
}: {
  project: GreetingProject | Record<string, unknown>;
  title: string;
}) {
  const project = normalizeProject(rawProject);
  const [sceneIndex, setSceneIndex] = useState(0);

  const themeColors = themes[project.theme || "dark"] ?? themes.dark;

  return (
    <main
      className={`publicGreeting theme-${project.theme || "dark"} motion-${
        project.globalMotion || "cinematic"
      }`}
      style={{
        minHeight: "100vh",
        background: project.backgroundBaseColor || themeColors[0],
        color: project.globalTextColor || themeColors[3],
        padding: "16px 14px 40px",
        boxSizing: "border-box"
      }}
    >
      <div className="publicTop">
        <Link href="/" className="logo" style={{ textDecoration: "none", color: "inherit" }}>
          <span>
            HANORA<span>•</span>
          </span>
        </Link>
        <small>{title}</small>
        <button
          type="button"
          onClick={() => setSceneIndex(0)}
          style={{ cursor: "pointer" }}
        >
          <RotateCcw size={14} />
          Replay
        </button>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <GreetingView
          project={project}
          sceneIndex={sceneIndex}
          onSceneChange={setSceneIndex}
          isEditable={false}
          title={title}
        />
      </div>

      <footer style={{ textAlign: "center", color: "#887d88", fontSize: "11px", marginTop: "32px" }}>
        Made as a private moment. <span style={{ color: themeColors[1] }}>♥</span>
      </footer>
    </main>
  );
}