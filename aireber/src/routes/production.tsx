import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Streamdown } from "streamdown";
import { useReberAI } from "@/lib/reber-hook";

type Mode = "web" | "app" | "chat" | "agent";
const MODES: Array<{ id: Mode; title: string; subtitle: string; icon: string; prompt: string }> = [
  { id: "web", title: "Website & Landing Page", subtitle: "Situs, portal, dashboard, katalog", icon: "⌘", prompt: "Bertindak sebagai tim produksi website. Susun arsitektur, halaman, UI responsif, komponen, SEO, aksesibilitas, dan implementasi kode lengkap untuk kebutuhan berikut:" },
  { id: "app", title: "Web Application", subtitle: "Aplikasi, workspace, sistem bisnis", icon: "▣", prompt: "Bertindak sebagai product engineer. Rancang dan implementasikan aplikasi web produksi dengan alur pengguna, halaman, state, validasi, keamanan, data model, API, dan kode yang dapat dijalankan untuk kebutuhan berikut:" },
  { id: "chat", title: "Chat & Assistant", subtitle: "Chatbot, customer support, knowledge bot", icon: "◫", prompt: "Bertindak sebagai conversational AI engineer. Buat rancangan dan implementasi sistem chat dengan persona, instruksi, knowledge flow, UI chat, keamanan, dan evaluasi untuk kebutuhan berikut:" },
  { id: "agent", title: "AI Agent & Workflow", subtitle: "Agent, automasi, integrasi proses", icon: "⎇", prompt: "Bertindak sebagai AI automation architect. Rancang workflow dan agent dengan trigger, tools, state, approval, retry, observability, dan guardrails untuk kebutuhan berikut:" },
];

function ProductionPage() {
  const [mode, setMode] = useState<Mode>("web");
  const [prompt, setPrompt] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accountName, setAccountName] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const { messages, sendMessage, isLoading, stop } = useReberAI();
  const activeMode = useMemo(() => MODES.find((item) => item.id === mode)!, [mode]);

  useEffect(() => {
    const token = window.localStorage.getItem("aireber.account.token.v1");
    if (!token) { setChecking(false); return; }
    fetch("/api/account?action=me", { headers: { authorization: "Bearer " + token } })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.user) { setAuthorized(true); setAccountName(data.user.name); } })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, []);

  const produce = () => {
    if (!prompt.trim() || isLoading || !authorized) return;
    sendMessage(activeMode.prompt + "\n\n" + prompt.trim() + "\n\nOutputkan hasil produksi secara terstruktur. Berikan file dan kode yang saling terhubung, jelaskan dependensi, cara menjalankan, pengujian, serta batasan integrasi yang belum memiliki kredensial. Jangan mengklaim deployment atau pembayaran sudah aktif jika belum dikonfigurasi.");
  };
  
  const saveOutput = async () => {
    const token = window.localStorage.getItem("aireber.account.token.v1");
    const output = messages.filter((message) => message.role === "assistant").flatMap((message) => message.parts.filter((part) => part.type === "text" && part.content).map((part) => part.content)).join("\n\n");
    if (!token || !output.trim()) return;
    setSaveStatus("Menyimpan hasil ke File Manager…");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = "production-" + mode + "-" + stamp + ".md";
    try {
      const response = await fetch("/api/account", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + token }, body: JSON.stringify({ action: "save-file", path: "aireber/workspace/production/" + filename, name: filename, content: output, mime: "text/markdown;charset=utf-8", metadata: { module: "ai-production", mode } }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "File gagal disimpan.");
      setSaveStatus("Hasil tersimpan di File Manager: " + data.file.path);
    } catch (error) { setSaveStatus(error instanceof Error ? error.message : "Gagal menyimpan hasil."); }
  };


  return (
    <main className="production-shell">
      <section className="production-heading">
        <div><p className="account-eyebrow">AIREBER / PRODUCTION CONTROL</p><h1>AI Production Workspace</h1><p>Bangun produk digital dari satu ruang produksi: web, aplikasi, chat, dan agent.</p></div>
        <div className="production-session">{authorized ? <><span className="reber-status-dot" /> {accountName}</> : <Link to="/account">Login / Register</Link>}</div>
      </section>
      {!authorized && !checking && <div className="production-auth-notice"><b>Login diperlukan untuk memulai produksi.</b><span>Setiap permintaan AI tercatat pada kuota anggota.</span><Link to="/account" className="account-primary">Masuk atau Buat Akun</Link></div>}
      {checking && <div className="production-auth-notice">Memeriksa sesi anggota…</div>}
      <div className="production-grid">
        <aside className="production-mode-list">
          <p className="production-label">JENIS PRODUKSI AI</p>
          {MODES.map((item) => <button key={item.id} className={mode === item.id ? "active" : ""} onClick={() => setMode(item.id)}><span className="production-mode-icon">{item.icon}</span><span><b>{item.title}</b><small>{item.subtitle}</small></span><span className="production-arrow">›</span></button>)}
          <div className="production-sidebar-foot"><b>Alur produksi</b><span>Brief → Rencana → Generate → Review → Export</span><Link to="/projects">Buka proyek →</Link><Link to="/account">Paket &amp; kuota →</Link></div>
        </aside>
        <section className="production-workbench">
          <div className="production-workbench-head"><div><p className="account-eyebrow">MODE TERPILIH</p><h2>{activeMode.title}</h2><p>{activeMode.subtitle}</p></div><span className="production-engine">REBER AI ENGINE</span></div>
          <label className="production-prompt-label" htmlFor="production-prompt">Jelaskan produk yang ingin dibuat</label>
          <textarea id="production-prompt" rows={7} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Contoh: Buat website layanan hosting dengan halaman harga, registrasi anggota, dashboard pelanggan, pengelolaan domain, dan sistem kuota." />
          <div className="production-actions"><span>Permintaan dihitung sebagai 1 unit kuota AI.</span><div><button className="reber-btn reber-btn-ghost" onClick={() => setPrompt("")}>Bersihkan</button><button className="reber-btn reber-btn-ghost" disabled={isLoading || !messages.some((message) => message.role === "assistant")} onClick={() => void saveOutput()}>Simpan hasil ke File Manager</button>{isLoading ? <button className="account-primary" onClick={stop}>Hentikan</button> : <button className="account-primary" disabled={!authorized || !prompt.trim()} onClick={produce}>Mulai Produksi AI →</button>}</div></div><p className="account-status" role="status">{saveStatus}</p>
          <div className="production-result">
            <div className="production-result-head"><b>HASIL PRODUKSI</b><span>{isLoading ? "GENERATING…" : messages.length ? "OUTPUT" : "MENUNGGU BRIEF"}</span></div>
            {messages.length ? <div className="production-messages">{messages.map((message) => <article key={message.id} className={"production-message " + message.role}><small>{message.role === "assistant" ? "AIREBER AI" : "BRIEF PENGGUNA"}</small>{message.parts.map((part, index) => part.type === "text" && part.content ? <div key={index} className="prose prose-sm max-w-none"><Streamdown>{part.content}</Streamdown></div> : null)}</article>)}</div> : <div className="production-empty"><span>✧</span><b>Hasil produksi akan tampil di sini</b><small>Pilih jenis AI, tulis brief, lalu jalankan proses produksi.</small></div>}
          </div>
        </section>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/production")({ component: ProductionPage });
