import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Streamdown } from "streamdown";
import { useReberAI } from "@/lib/reber-hook";
import type { ChatMessages } from "@/lib/reber-hook";
import { executePlanetbintangFileCommand } from "@/lib/planetbintang-files";

// ── Messages Component ─────────────────────────────────────────────────────
function Messages({ messages }: { messages: ChatMessages }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const prevCount = useRef(0);

  // Track whether the user is reading near the bottom; if they scrolled up, don't yank them down
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNewMessage = messages.length !== prevCount.current;
    prevCount.current = messages.length;
    if (isNewMessage || stickToBottom.current) {
      // Instant scroll while streaming avoids the jitter of stacked smooth scrolls
      el.scrollTop = el.scrollHeight;
      stickToBottom.current = true;
    }
  }, [messages]);

  return (
    <div className="reber-messages" ref={containerRef} onScroll={handleScroll}>
      {messages.map((message) => (
        <div key={message.id} className={`reber-message ${message.role}`}>
          <div className={`reber-message-avatar ${message.role === "assistant" ? "ai" : "user"}`}>
            {message.role === "assistant" ? "Re" : "U"}
          </div>
          <div className="reber-message-content">
            <div className="reber-message-role">
              {message.role === "assistant" ? "AI Reber" : "Anda"}
            </div>
            <div className="reber-message-text">
              {message.parts.map((part, i) => {
                if (part.type === "text" && part.content) {
                  return (
                    <div key={i} className="prose prose-sm max-w-none">
                      <Streamdown>{part.content}</Streamdown>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Production Navigation ───────────────────────────────────────────────────
function SystemSidebar({ onSendMessage }: { onSendMessage: (msg: string) => void }) {
  const modes = [
    { icon: "⌘", label: "Website AI", detail: "Website & landing page", prompt: "Buat rancangan dan kode website produksi lengkap berdasarkan kebutuhan berikut: " },
    { icon: "▣", label: "Application AI", detail: "Web app & dashboard", prompt: "Rancang dan buat aplikasi web produksi lengkap berdasarkan kebutuhan berikut: " },
    { icon: "◫", label: "Chat AI", detail: "Chatbot & asisten", prompt: "Rancang dan implementasikan chatbot produksi berdasarkan kebutuhan berikut: " },
    { icon: "⎇", label: "Agent AI", detail: "Agent & workflow", prompt: "Rancang workflow AI agent dengan tools, approval, monitoring, dan fail-safe berdasarkan kebutuhan berikut: " },
  ];
  return (
    <aside className="reber-sidebar production-chat-sidebar">
      <div className="reber-sidebar-header">AIREBER / PRODUKSI</div>
      <div className="reber-sidebar-scroll">
        <div className="production-chat-section">
          <p>JENIS PRODUK AI</p>
          {modes.map((mode) => <button key={mode.label} className="production-chat-mode" onClick={() => onSendMessage(mode.prompt)}><span>{mode.icon}</span><span><b>{mode.label}</b><small>{mode.detail}</small></span></button>)}
        </div>
        <div className="reber-divider" />
        <div className="production-chat-section">
          <p>WORKSPACE</p>
          <Link to="/production">AI Production Workspace <span>↗</span></Link>
          <Link to="/projects">Proyek &amp; Produk <span>↗</span></Link>
          <Link to="/manager">File Manager <span>↗</span></Link>
          <Link to="/account">Member, Paket &amp; Kuota <span>↗</span></Link>
        </div>
        <div className="production-chat-note">
          <b>Alur kerja</b>
          <span>Brief → Generate → Review → Simpan → Rilis</span>
          <small>Setiap permintaan AI menggunakan kuota akun.</small>
        </div>
      </div>
    </aside>
  );
}

// ── Welcome Screen ─────────────────────────────────────────────────────────
function WelcomeScreen({ onSend }: { onSend: (msg: string) => void }) {
  const prompts = [
    "Buat website profil perusahaan dengan halaman layanan dan kontak",
    "Buat dashboard aplikasi manajemen pelanggan",
    "Buat chatbot customer support dengan knowledge base",
    "Buat agent AI untuk memproses alur persetujuan dokumen",
  ];
  return (
    <div className="reber-welcome">
      <div className="reber-welcome-logo">Re</div>
      <h1>AIREBER AI</h1>
      <p className="reber-welcome-tagline">
        AI Production Workspace
      </p>

      <div style={{ fontSize: 13, color: "var(--reber-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Pilih produk untuk mulai produksi:
      </div>

      <div className="reber-welcome-chips">
        {prompts.map((p) => (
          <button key={p} className="reber-chip" onClick={() => onSend(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Studio Page ────────────────────────────────────────────────────────
function ReberStudio() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading, stop } = useReberAI();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = (text: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    const fileCommandResult = executePlanetbintangFileCommand(msg);
    sendMessage(fileCommandResult ? `File Manager Planetbintang menjalankan perintah ini:\n${fileCommandResult}` : msg);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  return (
    <div className="reber-layout">
      <SystemSidebar onSendMessage={handleSend} />

      <main className="reber-main">
        <div className="reber-stats">
          <div className="reber-stat">
            <span>Model:</span>
            <span className="reber-stat-value">AI Reber</span>
          </div>
          <div className="reber-stat">
            <span>Mode produksi:</span>
            <span className="reber-stat-value">Web · App · Chat · Agent</span>
          </div>
          <div className="reber-stat">
            <span>Workspace:</span>
            <span className="reber-stat-value">RILE Global</span>
          </div>
        </div>

        <div className="reber-chat-container">
          {messages.length === 0 ? (
            <WelcomeScreen onSend={handleSend} />
          ) : (
            <Messages messages={messages} />
          )}

          <div className="reber-chat-input-area">
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <button className="reber-btn reber-btn-ghost" onClick={stop} style={{ fontSize: 12 }}>
                  ⏹ Hentikan
                </button>
              </div>
            )}
            <form className="reber-chat-form" onSubmit={(e) => { e.preventDefault(); handleSend(input); }}>
              <textarea
                ref={textareaRef}
                className="reber-chat-input"
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Tanyakan kepada AI Reber... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                disabled={isLoading}
                rows={1}
              />
              <button
                type="submit"
                className="reber-btn reber-btn-primary"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <span className="reber-spinner" style={{ color: "white" }}>Reber</span>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                    </svg>
                    Kirim
                  </>
                )}
              </button>
            </form>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {["Jelajahi kata/", "Buat sistem baru", "Buat kode", "Kelola file"].map((label) => (
                <button
                  key={label}
                  className="reber-chip"
                  style={{ fontSize: 11 }}
                  onClick={() => handleSend(label)}
                  disabled={isLoading}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>


    </div>
  );
}

export const Route = createFileRoute("/")({
  component: ReberStudio,
});
