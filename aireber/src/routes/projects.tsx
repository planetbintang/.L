import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";

interface Project {
  id?: number;
  name: string;
  slug: string;
  description: string;
  domain: string;
  systemPath: string;
  status: string;
  createdAt?: string;
}

function CreateProjectDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Partial<Project>) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,26,51,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "white", borderRadius: 12, padding: 28, width: 480, boxShadow: "0 16px 48px rgba(0,102,204,0.25)", border: "1px solid var(--reber-border-light)" }}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: 18, color: "var(--reber-text)" }}>
          🚀 Sistem Turunan Baru
        </h3>

        {[
          { label: "Nama Sistem", value: name, setter: handleNameChange, placeholder: "Sistem AI Saya", type: "text" },
          { label: "Slug", value: slug, setter: setSlug, placeholder: "sistem-ai-saya", type: "text" },
          { label: "Deskripsi", value: description, setter: setDescription, placeholder: "Jelaskan sistem turunan Anda...", type: "textarea" },
        ].map(({ label, value, setter, placeholder, type }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--reber-text-secondary)", display: "block", marginBottom: 4 }}>{label}</label>
            {type === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                rows={3}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid var(--reber-border)", borderRadius: 8, fontSize: 14, outline: "none", background: "var(--reber-bg)", resize: "vertical", fontFamily: "inherit" }}
              />
            ) : (
              <input
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid var(--reber-border)", borderRadius: 8, fontSize: 14, outline: "none", background: "var(--reber-bg)" }}
              />
            )}
          </div>
        ))}

        {slug && (
          <div style={{ background: "var(--reber-primary-pale)", border: "1px solid var(--reber-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--reber-text-muted)", marginBottom: 4 }}>Domain Kustom</div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: "var(--reber-primary)", fontWeight: 700 }}>
              {slug}.allunivers.digital
            </div>
            <div style={{ fontSize: 11, color: "var(--reber-text-muted)", marginTop: 4 }}>
              Lokasi sistem: /allunivers_os/{slug}/
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="reber-btn reber-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button
            className="reber-btn reber-btn-primary"
            style={{ flex: 1 }}
            onClick={() => name.trim() && onCreate({
              name,
              slug,
              description,
              domain: `${slug}.allunivers.digital`,
              systemPath: `/allunivers_os/${slug}`,
              status: "active",
            })}
          >
            🚀 Buat Sistem
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: number) => void }) {
  return (
    <div className="reber-project-card">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "var(--reber-primary)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800, flexShrink: 0,
        }}>
          {project.name[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--reber-text)", marginBottom: 2 }}>{project.name}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span className="reber-project-domain">{project.domain}</span>
            <span className={`reber-tag ${project.status === "active" ? "reber-tag-nz" : "reber-tag-log"}`}>
              {project.status === "active" ? "aktif" : project.status}
            </span>
          </div>
        </div>
        <button
          className="reber-btn reber-btn-danger"
          style={{ fontSize: 11, padding: "3px 8px" }}
          onClick={(e) => { e.stopPropagation(); project.id && onDelete(project.id); }}
        >
          ✕
        </button>
      </div>

      {project.description && (
        <div style={{ marginTop: 10, fontSize: 13, color: "var(--reber-text-secondary)", lineHeight: 1.5 }}>
          {project.description}
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8, fontSize: 11, color: "var(--reber-text-muted)" }}>
        <span>📁 {project.systemPath}</span>
        {project.createdAt && (
          <span style={{ marginLeft: "auto" }}>
            {new Date(project.createdAt).toLocaleDateString("id-ID")}
          </span>
        )}
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
        {[
          { label: "index.ieje", ext: "ieje" },
          { label: "style.aeea", ext: "aeea" },
          { label: "fungsi.nz", ext: "nz" },
        ].map((f) => (
          <span key={f.label} className={`reber-tag reber-tag-${f.ext}`} style={{ fontSize: 10 }}>{f.label}</span>
        ))}
      </div>
    </div>
  );
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (data: Partial<Project>) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...data }),
      });
      const project = await res.json();
      setProjects((prev) => [...prev, project]);
      setShowCreate(false);
    } catch (err) {
      // fallback: add locally
      setProjects((prev) => [...prev, { ...data as Project, id: Date.now(), createdAt: new Date().toISOString() }]);
      setShowCreate(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="reber-layout">
      {/* Sidebar */}
      <aside className="reber-sidebar">
        <div className="reber-sidebar-header">🌐 Info Proyek</div>
        <div className="reber-sidebar-scroll">
          <div style={{ padding: "16px" }}>
            <div style={{ fontSize: 12, color: "var(--reber-text-secondary)", lineHeight: 1.6 }}>
              Buat sistem turunan dari AlluniverS_OS dengan domain kustom <strong style={{ color: "var(--reber-primary)" }}>.allunivers.digital</strong>
            </div>
            <div className="reber-divider" style={{ margin: "12px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--reber-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Format Domain
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--reber-primary)", background: "var(--reber-primary-pale)", padding: "6px 10px", borderRadius: 6 }}>
              [nama].allunivers.digital
            </div>
            <div className="reber-divider" style={{ margin: "12px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--reber-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Setiap Proyek Mendapatkan
            </div>
            {["index.ieje (tampilan)", "style.aeea (gaya)", "fungsi.nz (logika)", "Domain kustom", "Manajemen AI", "Sistem file"].map((item) => (
              <div key={item} style={{ fontSize: 12, color: "var(--reber-text-secondary)", padding: "3px 0", display: "flex", gap: 6 }}>
                <span style={{ color: "var(--reber-primary)" }}>✓</span> {item}
              </div>
            ))}
            <div className="reber-divider" style={{ margin: "12px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--reber-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Statistik
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--reber-primary)" }}>{projects.length}</div>
            <div style={{ fontSize: 11, color: "var(--reber-text-muted)" }}>sistem aktif</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="reber-main">
        <div className="reber-fm-toolbar">
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--reber-text)" }}>
            🌐 Sistem Turunan
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button className="reber-btn reber-btn-primary" onClick={() => setShowCreate(true)}>
              + Sistem Baru
            </button>
          </div>
        </div>

        <div className="reber-stats">
          <div className="reber-stat">
            <span>Sistem:</span>
            <span className="reber-stat-value">{projects.length}</span>
          </div>
          <div className="reber-stat">
            <span>Domain:</span>
            <span className="reber-stat-value">*.allunivers.digital</span>
          </div>
          <div className="reber-stat">
            <span>Mesin:</span>
            <span className="reber-stat-value">AlluniverS_OS v1.0</span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {loading ? (
            <div className="reber-empty">
              <div className="reber-spinner">Memuat sistem…</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="reber-empty">
              <div className="reber-empty-icon">🌱</div>
              <div style={{ fontWeight: 600 }}>Belum ada sistem turunan</div>
              <div style={{ fontSize: 13, color: "var(--reber-text-muted)" }}>
                Buat sistem pertama Anda dengan domain .allunivers.digital
              </div>
              <button className="reber-btn reber-btn-primary" style={{ marginTop: 12 }} onClick={() => setShowCreate(true)}>
                🚀 Buat Sistem Pertama
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {projects.map((p) => (
                <ProjectCard key={p.id || p.slug} project={p} onDelete={handleDelete} />
              ))}
              <div
                style={{
                  border: "2px dashed var(--reber-border)",
                  borderRadius: 10, padding: 24,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 8, cursor: "pointer", color: "var(--reber-text-muted)", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--reber-primary)"; (e.currentTarget as HTMLDivElement).style.color = "var(--reber-primary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--reber-border)"; (e.currentTarget as HTMLDivElement).style.color = "var(--reber-text-muted)"; }}
                onClick={() => setShowCreate(true)}
              >
                <div style={{ fontSize: 32 }}>+</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Sistem Turunan Baru</div>
                <div style={{ fontSize: 11 }}>*.allunivers.digital</div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateProjectDialog onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/projects")({
  component: Projects,
});
