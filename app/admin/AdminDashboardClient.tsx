"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  LogOut,
  Download,
  Trash2,
  ExternalLink,
  Users,
  MessageSquare,
  FileText,
  Database,
  Search,
  RefreshCw,
  CheckCircle,
  Flame,
  AlertCircle
} from "lucide-react";

type GreetingItem = {
  token: string;
  title: string;
  created_at: string;
  user_id: string;
  responseCount: number;
  candlesBlown: number;
  previewUrl: string;
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_login?: string;
};

type ResponseItem = {
  id: string;
  token: string;
  recipient_name?: string;
  sender_name?: string;
  senderName?: string;
  message?: string;
  candles_blown?: boolean;
  reaction?: string;
  emojis?: string[];
  created_at: string;
};

export default function AdminDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [greetings, setGreetings] = useState<GreetingItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [responsesMap, setResponsesMap] = useState<Record<string, ResponseItem[]>>({});
  const [activeTab, setActiveTab] = useState<"greetings" | "users" | "responses">("greetings");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmToken, setDeleteConfirmToken] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/data");
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load admin data");
      }
      setStats(data.stats);
      setGreetings(data.greetings || []);
      setUsers(data.users || []);
      setResponsesMap(data.responses || {});
    } catch (err: any) {
      setError(err.message || "Failed to retrieve records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function handleDelete(token: string) {
    try {
      const res = await fetch(`/api/admin/greeting?token=${token}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setGreetings((prev) => prev.filter((g) => g.token !== token));
      setDeleteConfirmToken(null);
      setActionNotice(`Card ${token} permanently removed.`);
      setTimeout(() => setActionNotice(""), 3000);
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  }

  function handleExport() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      stats,
      greetings,
      users,
      responses: responsesMap
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hamora-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredGreetings = (greetings || []).filter(
    (g) =>
      (g.title || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (g.token || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const allResponsesList: ResponseItem[] = Object.values(responsesMap || {}).flat();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0714",
      color: "#f3f0f7",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Top Navbar */}
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
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #ff4f8b, #7c5cff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff"
          }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.01em" }}>
              Hamora <span style={{ color: "#ff4f8b" }}>Master Admin</span>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
              High-Security Access Console
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={loadData}
            title="Refresh records"
            style={{
              height: "36px",
              padding: "0 12px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>

          <button
            onClick={handleExport}
            style={{
              height: "36px",
              padding: "0 14px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px"
            }}
          >
            <Download size={14} /> Export Backup
          </button>

          <button
            onClick={handleLogout}
            style={{
              height: "36px",
              padding: "0 14px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#fca5a5",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 20px" }}>
        {error && (
          <div style={{
            padding: "14px 18px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "12px",
            color: "#fca5a5",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {actionNotice && (
          <div style={{
            padding: "12px 18px",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "12px",
            color: "#6ee7b7",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <CheckCircle size={16} /> {actionNotice}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "28px"
        }}>
          <div style={{
            background: "rgba(25, 15, 36, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255, 79, 139, 0.15)", color: "#ff4f8b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{stats?.totalGreetings ?? 0}</div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)" }}>Total Active Cards</div>
            </div>
          </div>

          <div style={{
            background: "rgba(25, 15, 36, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(124, 92, 255, 0.15)", color: "#7c5cff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{stats?.totalUsers ?? 0}</div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)" }}>Registered Creators</div>
            </div>
          </div>

          <div style={{
            background: "rgba(25, 15, 36, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{stats?.totalResponses ?? 0}</div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)" }}>Recipient Responses</div>
            </div>
          </div>

          <div style={{
            background: "rgba(25, 15, 36, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Database size={22} />
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{stats?.storageMb ?? "0.00"} MB</div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)" }}>Storage Footprint</div>
            </div>
          </div>
        </div>

        {/* Tab Selection & Search */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "18px"
        }}>
          <div style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "4px"
          }}>
            <button
              onClick={() => setActiveTab("greetings")}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "greetings" ? "linear-gradient(135deg, #ff4f8b, #7c5cff)" : "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Cards & Moments ({greetings.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "users" ? "linear-gradient(135deg, #ff4f8b, #7c5cff)" : "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Creators & Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("responses")}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "responses" ? "linear-gradient(135deg, #ff4f8b, #7c5cff)" : "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Recipient Replies ({allResponsesList.length})
            </button>
          </div>

          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255, 255, 255, 0.4)" }} />
            <input
              type="text"
              placeholder="Search by title or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                height: "38px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "0 12px 0 36px",
                color: "#fff",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          background: "rgba(22, 12, 32, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "18px",
          overflow: "hidden"
        }}>
          {activeTab === "greetings" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "left" }}>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Card Title</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Private Token</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Creator</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Replies</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Created Date</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGreetings.map((g) => (
                    <tr key={g.token} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 600 }}>{g.title || "Untitled Moment"}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "monospace", color: "#ff4f8b" }}>
                        {g.token}
                      </td>
                      <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.6)" }}>
                        {g.user_id || "anonymous"}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: (g.responseCount || 0) > 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
                          color: (g.responseCount || 0) > 0 ? "#10b981" : "rgba(255,255,255,0.4)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontWeight: 600
                        }}>
                          <MessageSquare size={12} /> {g.responseCount || 0}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                        {g.created_at ? new Date(g.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "-"}
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <a
                            href={g.previewUrl || `/g/${g.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: "rgba(255, 255, 255, 0.08)",
                              color: "#fff",
                              textDecoration: "none",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <ExternalLink size={12} /> View
                          </a>
                          {deleteConfirmToken === g.token ? (
                            <button
                              onClick={() => handleDelete(g.token)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                fontSize: "12px",
                                cursor: "pointer",
                                fontWeight: 700
                              }}
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmToken(g.token)}
                              style={{
                                padding: "6px 8px",
                                borderRadius: "6px",
                                background: "rgba(239, 68, 68, 0.12)",
                                color: "#f87171",
                                border: "1px solid rgba(239, 68, 68, 0.25)",
                                fontSize: "12px",
                                cursor: "pointer"
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGreetings.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        {loading ? "Loading greetings records..." : "No greetings found matching search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "users" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "left" }}>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Creator Name</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Email Address</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>User ID</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Joined Date</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 600 }}>{u.name || "Creator"}</td>
                      <td style={{ padding: "14px 18px", color: "#38bdf8" }}>{u.email}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>{(u.id || "").slice(0, 8)}...</td>
                      <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.5)" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</td>
                      <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.5)" }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        {loading ? "Loading creators..." : "No registered users yet. Most cards are generated directly in local mode."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "responses" && (
            <div style={{ padding: "16px" }}>
              {allResponsesList.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                  {loading ? "Loading responses..." : "No recipient responses have been sent yet."}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                  {allResponsesList.map((r, i) => (
                    <div key={r.id || i} style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "16px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ fontWeight: 700, color: "#ff4f8b" }}>{r.sender_name || r.senderName || r.recipient_name || "Anonymous Recipient"}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                          {r.created_at ? new Date(r.created_at).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }) : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
                        Card Token: <Link href={`/g/${r.token}`} target="_blank" style={{ color: "#38bdf8", textDecoration: "none" }}>{r.token}</Link>
                      </div>
                      {r.message && (
                        <div style={{
                          background: "rgba(0,0,0,0.25)",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontStyle: "italic",
                          marginBottom: "10px"
                        }}>
                          "{r.message}"
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", fontSize: "12px" }}>
                        {r.candles_blown && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "2px 8px", borderRadius: "999px" }}>
                            <Flame size={12} /> Blew Candles
                          </span>
                        )}
                        {Array.isArray(r.emojis) && r.emojis.length > 0 ? (
                          r.emojis.map((emo, idx) => (
                            <span key={idx} style={{ background: "rgba(255, 255, 255, 0.08)", padding: "2px 7px", borderRadius: "999px", fontSize: "14px" }}>
                              {emo}
                            </span>
                          ))
                        ) : r.reaction ? (
                          <span style={{ background: "rgba(255, 255, 255, 0.08)", padding: "2px 8px", borderRadius: "999px" }}>
                            {r.reaction}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
