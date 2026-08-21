"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RotateCcw, Heart, Send, Check, X, MessageCircle } from "lucide-react";
import type { GreetingProject } from "@/lib/types";
import { normalizeProject, themes } from "@/lib/greetingConfig";
import GreetingView from "@/components/GreetingView";

const REACTION_EMOJIS = ["💖", "🥺", "😭", "✨", "🎂", "🥰", "🎉", "🫶", "🥂", "❤️"];

export default function GreetingClient({
  token,
  project: rawProject,
  title
}: {
  token?: string;
  project: GreetingProject | Record<string, unknown>;
  title: string;
}) {
  const project = normalizeProject(rawProject);
  const [sceneIndex, setSceneIndex] = useState(0);

  // Recipient Response State
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(["💖"]);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [responseError, setResponseError] = useState("");

  const themeColors = themes[project.theme || "dark"] ?? themes.dark;

  const toggleEmoji = (emoji: string) => {
    if (selectedEmojis.includes(emoji)) {
      if (selectedEmojis.length > 1) {
        setSelectedEmojis(selectedEmojis.filter((e) => e !== emoji));
      }
    } else {
      setSelectedEmojis([...selectedEmojis, emoji]);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!message.trim()) {
      setResponseError("Please enter a short message or reaction.");
      return;
    }

    setSending(true);
    setResponseError("");

    try {
      const res = await fetch("/api/greetings/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          senderName: senderName.trim() || undefined,
          message: message.trim(),
          emojis: selectedEmojis
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not send response.");
      }

      setSentSuccess(true);
    } catch (err: any) {
      setResponseError(err.message || "Failed to send response.");
    } finally {
      setSending(false);
    }
  };

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
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className="replyNavBtn"
            onClick={() => setResponseModalOpen(true)}
            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <Heart size={14} style={{ color: "#ff4f8b" }} />
            <span>Reply</span>
          </button>
          <button
            type="button"
            onClick={() => setSceneIndex(0)}
            style={{ cursor: "pointer" }}
          >
            <RotateCcw size={14} />
            Replay
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <GreetingView
          project={project}
          sceneIndex={sceneIndex}
          onSceneChange={setSceneIndex}
          isEditable={false}
          title={title}
          onOpenResponseModal={() => setResponseModalOpen(true)}
        />
      </div>

      {/* Floating Bottom Bar for Quick Reply on Mobile/Desktop */}
      <div className="recipientFloatingBar">
        <button
          type="button"
          className="recipientReplyTrigger"
          onClick={() => setResponseModalOpen(true)}
        >
          <MessageCircle size={18} />
          <span>Send a Heartfelt Response to Creator</span>
        </button>
      </div>

      {/* Response Modal Dialog */}
      {responseModalOpen && (
        <div
          className="responseModalOverlay"
          role="dialog"
          aria-modal="true"
          onClick={() => !sending && setResponseModalOpen(false)}
        >
          <div className="responseModalContent" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="responseModalClose"
              aria-label="Close"
              onClick={() => setResponseModalOpen(false)}
            >
              <X size={18} />
            </button>

            {!sentSuccess ? (
              <form onSubmit={handleSendResponse}>
                <div className="responseModalHeader">
                  <div className="responseIconBadge">💌</div>
                  <h2>Send Your Response</h2>
                  <p>Send a sweet thank you note and your reaction to the person who created this for you.</p>
                </div>

                <div className="responseEmojiPicker">
                  <label>Choose Reactions</label>
                  <div className="emojiRow">
                    {REACTION_EMOJIS.map((emo) => {
                      const selected = selectedEmojis.includes(emo);
                      return (
                        <button
                          key={emo}
                          type="button"
                          className={`emojiChoiceBtn ${selected ? "active" : ""}`}
                          onClick={() => toggleEmoji(emo)}
                        >
                          {emo}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="formGroup" style={{ marginTop: "14px" }}>
                  <label htmlFor="recipientName">Your Name (Optional)</label>
                  <input
                    id="recipientName"
                    type="text"
                    placeholder="e.g. Maya or Your Bestie"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="formGroup" style={{ marginTop: "14px" }}>
                  <label htmlFor="responseMsg">Your Message / Thank You</label>
                  <textarea
                    id="responseMsg"
                    rows={4}
                    placeholder="Thank you so much for this! It made my entire day... ❤️"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={1000}
                  />
                </div>

                {responseError && (
                  <div className="responseErrorAlert">{responseError}</div>
                )}

                <div className="responseModalActions">
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={sending}
                    onClick={() => setResponseModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={sending || !message.trim()}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {sending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send size={15} /> Send Response
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="responseSuccessState">
                <div className="responseSuccessIcon">
                  <Check size={28} />
                </div>
                <h2>Response Sent!</h2>
                <p>
                  Your message and reaction{" "}
                  <span style={{ fontSize: "1.2em" }}>{selectedEmojis.join(" ")}</span> have been sent directly to the creator.
                </p>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    setSentSuccess(false);
                    setResponseModalOpen(false);
                    setMessage("");
                  }}
                >
                  Back to Greeting
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={{ textAlign: "center", color: "#887d88", fontSize: "11px", marginTop: "32px" }}>
        Made as a private moment. <span style={{ color: themeColors[1] }}>♥</span>
      </footer>
    </main>
  );
}