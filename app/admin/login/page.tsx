"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanUser = username.trim();
      const cleanPass = password.trim();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password: cleanPass, isAdmin: true })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 20%, #20102b 0%, #0c0612 100%)",
      color: "#fff",
      padding: "20px",
      colorScheme: "dark"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "rgba(25, 14, 36, 0.85)",
        backdropFilter: "blur(24px)",
        border: "1.5px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "24px",
        padding: "36px 28px",
        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.75)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(255, 79, 139, 0.2), rgba(124, 92, 255, 0.2))",
            border: "1px solid rgba(255, 79, 139, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px"
          }}>
            <Shield size={28} style={{ color: "#ff4f8b" }} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
            Hamora Admin Portal
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
            Restricted security console. Authorized access only.
          </p>
        </div>

        {error && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#fca5a5",
            fontSize: "13px",
            marginBottom: "20px"
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255, 255, 255, 0.85)", marginBottom: "6px" }}>
              Administrator Username
            </label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255, 255, 255, 0.6)", zIndex: 2 }} />
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="authInput"
                style={{
                  padding: "0 14px 0 38px",
                  color: "#ffffff",
                  caretColor: "#ff4f8b"
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255, 255, 255, 0.85)" }}>
                Master Security Key / Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  background: "none",
                  border: "none",
                  color: showPassword ? "#ff4f8b" : "rgba(255, 255, 255, 0.7)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 6px"
                }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showPassword ? "Hide" : "Show password"}</span>
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255, 255, 255, 0.6)", zIndex: 2 }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="authInput"
                style={{
                  padding: "0 46px 0 38px",
                  color: "#ffffff",
                  caretColor: "#ff4f8b",
                  letterSpacing: showPassword ? "normal" : "0.15em"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: showPassword ? "#ff4f8b" : "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  zIndex: 2
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: "46px",
              marginTop: "10px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #ff4f8b, #7c5cff)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 18px rgba(255, 79, 139, 0.35)",
              transition: "transform 0.15s ease"
            }}
          >
            {loading ? "Verifying Credentials..." : "Authenticate & Access Portal"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/" style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", textDecoration: "none" }}>
            ← Return to Hamora Home
          </Link>
        </div>
      </div>
    </div>
  );
}
