"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Plus,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  LogOut,
  Flame,
  Calendar,
  Sparkles,
  RefreshCw,
  Trash2,
  Clock
} from "lucide-react";

type UserGreeting = {
  token: string;
  title: string;
  created_at: string;
  responseCount: number;
  candlesBlown: number;
  responses: Array<{
    id: string;
    recipient_name?: string;
    sender_name?: string;
    senderName?: string;
    message?: string;
    candles_blown?: boolean;
    reaction?: string;
    emojis?: string[];
    created_at: string;
    createdAt?: string;
  }>;
  previewUrl: string;
};

export default function UserDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [greetings, setGreetings] = useState<UserGreeting[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [confirmDeleteToken, setConfirmDeleteToken] = useState<string | null>(null);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);

  function formatTimestamp(isoStr?: string) {
    if (!isoStr) return "Just now";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }

  async function loadData() {
    setLoading(true);
    try {
      let url = "/api/user/data";
      try {
        const saved = JSON.parse(localStorage.getItem("hamora_my_greetings") || "[]");
        if (Array.isArray(saved) && saved.length > 0) {
          url += `?tokens=${encodeURIComponent(saved.join(","))}`;
        }
      } catch {}

      const res = await fetch(url);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setGreetings(data.greetings || []);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function copyLink(token: string) {
    const fullUrl = `${window.location.origin}/g/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  }

  async function handleDeleteGreeting(token: string) {
    setDeletingToken(token);
    try {
      const res = await fetch("/api/greetings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete moment.");

      // Remove from browser local storage as well
      try {
        const saved = JSON.parse(localStorage.getItem("hamora_my_greetings") || "[]");
        const updated = saved.filter((t: string) => t !== token);
        localStorage.setItem("hamora_my_greetings", JSON.stringify(updated));
      } catch {}

      setGreetings((prev) => prev.filter((g) => g.token !== token));
      setConfirmDeleteToken(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete moment from database.");
    } finally {
      setDeletingToken(null);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0c0612",
        color: "#fff"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div className="uploadSpinner" style={{ width: "32px", height: "32px" }} />
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Loading your moments...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0714",
      color: "#f3f0f7",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        height: "64px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(18, 10, 26, 0.9)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/" style={{
            fontFamily: "'Geraldine', 'Symphonie Calligraphy', 'Symphonie', 'Great Vibes', cursive",
            fontSize: "26px",
            color: "#fff",
            textDecoration: "none",
            letterSpacing: "0.02em"
          }}>
            Hamora<span style={{ color: "#ff4f8b" }}>•</span>
          </Link>
          <span style={{
            fontSize: "11px",
            padding: "3px 8px",
            background: "rgba(255, 79, 139, 0.15)",
            color: "#ff4f8b",
            borderRadius: "999px",
            fontWeight: 700
          }}>
            Creator Studio
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{user?.email}</div>
          </div>
          <Link
            href="/create"
            style={{
              height: "36px",
              padding: "0 14px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #ff4f8b, #7c5cff)",
              color: "#fff",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(255, 79, 139, 0.35)"
            }}
          >
            <Plus size={15} /> Create Moment
          </Link>
          <button
            onClick={handleLogout}
            style={{
              height: "36px",
              padding: "0 10px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "36px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
              My Created Moments & Cards
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
              Track views, wishes, and replies received from your loved ones.
            </p>
          </div>
          <button
            onClick={loadData}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "6px 12px",
              color: "#fff",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {greetings.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "64px 20px",
            background: "rgba(25, 14, 36, 0.6)",
            border: "1.5px dashed rgba(255, 255, 255, 0.12)",
            borderRadius: "24px"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "20px",
              background: "rgba(255, 79, 139, 0.15)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              color: "#ff4f8b"
            }}>
              <Heart size={28} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px 0" }}>No moments created yet</h3>
            <p style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "14px", maxWidth: "420px", margin: "0 auto 24px auto" }}>
              Build an interactive celebration card with music, candle blowing, photo galleries, and secret letters.
            </p>
            <Link
              href="/create"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ff4f8b, #7c5cff)",
                color: "#fff",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 700,
                boxShadow: "0 4px 18px rgba(255, 79, 139, 0.4)"
              }}
            >
              <Sparkles size={16} /> Open Studio & Create Card
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {greetings.map((g) => (
              <div
                key={g.token}
                style={{
                  background: "rgba(25, 15, 36, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "20px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0" }}>
                      {g.title}
                    </h3>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                      <span title="Created timestamp">
                        <Clock size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px", color: "#ff4f8b" }} />
                        {formatTimestamp(g.created_at)}
                      </span>
                      <span>Token: <code style={{ color: "#ff4f8b", background: "rgba(255, 79, 139, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>{g.token.slice(0, 16)}...</code></span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => copyLink(g.token)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {copiedToken === g.token ? <Check size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
                      {copiedToken === g.token ? "Copied Link!" : "Share Link"}
                    </button>

                    <a
                      href={g.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, rgba(255, 79, 139, 0.2), rgba(124, 92, 255, 0.2))",
                        border: "1px solid rgba(255, 79, 139, 0.35)",
                        color: "#fff",
                        textDecoration: "none",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <ExternalLink size={14} /> Open Card
                    </a>

                    {confirmDeleteToken === g.token ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          onClick={() => handleDeleteGreeting(g.token)}
                          disabled={deletingToken === g.token}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "10px",
                            background: "#ef4444",
                            border: "none",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Trash2 size={13} /> {deletingToken === g.token ? "Deleting..." : "Confirm Delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteToken(null)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "10px",
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            color: "rgba(255,255,255,0.7)",
                            fontSize: "12px",
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteToken(g.token)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          color: "#f87171",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        title="Delete permanently from database"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Responses Section */}
                <div style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  paddingTop: "14px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <MessageSquare size={14} style={{ color: "#ff4f8b" }} />
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>
                      Recipient Replies & Interactions ({g.responses.length})
                    </span>
                  </div>

                  {g.responses.length === 0 ? (
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                      No replies received yet. Once the recipient opens the card and sends wishes, they will appear here!
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                      {g.responses.map((r, i) => {
                        const senderName = r.sender_name || (r as any).senderName || r.recipient_name || "Special Someone";
                        const emojisList = Array.isArray(r.emojis) && r.emojis.length > 0
                          ? r.emojis
                          : r.reaction
                          ? [r.reaction]
                          : [];

                        return (
                          <div key={r.id || i} style={{
                            background: "rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "14px",
                            padding: "14px"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "12px", marginBottom: "6px" }}>
                              <span style={{ fontWeight: 700, color: "#ff4f8b", fontSize: "13px" }}>{senderName}</span>
                              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <Clock size={11} /> {formatTimestamp(r.created_at || (r as any).createdAt)}
                              </span>
                            </div>
                            {r.message && (
                              <p style={{ margin: "6px 0 10px 0", fontSize: "13px", fontStyle: "italic", color: "rgba(255,255,255,0.9)", lineHeight: "1.4" }}>
                                "{r.message}"
                              </p>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              {emojisList.length > 0 && (
                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                  {emojisList.map((emo, idx) => (
                                    <span key={idx} style={{ fontSize: "15px", background: "rgba(255, 255, 255, 0.08)", padding: "2px 7px", borderRadius: "999px" }}>
                                      {emo}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {r.candles_blown && (
                                <span style={{ fontSize: "11px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "2px 8px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                  <Flame size={11} /> Blew Candles
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
