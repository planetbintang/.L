import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ArrowRight, ChevronDown, Cloud, LockKeyhole, Orbit, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="pb-home">
      <header className="pb-public-nav">
        <Link href="/" className="pb-brand" aria-label="PlanetBintang home">
          <span className="pb-brand-mark"><Orbit size={21} /></span>
          <span>PlanetBintang</span>
        </Link>
        <nav className="pb-public-links" aria-label="Main navigation">
          <div className="pb-nav-dropdown">
            <button className="pb-nav-link" type="button">GALERI <ChevronDown size={15} /></button>
            <div className="pb-dropdown-panel">
              <p className="pb-dropdown-label">RUANG KERJA</p>
              <Link href="/" className="pb-dropdown-item">
                <span><Cloud size={16} /> Dashboard</span><ArrowRight size={15} />
              </Link>
              {!user && <p className="pb-dropdown-hint">Login diperlukan untuk membuka file manager.</p>}
            </div>
          </div>
          <a href="#cara-kerja" className="pb-nav-link">Cara kerja</a>
          <a href="#keamanan" className="pb-nav-link">Keamanan</a>
        </nav>
        <div className="pb-public-actions">
          {user ? (
            <Link href="/" className="pb-button pb-button-primary">Buka Dashboard <ArrowRight size={16} /></Link>
          ) : (
            <button className="pb-button pb-button-primary" onClick={() => startLogin()} disabled={loading}>Masuk / Daftar <ArrowRight size={16} /></button>
          )}
        </div>
      </header>

      <section className="pb-hero">
        <div className="pb-hero-copy">
          <div className="pb-eyebrow"><span className="pb-eyebrow-dot" /> GALERI PLANETBINTANG</div>
          <h1>Ruang aman untuk semua <span>objek penting</span> Anda.</h1>
          <p>Simpan media, dokumen, dan filesistem kode di satu file manager yang tumbuh mengikuti kebutuhan Anda—tanpa menaruh file besar di server aplikasi.</p>
          <div className="pb-hero-actions">
            {user ? <Link href="/" className="pb-button pb-button-primary pb-button-large">Masuk ke Galeri <ArrowRight size={18} /></Link> : <button onClick={() => startLogin()} className="pb-button pb-button-primary pb-button-large">Mulai dengan akun PlanetBintang <ArrowRight size={18} /></button>}
            <a href="#cara-kerja" className="pb-text-link">Pelajari cara kerja <ArrowRight size={15} /></a>
          </div>
          <div className="pb-trust-row"><LockKeyhole size={15} /> Object storage terpisah &amp; metadata terindeks aman</div>
        </div>
        <div className="pb-hero-art" aria-label="Illustration of PlanetBintang storage">
          <div className="pb-orbit orbit-one" /><div className="pb-orbit orbit-two" />
          <div className="pb-planet"><Orbit size={82} strokeWidth={1.15} /></div>
          <div className="pb-floating-card card-top"><span className="pb-mini-icon green"><Cloud size={15} /></span><div><strong>Storage siap tumbuh</strong><small>Direct-to-object storage</small></div></div>
          <div className="pb-floating-card card-bottom"><span className="pb-mini-icon blue"><Sparkles size={15} /></span><div><strong>File manager terpusat</strong><small>Rapi hingga ribuan item</small></div></div>
        </div>
      </section>

      <section id="cara-kerja" className="pb-feature-strip">
        <div><span className="pb-feature-number">01</span><div><strong>Unggah langsung</strong><p>Bytes file dikirim langsung ke object storage melalui URL aman.</p></div></div>
        <div><span className="pb-feature-number">02</span><div><strong>Indeks terstruktur</strong><p>Folder, metadata, dan izin tersimpan di database yang mudah dicari.</p></div></div>
        <div id="keamanan"><span className="pb-feature-number">03</span><div><strong>Akses terkunci</strong><p>Dashboard GALERI baru terbuka setelah akun terautentikasi.</p></div></div>
      </section>

      <footer className="pb-footer"><span>© 2026 PlanetBintang</span><span>Media, dokumen, dan kode — tertata untuk bertumbuh.</span></footer>
    </main>
  );
}
