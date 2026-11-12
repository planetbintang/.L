import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

type User = { id: number; email: string; name: string; role: string; plan?: string; quotaRequests?: number; usedRequests?: number; quotaResetAt?: string; createdAt?: string; lastLoginAt?: string | null };
type UsageData = { quota: { plan: string; limit: number; used: number; remaining: number; resetAt: string }; usage: Array<{ id: number; action: string; units: number; model?: string | null; createdAt?: string }> };
type AccountFile = { id: number; path: string; name: string; mime: string; content: string; size: number; updatedAt?: string };
const TOKEN_KEY = "aireber.account.token.v1";
const api = async (method: "GET" | "POST", action: string, body?: Record<string, unknown>, token?: string) => {
  const response = await fetch("/api/account" + (method === "GET" ? "?action=" + encodeURIComponent(action) : ""), {
    method, headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) },
    ...(method === "POST" ? { body: JSON.stringify({ action, ...body }) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Permintaan akun gagal.");
  return data;
};

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [section, setSection] = useState<"dashboard" | "profile" | "settings" | "files" | "quota" | "monitoring" | "members">("dashboard");
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState<AccountFile[]>([]);
  const [settings, setSettings] = useState({ theme: "gelap-abstrak", saveChatHistory: true, emailNotice: false });
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("aireber/workspace/catatan.txt");
  const [fileContent, setFileContent] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async (activeToken: string) => {
    const [me, storedFiles, storedSettings, storedUsage] = await Promise.all([
      api("GET", "me", undefined, activeToken), api("GET", "files", undefined, activeToken), api("GET", "settings", undefined, activeToken), api("GET", "usage", undefined, activeToken),
    ]);
    setUser(me.user); setName(me.user.name); setFiles(storedFiles.files || []); setUsage(storedUsage);
    if (me.user.role === "admin") { const adminData = await api("GET", "members", undefined, activeToken); setMembers(adminData.members || []); }
  };
  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_KEY);
    if (saved) { setToken(saved); refresh(saved).catch(() => { window.localStorage.removeItem(TOKEN_KEY); setToken(""); }); }
  }, []);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const result = await api("POST", mode === "register" ? "register" : "login", { name, email, password });
      window.localStorage.setItem(TOKEN_KEY, result.token); setToken(result.token); setPassword("");
      await refresh(result.token); setStatus(mode === "register" ? "Akun berhasil dibuat." : "Login berhasil."); setSection("dashboard");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Autentikasi gagal."); }
    finally { setBusy(false); }
  };
  const logout = async () => {
    try { await api("POST", "logout", {}, token); } catch { /* token lokal tetap dibersihkan */ }
    window.localStorage.removeItem(TOKEN_KEY); setToken(""); setUser(null); setFiles([]); setStatus("Anda telah keluar.");
  };
  const saveProfile = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { const result = await api("POST", "update-profile", { name }, token); setUser(result.user); setStatus("Profil berhasil diperbarui."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Profil gagal disimpan."); }
    finally { setBusy(false); }
  };
  const saveSettings = async () => {
    setBusy(true);
    try { await api("POST", "update-settings", { settings }, token); setStatus("Pengaturan tersimpan pada database AIREBER."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Pengaturan gagal disimpan."); }
    finally { setBusy(false); }
  };
  const saveFile = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      const result = await api("POST", "save-file", { path: filePath, name: fileName || filePath.split("/").pop(), content: fileContent, mime: "text/plain;charset=utf-8", metadata: { module: "aireber", manager: "file-manager" } }, token);
      setFiles((old) => [result.file, ...old.filter((file) => file.path !== result.file.path)]); setStatus("File disimpan ke File Manager AIREBER.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "File gagal disimpan."); }
    finally { setBusy(false); }
  };
  const deleteFile = async (file: AccountFile) => {
    if (!window.confirm("Hapus " + file.path + " dari File Manager?")) return;
    try { await api("POST", "delete-file", { id: file.id }, token); setFiles((old) => old.filter((item) => item.id !== file.id)); setStatus("File dihapus."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "File gagal dihapus."); }
  };

  return (
    <main className="aireber-account">
      <div className="aireber-account-head">
        <div><p className="account-eyebrow">AIREBER / ACCOUNT CENTER</p><h1>Akun &amp; Manajemen AIREBER</h1><p>Kelola identitas, preferensi AI, proyek, dan file workspace dalam satu pusat data.</p></div>
        <Link to="/" className="account-back">← Kembali ke AI Studio</Link>
      </div>
      {!user ? (
        <section className="account-auth-card">
          <div className="account-auth-intro"><span className="account-mark">Re</span><h2>{mode === "register" ? "Buat akun AIREBER" : "Login AIREBER"}</h2><p>Akun disimpan pada registri server AIREBER. Password diproses dengan PBKDF2 dan tidak disimpan sebagai teks biasa.</p></div>
          <div className="account-mode"><button className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>LOGIN</button><button className={mode === "register" ? "selected" : ""} onClick={() => setMode("register")}>REGISTER</button></div>
          <form className="account-form" onSubmit={submitAuth}>
            {mode === "register" && <label>Nama pengguna<input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
            <label>Email<input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
            <label>Kata sandi<input required type="password" minLength={10} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
            <button className="account-primary" disabled={busy}>{busy ? "Memproses…" : mode === "register" ? "Buat Akun" : "Login"}</button>
          </form>
          <p className="account-status" role="status">{status || "Backend memerlukan deployment Netlify dan database yang sudah aktif."}</p>
          <p className="account-footnote">GitHub Pages adalah hosting statis. Jika API tidak tersedia pada origin ini, buka deployment Netlify AIREBER yang telah dikonfigurasi.</p>
        </section>
      ) : (
        <div className="account-layout">
          <aside className="account-sidebar">
            <div className="account-user"><span className="account-avatar">{user.name.slice(0,1).toUpperCase()}</span><b>{user.name}</b><small>{user.email}</small><span className="account-role">{user.role.toUpperCase()}</span></div>
            {(["dashboard","profile","settings","files","quota","monitoring",...(user.role === "admin" ? ["members" as const] : [])] as const).map((item) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{({dashboard:"Dashboard",profile:"Profil",settings:"Pengaturan",files:"File Manager",quota:"Paket & Kuota",monitoring:"Monitoring",members:"Anggota"})[item]}</button>)}
            <button className="account-logout" onClick={logout}>Keluar dari akun</button>
          </aside>
          <section className="account-content">
            {section === "dashboard" && <><p className="account-eyebrow">OVERVIEW / AIREBER</p><h2>Dashboard Profil</h2><div className="account-stats"><article><small>STATUS AKUN</small><b>AKTIF</b></article><article><small>PAKET</small><b>{(user.plan || "free").toUpperCase()}</b></article><article><small>SISA KUOTA</small><b>{usage?.quota.remaining ?? "—"}</b></article></div>
            {user.role === "admin" && <div className="account-stats"><article><small>ANGGOTA TERDAFTAR</small><b>{members.length}</b></article><article><small>PAKET BERBAYAR</small><b>{members.filter((member) => member.plan && member.plan !== "free").length}</b></article><article><small>ESTIMASI NILAI PAKET / BULAN</small><b>Rp{members.reduce((sum, member) => sum + (member.plan === "creator" ? 99000 : member.plan === "pro" ? 299000 : member.plan === "enterprise" ? 0 : 0), 0).toLocaleString("id-ID")}</b></article></div>}
            {user.role === "admin" && <p className="account-footnote">Estimasi berdasarkan paket yang ditetapkan, bukan pendapatan transaksi terverifikasi. Integrasi pembayaran belum aktif.</p>}
            <div className="account-panel"><h3>Penggunaan AI bulan ini</h3><div className="quota-track"><span style={{width: Math.min(100, ((usage?.quota.used || 0) / Math.max(1, usage?.quota.limit || 1)) * 100) + "%"}} /></div><p>{usage?.quota.used ?? 0} dari {usage?.quota.limit ?? 0} request terpakai. Reset: {usage?.quota.resetAt ? new Date(usage.quota.resetAt).toLocaleDateString("id-ID") : "—"}.</p><button className="account-primary compact" onClick={() => setSection("quota")}>Kelola Paket dan Kuota</button></div><div className="account-panel"><h3>Ringkasan akun</h3><p>Nama: {user.name}</p><p>Email: {user.email}</p><p>Terdaftar: {user.createdAt ? new Date(user.createdAt).toLocaleString("id-ID") : "—"}</p><p>Login terakhir: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("id-ID") : "Sesi saat ini"}</p></div><div className="account-panel"><h3>Manajemen AIREBER</h3><p>Kelola file, prompt, konfigurasi, dan dokumen AIREBER melalui File Manager akun. Data setiap akun dipisahkan di database server.</p><button className="account-primary compact" onClick={() => setSection("files")}>Buka File Manager</button></div></>}
            {section === "profile" && <><p className="account-eyebrow">IDENTITAS PENGGUNA</p><h2>Profil Akun</h2><form className="account-form account-panel" onSubmit={saveProfile}><label>Nama tampilan<input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required /></label><label>Email terdaftar<input value={user.email} readOnly /></label><label>ID akun<input value={"AIREBER-" + user.id} readOnly /></label><button className="account-primary" disabled={busy}>Simpan Profil</button></form></>}
            {section === "settings" && <><p className="account-eyebrow">PREFERENSI &amp; KEAMANAN</p><h2>Pengaturan Akun</h2><div className="account-panel account-form"><label>Tema AIREBER<select value={settings.theme} onChange={(e) => setSettings((old) => ({...old, theme:e.target.value}))}><option value="gelap-abstrak">Gelap Abstrak</option><option value="cahaya">Cahaya</option><option value="air">Cahaya Air</option><option value="berlian">Berlian Kaca</option></select></label><label className="account-check"><input type="checkbox" checked={settings.saveChatHistory} onChange={(e) => setSettings((old) => ({...old, saveChatHistory:e.target.checked}))} /> Simpan preferensi riwayat chat</label><label className="account-check"><input type="checkbox" checked={settings.emailNotice} onChange={(e) => setSettings((old) => ({...old, emailNotice:e.target.checked}))} /> Notifikasi email (preferensi)</label><button className="account-primary" onClick={saveSettings} disabled={busy}>Simpan Pengaturan</button></div></>}
            {section === "files" && <><p className="account-eyebrow">REIC FILE REGISTRY</p><h2>File Manager Akun</h2><p className="account-muted">Penyimpanan server terpisah per akun. Path file berada pada namespace akun AIREBER.</p><form className="account-panel account-form" onSubmit={saveFile}><label>Nama file<input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="catatan.txt" /></label><label>Path<input value={filePath} onChange={(e) => setFilePath(e.target.value)} required /></label><label>Isi file<textarea rows={5} value={fileContent} onChange={(e) => setFileContent(e.target.value)} /></label><button className="account-primary" disabled={busy}>Simpan ke File Manager</button></form><div className="account-file-list">{files.map((file) => <article key={file.id}><div><b>{file.name}</b><small>{file.path} · {file.size.toLocaleString("id-ID")} byte</small></div><button onClick={() => {setFileName(file.name);setFilePath(file.path);setFileContent(file.content);}}>Buka</button><button className="danger" onClick={() => void deleteFile(file)}>Hapus</button></article>)}{files.length === 0 && <div className="account-panel">Belum ada file akun. Buat file pertama melalui formulir di atas.</div>}</div></>}
            {section === "quota" && <><p className="account-eyebrow">MEMBERSHIP / USAGE LIMITS</p><h2>Paket &amp; Kuota AI</h2><div className="account-stats"><article><small>PAKET AKTIF</small><b>{(usage?.quota.plan || "free").toUpperCase()}</b></article><article><small>KUOTA BULANAN</small><b>{usage?.quota.limit ?? 30}</b></article><article><small>TERSISA</small><b>{usage?.quota.remaining ?? 30}</b></article></div><div className="plan-grid">{[{key:"free",name:"Free",price:"Rp0",quota:"30 request/bulan",features:"Uji coba AI Studio"},{key:"creator",name:"Creator",price:"Rp99.000",quota:"500 request/bulan",features:"Produksi web, app, dan chat"},{key:"pro",name:"Pro",price:"Rp299.000",quota:"3.000 request/bulan",features:"Produksi intensif dan workflow"},{key:"enterprise",name:"Enterprise",price:"Hubungi kami",quota:"30.000 request/bulan*",features:"Tim dan kapasitas lebih besar"}].map((plan) => <article className={"plan-card " + ((usage?.quota.plan || "free") === plan.key ? "current" : "")} key={plan.key}><small>{plan.name.toUpperCase()}</small><h3>{plan.price}<span>/bulan</span></h3><b>{plan.quota}</b><p>{plan.features}</p>{(usage?.quota.plan || "free") === plan.key ? <span className="plan-current">Paket aktif</span> : <span className="plan-contact">Hubungi pengelola AIREBER untuk aktivasi paket.</span>}</article>)}</div><p className="account-footnote">*Kuota paket ditetapkan pengelola. Harga merupakan rancangan paket dan belum menjadi transaksi otomatis. Gateway pembayaran perlu dikonfigurasi sebelum penagihan aktif.</p></>}
            {section === "monitoring" && <><p className="account-eyebrow">AI OPERATIONS / ACTIVITY</p><h2>Monitoring Pemakaian</h2><div className="account-stats"><article><small>REQUEST TERCATAT</small><b>{usage?.usage.length ?? 0}</b></article><article><small>PEMAKAIAN BULAN INI</small><b>{usage?.quota.used ?? 0}</b></article><article><small>STATUS KUOTA</small><b>{(usage?.quota.remaining ?? 0) > 0 ? "NORMAL" : "HABIS"}</b></article></div><div className="account-panel"><h3>Riwayat aktivitas AI</h3><div className="usage-table">{usage?.usage.map((row) => <div key={row.id}><b>{row.action.toUpperCase()}</b><span>{row.model || "AI Provider"}</span><small>{row.createdAt ? new Date(row.createdAt).toLocaleString("id-ID") : "—"}</small><strong>{row.units} unit</strong></div>)}</div>{!usage?.usage.length && <p>Belum ada pemakaian AI tercatat.</p>}</div></>}
            {section === "members" && user.role === "admin" && <><p className="account-eyebrow">ADMINISTRATION / MEMBERS</p><h2>Manajemen Anggota</h2><p className="account-muted">Kelola status, paket, dan reset kuota anggota.</p><div className="member-table">{members.map((member) => <article key={member.id}><div><b>{member.name}</b><small>{member.email} · {member.role} · {(member.plan || "free").toUpperCase()}</small></div><select aria-label={"Paket " + member.email} defaultValue={member.plan || "free"} id={"plan-" + member.id}><option value="free">Free</option><option value="creator">Creator</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select><select aria-label={"Status " + member.email} defaultValue="active" id={"status-" + member.id}><option value="active">Aktif</option><option value="suspended">Ditangguhkan</option></select><button className="account-primary compact" onClick={async () => { const plan = (document.getElementById("plan-" + member.id) as HTMLSelectElement).value; const status = (document.getElementById("status-" + member.id) as HTMLSelectElement).value; try { await api("POST","update-member",{id:member.id,plan,status},token); await refresh(token); setStatus("Keanggotaan diperbarui."); } catch (error) { setStatus(error instanceof Error ? error.message : "Gagal memperbarui anggota."); } }}>Simpan</button></article>)}</div></>}
            <p className="account-status" role="status">{status}</p>
          </section>
        </div>
      )}
    </main>
  );
}
