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
  RefreshCw
} from "lucide-react";

type UserGreeting = {
  token: string;
  title: string;
  created_at: string;
  responseCount: number;
  candlesBlown: number;
  responses: Array<{
    id: string;
    recipient_name: string;
    message?: string;
    candles_blown?: boolean;
    reaction?: string;
    created_at: string;
  }>;
  previewUrl: string;
};

export default function UserDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [greetings, setGreetings] = useState<UserGreeting[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/data");
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
                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px 0" }}>
                      {g.title}
                    </h3>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: "12px" }}>
                      <span><Calendar size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                        {new Date(g.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span>Token: <code style={{ color: "#ff4f8b" }}>{g.token}</code></span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
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
                      {g.responses.map((r, i) => (
                        <div key={r.id || i} style={{
                          background: "rgba(0, 0, 0, 0.3)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          borderRadius: "12px",
                          padding: "12px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, color: "#ff4f8b" }}>{r.recipient_name || "Recipient"}</span>
                            <span style={{ color: "rgba(255,255,255,0.35)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          {r.message && (
                            <p style={{ margin: "4px 0 8px 0", fontSize: "13px", fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>
                              "{r.message}"
                            </p>
                          )}
                          <div style={{ display: "flex", gap: "6px" }}>
                            {r.candles_blown && (
                              <span style={{ fontSize: "11px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "2px 6px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <Flame size={10} /> Blew Candles
                              </span>
                            )}
                            {r.reaction && (
                              <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.08)", padding: "2px 6px", borderRadius: "999px" }}>
                                {r.reaction}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
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
