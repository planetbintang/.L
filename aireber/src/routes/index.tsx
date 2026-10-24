import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Streamdown } from "streamdown";
import { useReberAI } from "@/lib/reber-hook";
import type { ChatMessages } from "@/lib/reber-hook";
import {
  REBER_PHILOSOPHY,
  OPENSOURCE_REFS,
} from "@/lib/reber-system";
import { PERPUSNAS_REF, KATA_CATEGORIES, getTotalKataCount } from "@/lib/kata-data";
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

// ── Sidebar System Info ────────────────────────────────────────────────────
function SystemSidebar({ onSendMessage }: { onSendMessage: (msg: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    philosophy: true,
    kata: false,
    refs: false,
  });

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside className="reber-sidebar">
      <div className="reber-sidebar-header">AlluniverS_OS</div>
      <div className="reber-sidebar-scroll">

        {/* System Tree */}
        <div className="reber-sidebar-header" style={{ cursor: "pointer" }} onClick={() => toggle("tree")}>
          📁 Pohon Sistem
        </div>
        <div>
          <div className="reber-tree-item" onClick={() => onSendMessage("Tampilkan struktur direktori /allunivers_os/")}>
            <span>📁</span> allunivers_os/
          </div>
          <div className="reber-tree-item" style={{ paddingLeft: 28 }} onClick={() => onSendMessage("Tampilkan file di /allunivers_os/reber_ai/")}>
            <span>📁</span> reber_ai/
          </div>
          <div className="reber-tree-item" style={{ paddingLeft: 28 }} onClick={() => onSendMessage("Tampilkan direktori /allunivers_os/kata/ dengan 1,45 juta node kata")}>
            <span>📁</span> kata/ <span style={{ fontSize: 10, color: "var(--reber-text-muted)", marginLeft: 4 }}>1.45M</span>
          </div>
        </div>

        <div className="reber-divider" />

        {/* Philosophy */}
        <div
          className="reber-sidebar-header"
          style={{ cursor: "pointer" }}
          onClick={() => toggle("philosophy")}
        >
          {expanded.philosophy ? "▼" : "▶"} Filosofi Reber
        </div>
        {expanded.philosophy && (
          <div style={{ padding: "8px 16px" }}>
            {Object.entries(REBER_PHILOSOPHY).filter(([k]) => k !== "full").map(([key, val]) => (
              <div key={key} className="reber-phil-row" style={{ marginBottom: 6, fontSize: 12 }}>
                <span className="reber-phil-key">{key.replace("_", ":")}:</span>
                <span className="reber-phil-val">{val.split("(")[0].trim()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="reber-divider" />

        {/* Kata Stats */}
        <div
          className="reber-sidebar-header"
          style={{ cursor: "pointer" }}
          onClick={() => toggle("kata")}
        >
          {expanded.kata ? "▼" : "▶"} Sistem Kata
        </div>
        {expanded.kata && (
          <div style={{ padding: "8px 12px" }}>
            <div className="reber-stat" style={{ marginBottom: 8 }}>
              <span>Total: </span>
              <span className="reber-stat-value">{getTotalKataCount().toLocaleString()}+</span>
            </div>
            {KATA_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="reber-tree-item"
                style={{ paddingLeft: 8, paddingRight: 8 }}
                onClick={() => onSendMessage(`Tampilkan daftar kata dalam kategori "${cat.nameid}"`)}
              >
                <span style={{ fontSize: 11, flex: 1 }}>{cat.nameid}</span>
                <span style={{ fontSize: 10, color: "var(--reber-text-muted)" }}>
                  {cat.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="reber-divider" />

        {/* References */}
        <div
          className="reber-sidebar-header"
          style={{ cursor: "pointer" }}
          onClick={() => toggle("refs")}
        >
          {expanded.refs ? "▼" : "▶"} Referensi
        </div>
        {expanded.refs && (
          <div style={{ padding: "8px 12px" }}>
            <div
              className="reber-ref-item"
              style={{ cursor: "pointer" }}
              onClick={() => onSendMessage("Apa saja yang bisa saya temukan di Perpustakaan Nasional Indonesia (perpusnas.go.id)?")}
            >
              <span className="reber-ref-icon">🏛️</span>
              <div className="reber-ref-info">
                <div className="reber-ref-name">Perpusnas RI</div>
                <div className="reber-ref-desc">{PERPUSNAS_REF.url}</div>
              </div>
            </div>
            {OPENSOURCE_REFS.slice(0, 8).map((ref) => (
              <div key={ref} className="reber-ref-item" style={{ cursor: "pointer" }}
                onClick={() => onSendMessage(`Ceritakan tentang ${ref} dan kaitannya dengan sistem AlluniverS_OS`)}>
                <span className="reber-ref-icon">🔗</span>
                <div className="reber-ref-info">
                  <div className="reber-ref-name" style={{ fontSize: 11 }}>
                    {ref.replace("https://", "")}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding: "4px 8px", fontSize: 11, color: "var(--reber-text-muted)" }}>
              + {OPENSOURCE_REFS.length - 8} referensi open source lainnya
            </div>
          </div>
        )}

        <div className="reber-divider" />

        {/* Quick Actions */}
        <div className="reber-sidebar-header">Aksi Cepat</div>
        {[
          { label: "Jelajahi kata/", msg: "Jelajahi direktori allunivers_os/kata/ dan tampilkan 20 kata pertama" },
          { label: "Buat kata baru", msg: "Bantu saya membuat node kata baru di sistem" },
          { label: "Bangun sistem", msg: "Bantu saya membangun sistem turunan baru di bawah allunivers_os dengan domainnya sendiri" },
          { label: "Buat kode", msg: "Buatkan komponen aplikasi web menggunakan format file allunivers_os" },
          { label: "Tentang AI Reber", msg: "Jelaskan sistem AI Reber, filosofinya, dan kemampuannya" },
        ].map((action) => (
          <div
            key={action.label}
            className="reber-tree-item"
            onClick={() => onSendMessage(action.msg)}
          >
            <span>›</span> {action.label}
          </div>
        ))}

      </div>
    </aside>
  );
}

// ── Preview Sidebar ────────────────────────────────────────────────────────
function PreviewSidebar() {
  return (
    <aside className="reber-sidebar" style={{ width: 220, borderLeft: "1px solid var(--reber-border-light)", borderRight: "none" }}>
      <div className="reber-sidebar-header">Info Sistem</div>
      <div className="reber-sidebar-scroll">
        <div style={{ padding: "12px 16px" }}>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--reber-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "Mesin AI", status: "online" },
                { label: "Sistem Kata", status: "online" },
                { label: "Sistem File", status: "online" },
                { label: "Basis Data Terhubung", status: "online" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--reber-text-secondary)" }}>
                  <span>{item.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="reber-status-dot" />
                    <span style={{ fontSize: 11, color: "#22c55e" }}>Aktif</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reber-divider" />

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--reber-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Ekstensi File</div>
            {[
              { ext: ".ieje", label: "Lapisan Tampilan" },
              { ext: ".aeea", label: "Lapisan Gaya" },
              { ext: ".nz", label: "Lapisan Logika" },
              { ext: ".ck", label: "Komponen" },
              { ext: ".regs", label: "Registri" },
              { ext: ".log", label: "Log Sistem" },
            ].map((item) => (
              <div key={item.ext} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span className={`reber-tag reber-tag-${item.ext.slice(1)}`}>{item.ext}</span>
                <span style={{ fontSize: 11, color: "var(--reber-text-secondary)" }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="reber-divider" />

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--reber-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Node Kata</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--reber-primary)" }}>
              {getTotalKataCount().toLocaleString()}+
            </div>
            <div style={{ fontSize: 11, color: "var(--reber-text-muted)", marginTop: 2 }}>total kata dalam sistem</div>
          </div>

          <div className="reber-divider" />

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--reber-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Domain Kustom</div>
            <div style={{ fontSize: 12, color: "var(--reber-primary)", fontFamily: "monospace", background: "var(--reber-primary-pale)", padding: "4px 8px", borderRadius: 4 }}>
              *.allunivers.digital
            </div>
          </div>

        </div>
      </div>
    </aside>
  );
}

// ── Welcome Screen ─────────────────────────────────────────────────────────
function WelcomeScreen({ onSend }: { onSend: (msg: string) => void }) {
  const prompts = [
    "Apa tips agar tidur lebih nyenyak?",
    "Jelaskan cara kerja internet secara sederhana",
    "Berikan ide resep masakan untuk makan malam",
    "Bagaimana cara mulai belajar pemrograman?",
    "Apa perbedaan cuaca dan iklim?",
    "Buatkan rencana olahraga ringan untuk pemula",
    "Ceritakan sejarah singkat Candi Borobudur",
    "Bagaimana cara mengatur keuangan pribadi?",
  ];

  return (
    <div className="reber-welcome">
      <div className="reber-welcome-logo">Re</div>
      <h1>AI Reber</h1>
      <p className="reber-welcome-tagline">
        Re:Bersama
      </p>

      <div className="reber-welcome-philosophy">
        <h3>Filosofi Reber</h3>
        <div className="reber-phil-row">
          <span className="reber-phil-key">Re:</span>
          <span className="reber-phil-val">Bertindak — Bertindak dengan Tujuan</span>
        </div>
        <div className="reber-phil-row">
          <span className="reber-phil-key">Be:</span>
          <span className="reber-phil-val">Berdua · Bersama — Kebersamaan</span>
        </div>
        <div className="reber-phil-row">
          <span className="reber-phil-key">Ber:</span>
          <span className="reber-phil-val">Bener · Mener — Benar & Menuntun</span>
        </div>
        <div className="reber-phil-row">
          <span className="reber-phil-key">Be_r:</span>
          <span className="reber-phil-val">Bener + Mener — Memimpin dengan Benar</span>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--reber-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Mulai dengan prompt:
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
            <span>Kata:</span>
            <span className="reber-stat-value">{getTotalKataCount().toLocaleString()}+</span>
          </div>
          <div className="reber-stat">
            <span>Sistem:</span>
            <span className="reber-stat-value">AlluniverS_OS v1.0</span>
          </div>
          <div className="reber-stat">
            <span>Referensi:</span>
            <span className="reber-stat-value">perpusnas.go.id + {OPENSOURCE_REFS.length} sumber terbuka</span>
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

      <PreviewSidebar />
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: ReberStudio,
});
