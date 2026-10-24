import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  KATA_CATEGORIES,
  getTotalKataCount,
  generateIndexIeje,
  generateStyleAeea,
  generateFungsiNz,
  searchKata,
  getKataList,
  PERPUSNAS_REF,
  OPENSOURCE_REFS,
} from "@/lib/kata-data";
import { browseVirtualPath, getVirtualFileContent, extColor } from "@/lib/virtual-fs";
import type { VirtualNode } from "@/lib/virtual-fs";

// ── File icon by type/extension ───────────────────────────────────────────
function fileIcon(node: VirtualNode): string {
  if (node.type === "folder") return "📁";
  const ext = node.extension || "";
  const map: Record<string, string> = {
    ".ieje": "🟦",
    ".aeea": "🟣",
    ".nz": "🟢",
    ".ck": "🟠",
    ".regs": "🟥",
    ".log": "⬜",
    ".ts": "📘",
    ".tsx": "📘",
    ".js": "📒",
    ".css": "🎨",
    ".html": "🌐",
    ".json": "📋",
    ".md": "📝",
  };
  return map[ext] || "📄";
}

// ── Breadcrumb ────────────────────────────────────────────────────────────
function Breadcrumb({ path, onNavigate }: { path: string; onNavigate: (p: string) => void }) {
  const parts = path.split("/").filter(Boolean);
  return (
    <div className="reber-breadcrumb">
      <span className="reber-breadcrumb-item" onClick={() => onNavigate("/")}>root</span>
      {parts.map((part, i) => {
        const p = "/" + parts.slice(0, i + 1).join("/");
        const isLast = i === parts.length - 1;
        return (
          <span key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="reber-breadcrumb-sep">/</span>
            {isLast ? (
              <span className="reber-breadcrumb-current">{part}</span>
            ) : (
              <span className="reber-breadcrumb-item" onClick={() => onNavigate(p)}>{part}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ── File Content Viewer ───────────────────────────────────────────────────
function FileViewer({ node }: { node: VirtualNode | null }) {
  if (!node) {
    return (
      <div className="reber-empty">
        <div className="reber-empty-icon">👁️</div>
        <div>Pilih file untuk pratinjau</div>
      </div>
    );
  }

  if (node.type === "folder") {
    return (
      <div className="reber-empty">
        <div className="reber-empty-icon">📁</div>
        <div style={{ fontWeight: 600 }}>{node.name}</div>
        <div style={{ fontSize: 12 }}>{node.path}</div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--reber-text-muted)" }}>
          Buka folder untuk melihat isinya
        </div>
      </div>
    );
  }

  const content = node.content || getVirtualFileContent(node.path) || "(file kosong)";
  const lines = content.split("\n");
  const ext = node.extension || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      {/* File header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", flexShrink: 0 }}>
        <span style={{ fontSize: 20 }}>{fileIcon(node)}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--reber-text)" }}>{node.name}</div>
          <div style={{ fontSize: 11, color: "var(--reber-text-muted)" }}>{node.path}</div>
        </div>
        <span
          className={`reber-tag reber-tag-${ext.slice(1)}`}
          style={{ marginLeft: "auto" }}
        >
          {ext}
        </span>
      </div>

      {/* Code viewer */}
      <div className="reber-code-viewer" style={{ flex: 1 }}>
        {lines.map((line, i) => (
          <div key={i} className="reber-code-line">
            <span className="reber-code-num">{i + 1}</span>
            <span>{line || " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Create File/Folder Dialog ─────────────────────────────────────────────
function CreateDialog({
  parentPath,
  onClose,
  onCreate,
}: {
  parentPath: string;
  onClose: () => void;
  onCreate: (name: string, type: "file" | "folder", ext?: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"file" | "folder">("file");
  const [ext, setExt] = useState(".ieje");

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,26,51,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "white", borderRadius: 12, padding: 24, width: 360,
          boxShadow: "0 16px 48px rgba(0,102,204,0.25)",
          border: "1px solid var(--reber-border-light)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "var(--reber-text)" }}>
          {type === "folder" ? "Folder" : "File"} Baru
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--reber-text-secondary)", display: "block", marginBottom: 4 }}>
            Jenis
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["file", "folder"] as const).map((t) => (
              <button
                key={t}
                className={`reber-btn ${type === t ? "reber-btn-primary" : "reber-btn-ghost"}`}
                style={{ flex: 1, fontSize: 13 }}
                onClick={() => setType(t)}
              >
                {t === "folder" ? "📁 Folder" : "📄 File"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--reber-text-secondary)", display: "block", marginBottom: 4 }}>
            Nama
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "folder" ? "nama-folder" : "nama-file"}
            style={{
              width: "100%", padding: "8px 12px", border: "1.5px solid var(--reber-border)",
              borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "monospace",
              background: "var(--reber-bg)",
            }}
            autoFocus
          />
        </div>

        {type === "file" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--reber-text-secondary)", display: "block", marginBottom: 4 }}>
              Ekstensi
            </label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[".ieje", ".aeea", ".nz", ".ck", ".regs", ".log", ".ts", ".js", ".css", ".html", ".json", ".md"].map((e) => (
                <button
                  key={e}
                  className={`reber-tag ${ext === e ? "reber-tag-" + e.slice(1) : ""}`}
                  style={{
                    cursor: "pointer", border: "1px solid var(--reber-border)",
                    background: ext === e ? undefined : "var(--reber-bg)",
                    color: ext === e ? undefined : "var(--reber-text-secondary)",
                    padding: "3px 8px",
                  }}
                  onClick={() => setExt(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: "var(--reber-text-muted)", marginBottom: 16, fontFamily: "monospace", background: "var(--reber-bg)", padding: "6px 10px", borderRadius: 6 }}>
          {parentPath}/{name || "…"}{type === "file" ? ext : ""}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="reber-btn reber-btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Batal
          </button>
          <button
            className="reber-btn reber-btn-primary"
            style={{ flex: 1 }}
            onClick={() => name.trim() && onCreate(name.trim(), type, type === "file" ? ext : undefined)}
          >
            Buat
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Kata Browser Panel ────────────────────────────────────────────────────
function KataBrowser({ onSelectKata }: { onSelectKata: (kata: string, cat: string) => void }) {
  const [activeCategory, setActiveCategory] = useState("en");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ kata: string; category: string }>>([]);
  const PAGE_SIZE = 100;

  const cat = KATA_CATEGORIES.find((c) => c.id === activeCategory);
  const words = searchQuery
    ? []
    : getKataList(activeCategory, page, PAGE_SIZE);
  const totalPages = cat ? Math.ceil(cat.count / PAGE_SIZE) : 0;

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchKata(searchQuery, 50);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const displayWords = searchQuery ? searchResults : words.map((w) => ({ kata: w, category: activeCategory }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Search */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--reber-border-light)", flexShrink: 0 }}>
        <div className="reber-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--reber-text-muted)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="Cari kata... (min. 2 karakter)"
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="reber-tabs">
          {KATA_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`reber-tab ${activeCategory === c.id ? "active" : ""}`}
              onClick={() => { setActiveCategory(c.id); setPage(0); }}
            >
              {c.nameid} <span style={{ opacity: 0.7 }}>({c.count.toLocaleString()})</span>
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="reber-stats">
        {searchQuery ? (
          <span>Ditemukan: <span className="reber-stat-value">{searchResults.length}</span> hasil untuk "{searchQuery}"</span>
        ) : (
          <>
            <span>Kategori: <span className="reber-stat-value">{cat?.nameid}</span></span>
            <span>Total: <span className="reber-stat-value">{cat?.count.toLocaleString()}</span></span>
            <span>Halaman: <span className="reber-stat-value">{page + 1}/{Math.min(totalPages, 9999)}</span></span>
          </>
        )}
      </div>

      {/* Word Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {displayWords.map(({ kata, category }) => (
            <button
              key={kata}
              style={{
                padding: "4px 10px",
                background: "var(--reber-surface)",
                border: "1px solid var(--reber-border-light)",
                borderRadius: 6,
                fontSize: 12,
                color: "var(--reber-text)",
                cursor: "pointer",
                fontFamily: "monospace",
                transition: "all 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = "var(--reber-primary-pale)";
                (e.target as HTMLButtonElement).style.borderColor = "var(--reber-primary)";
                (e.target as HTMLButtonElement).style.color = "var(--reber-primary)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = "var(--reber-surface)";
                (e.target as HTMLButtonElement).style.borderColor = "var(--reber-border-light)";
                (e.target as HTMLButtonElement).style.color = "var(--reber-text)";
              }}
              onClick={() => onSelectKata(kata, category)}
            >
              {kata}
            </button>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {!searchQuery && totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, padding: "8px 16px", borderTop: "1px solid var(--reber-border-light)", justifyContent: "center", flexShrink: 0 }}>
          <button className="reber-btn reber-btn-ghost" style={{ fontSize: 12 }} disabled={page === 0} onClick={() => setPage(0)}>«</button>
          <button className="reber-btn reber-btn-ghost" style={{ fontSize: 12 }} disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>‹</button>
          <span style={{ padding: "8px 12px", fontSize: 12, color: "var(--reber-text-secondary)" }}>
            {page + 1} / {Math.min(totalPages, 9999)}+
          </span>
          <button className="reber-btn reber-btn-ghost" style={{ fontSize: 12 }} disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</button>
          <button className="reber-btn reber-btn-ghost" style={{ fontSize: 12 }} onClick={() => setPage(Math.min(totalPages - 1, 9998))}>»</button>
        </div>
      )}
    </div>
  );
}

// ── Main File Manager ─────────────────────────────────────────────────────
function FileManager() {
  const [currentPath, setCurrentPath] = useState("/allunivers_os");
  const [nodes, setNodes] = useState<VirtualNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<VirtualNode | null>(null);
  const [viewMode, setViewMode] = useState<"files" | "kata">("files");
  const [showCreate, setShowCreate] = useState(false);
  const [customFiles, setCustomFiles] = useState<VirtualNode[]>([]);
  const [editContent, setEditContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const loadPath = useCallback((path: string, pg = 0) => {
    const result = browseVirtualPath(path, pg, PAGE_SIZE);
    setNodes(result.nodes);
    setCurrentPath(path);
    setPage(pg);
    setSelectedNode(null);
  }, []);

  useEffect(() => {
    loadPath("/allunivers_os");
  }, []);

  const handleNavigate = (path: string) => {
    loadPath(path, 0);
  };

  const handleNodeClick = (node: VirtualNode) => {
    if (node.type === "folder") {
      loadPath(node.path);
    } else {
      setSelectedNode(node);
      setIsEditing(false);
      setEditContent(null);
    }
  };

  const handleCreate = (name: string, type: "file" | "folder", ext?: string) => {
    const fullName = type === "file" ? name + (ext || "") : name;
    const newNode: VirtualNode = {
      name: fullName,
      path: `${currentPath}/${fullName}`,
      type,
      extension: ext,
      content: type === "file" ? generateFileContent(fullName, ext || "", currentPath) : undefined,
      modified: new Date().toISOString(),
    };
    setCustomFiles((prev) => [...prev, newNode]);
    setShowCreate(false);
    setSelectedNode(newNode);
  };

  const generateFileContent = (name: string, ext: string, path: string): string => {
    const kata = name.replace(ext, "");
    if (ext === ".ieje") return generateIndexIeje(kata, "custom");
    if (ext === ".aeea") return generateStyleAeea(kata, "custom");
    if (ext === ".nz") return generateFungsiNz(kata, "custom");
    return `# ${name}\n# Path: ${path}/${name}\n# Created: ${new Date().toISOString()}\n`;
  };

  const handleKataSelect = (kata: string, category: string) => {
    const kataPath = `/allunivers_os/kata/${encodeURIComponent(kata)}`;
    loadPath(kataPath);
  };

  const handleSave = () => {
    if (!selectedNode || editContent === null) return;
    const updated = { ...selectedNode, content: editContent };
    setSelectedNode(updated);
    setCustomFiles((prev) => prev.map((f) => f.path === updated.path ? updated : f));
    setIsEditing(false);
  };

  const allNodes = [...nodes, ...customFiles.filter((f) =>
    f.path.startsWith(currentPath + "/") && !f.path.slice(currentPath.length + 1).includes("/")
  )];

  // Sidebar tree
  const dirTree = [
    { path: "/", label: "/ akar", indent: 0 },
    { path: "/allunivers_os", label: "allunivers_os", indent: 1 },
    { path: "/allunivers_os/reber_ai", label: "reber_ai", indent: 2 },
    { path: "/allunivers_os/kata", label: "kata (1.45M+)", indent: 2 },
  ];

  return (
    <div className="reber-layout">
      {/* Directory Tree Sidebar */}
      <aside className="reber-sidebar">
        <div className="reber-sidebar-header">📁 Direktori</div>
        <div className="reber-sidebar-scroll">
          {dirTree.map((item) => (
            <div
              key={item.path}
              className={`reber-tree-item ${currentPath === item.path ? "selected" : ""}`}
              style={{ paddingLeft: 8 + item.indent * 16 }}
              onClick={() => handleNavigate(item.path)}
            >
              <span>{item.indent > 0 ? (currentPath === item.path ? "📂" : "📁") : "🖥️"}</span>
              {item.label}
            </div>
          ))}

          <div className="reber-divider" />
          <div className="reber-sidebar-header">Kategori Kata</div>
          {KATA_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="reber-tree-item"
              style={{ paddingLeft: 24, fontSize: 12 }}
              onClick={() => {
                setViewMode("kata");
              }}
            >
              <span>📚</span>
              <span style={{ flex: 1 }}>{cat.nameid}</span>
              <span style={{ fontSize: 10, color: "var(--reber-text-muted)" }}>{cat.count.toLocaleString()}</span>
            </div>
          ))}

          <div className="reber-divider" />
          <div className="reber-sidebar-header">Referensi</div>
          <div className="reber-tree-item" style={{ fontSize: 12 }}>
            <span>🏛️</span> Perpusnas RI
          </div>
          {OPENSOURCE_REFS.slice(0, 5).map((ref) => (
            <div key={ref} className="reber-tree-item" style={{ fontSize: 11, paddingLeft: 16 }}>
              <span>🔗</span> {ref.replace("https://", "")}
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="reber-main">
        {/* Toolbar */}
        <div className="reber-fm-toolbar">
          <Breadcrumb path={currentPath} onNavigate={handleNavigate} />

          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            <button
              className={`reber-btn reber-btn-ghost`}
              style={{ fontSize: 12, padding: "6px 10px" }}
              onClick={() => setViewMode(viewMode === "files" ? "kata" : "files")}
            >
              {viewMode === "files" ? "📚 Penjelajah Kata" : "📁 Tampilan File"}
            </button>
            <button
              className="reber-btn reber-btn-primary"
              style={{ fontSize: 12, padding: "6px 10px" }}
              onClick={() => setShowCreate(true)}
            >
              + Baru
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="reber-stats">
          <div className="reber-stat">
            <span>Lokasi:</span>
            <span className="reber-stat-value" style={{ fontFamily: "monospace" }}>{currentPath}</span>
          </div>
          <div className="reber-stat">
            <span>Item:</span>
            <span className="reber-stat-value">{allNodes.length}</span>
          </div>
          <div className="reber-stat">
            <span>Total Kata:</span>
            <span className="reber-stat-value">{getTotalKataCount().toLocaleString()}+</span>
          </div>
        </div>

        <div className="reber-panel-row" style={{ flex: 1, overflow: "hidden", gap: 0 }}>
          {/* File/Kata List */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {viewMode === "kata" ? (
              <KataBrowser onSelectKata={handleKataSelect} />
            ) : (
              <div style={{ flex: 1, overflow: "auto" }}>
                {allNodes.length === 0 ? (
                  <div className="reber-empty">
                    <div className="reber-empty-icon">📭</div>
                    <div>Direktori kosong</div>
                    <button className="reber-btn reber-btn-primary" style={{ marginTop: 8 }} onClick={() => setShowCreate(true)}>
                      + Buat File atau Folder
                    </button>
                  </div>
                ) : (
                  <table className="reber-fm-list">
                    <thead>
                      <tr>
                        <th style={{ width: 32 }}></th>
                        <th>Nama</th>
                        <th style={{ width: 80 }}>Jenis</th>
                        <th style={{ width: 80 }}>Ext</th>
                        <th style={{ width: 120 }}>Diubah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allNodes.map((node) => (
                        <tr
                          key={node.path}
                          className={selectedNode?.path === node.path ? "selected" : ""}
                          onClick={() => handleNodeClick(node)}
                        >
                          <td style={{ textAlign: "center", fontSize: 16 }}>{fileIcon(node)}</td>
                          <td style={{ fontFamily: "monospace", fontWeight: 500 }}>{node.name}</td>
                          <td style={{ fontSize: 11 }}>{node.type === "folder" ? "folder" : "file"}</td>
                          <td>
                            {node.extension && (
                              <span className={`reber-tag reber-tag-${node.extension.slice(1)}`}>
                                {node.extension}
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: 11, fontFamily: "monospace" }}>
                            {node.modified ? new Date(node.modified).toLocaleDateString("id-ID") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div style={{
            width: 360, borderLeft: "1px solid var(--reber-border-light)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            background: "var(--reber-surface)",
          }}>
            <div className="reber-panel-header">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Pratinjau
              {selectedNode?.type === "file" && (
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                  {isEditing ? (
                    <>
                      <button className="reber-btn reber-btn-primary" style={{ fontSize: 11, padding: "3px 8px" }} onClick={handleSave}>Simpan</button>
                      <button className="reber-btn reber-btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => setIsEditing(false)}>Batal</button>
                    </>
                  ) : (
                    <button className="reber-btn reber-btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }}
                      onClick={() => { setIsEditing(true); setEditContent(selectedNode.content || getVirtualFileContent(selectedNode.path) || ""); }}>
                      Ubah
                    </button>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
              {isEditing && selectedNode ? (
                <textarea
                  value={editContent || ""}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    width: "100%", height: "100%", border: "1.5px solid var(--reber-primary)",
                    borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 12,
                    background: "var(--reber-bg)", color: "var(--reber-text)",
                    resize: "none", outline: "none", lineHeight: 1.6,
                  }}
                />
              ) : (
                <FileViewer node={selectedNode} />
              )}
            </div>
          </div>
        </div>
      </main>

      {showCreate && (
        <CreateDialog
          parentPath={currentPath}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

export const Route = createFileRoute("/manager")({
  component: FileManager,
});
