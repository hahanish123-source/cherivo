"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function WebsiteThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "bright">("bright");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("hamora-website-theme");
    if (saved === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-website-theme", "dark");
    } else {
      setTheme("bright");
      document.documentElement.setAttribute("data-website-theme", "bright");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "bright" ? "dark" : "bright";
    setTheme(next);
    localStorage.setItem("hamora-website-theme", next);
    document.documentElement.setAttribute("data-website-theme", next);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className="btn small ghost"
        style={{
          visibility: "hidden",
          padding: "6px 12px",
          fontSize: "12px",
        }}
        aria-hidden="true"
      >
        <span>Site</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn small ghost"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "999px",
        padding: "6px 12px",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        background: theme === "bright" ? "rgba(244, 114, 182, 0.15)" : "rgba(255,255,255,0.08)",
        border: theme === "bright" ? "1px solid rgba(244, 114, 182, 0.3)" : "1px solid rgba(255,255,255,0.15)",
        color: theme === "bright" ? "#381528" : "#ffffff",
        transition: "all 0.2s ease",
      }}
      title={theme === "bright" ? "Switch site to Dark Mode" : "Switch site to Baby Pink Mode"}
    >
      {theme === "bright" ? (
        <>
          <Moon size={13} color="#7c5cff" />
          <span>Dark</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: "12px" }}>🌸</span>
          <span>Baby Pink</span>
        </>
      )}
    </button>
  );
}
