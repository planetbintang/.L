import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  Bell,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  File,
  FileCode2,
  FileText,
  Film,
  Folder,
  FolderOpen,
  FolderPlus,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Move,
  Orbit,
  Pencil,
  PlaySquare,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Star,
  Trash2,
  UploadCloud,
  Users,
  Video,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";

const STORAGE_LIMIT = 500 * 1024 * 1024 * 1024;

type UploadState = { name: string; progress: number; status: "uploading" | "done" | "error"; message?: string };

type MenuKind = "all-files" | "photos" | "videos" | "movies" | "shared" | "favorites" | "documents";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function initials(name?: string | null) {
  return (name || "P").split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function fileIcon(mime: string, category: string) {
  if (category === "photo" || mime.startsWith("image/")) return <ImageIcon size={20} />;
  if (category === "video" || mime.startsWith("video/")) return <Video size={20} />;
  if (category === "movie") return <Film size={20} />;
  if (mime.includes("javascript") || mime.includes("typescript") || mime.includes("json")) return <FileCode2 size={20} />;
  if (mime.includes("pdf") || mime.startsWith("text/")) return <FileText size={20} />;
  return <File size={20} />;
}

function folderIcon(kind: string) {
  if (kind === "photos") return <ImageIcon size={22} />;
  if (kind === "videos") return <Video size={22} />;
  if (kind === "movies") return <Film size={22} />;
  if (kind === "documents") return <FileText size={22} />;
  if (kind === "shared") return <Share2 size={22} />;
  if (kind === "favorites") return <Star size={22} />;
  return <Folder size={22} />;
}

export default function GalleryDashboard() {
  const { user, loading, logout } = useAuth();
  const [parentId, setParentId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const dashboardQuery = trpc.dashboard.get.useQuery({ parentId, search }, { enabled: Boolean(user) });
  const createFolderMutation = trpc.files.createFolder.useMutation({ onSuccess: refresh });
  const renameFolderMutation = trpc.files.renameFolder.useMutation({ onSuccess: refresh });
  const moveFolderMutation = trpc.files.moveFolder.useMutation({ onSuccess: refresh });
  const copyFolderMutation = trpc.files.copyFolder.useMutation({ onSuccess: refresh });
  const deleteFolderMutation = trpc.files.deleteFolder.useMutation({ onSuccess: refresh });
  const renameFileMutation = trpc.files.renameFile.useMutation({ onSuccess: refresh });
  const moveFileMutation = trpc.files.moveFile.useMutation({ onSuccess: refresh });
  const copyFileMutation = trpc.files.copyFile.useMutation({ onSuccess: refresh });
  const deleteFileMutation = trpc.files.deleteFile.useMutation({ onSuccess: refresh });
  const favoriteMutation = trpc.files.toggleFavorite.useMutation({ onSuccess: refresh });
  const downloadMutation = trpc.files.download.useMutation();
  const shareMutation = trpc.shares.create.useMutation({ onSuccess: refresh });
  const createUploadMutation = trpc.files.createUpload.useMutation();
  const registerUploadMutation = trpc.files.registerUpload.useMutation({ onSuccess: refresh });

  function refresh() {
    void utils.dashboard.get.invalidate();
  }

  const data = dashboardQuery.data;
  const storagePercent = Math.min(100, ((data?.stats.usedBytes ?? 0) / STORAGE_LIMIT) * 100);
  const categoryColors: Record<string, string> = { movie: "#123a78", video: "#2d74c4", photo: "#63a3dc", document: "#b8d7f0", other: "#d6e6f4" };
  const currentTitle = parentId ? data?.currentFolder?.name || "Folder" : "Dashboard";

  async function uploadOne(file: File) {
    const index = Date.now() + Math.random();
    setUploads(current => [...current, { name: file.name, progress: 1, status: "uploading" }]);
    try {
      const target = await createUploadMutation.mutateAsync({ name: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, folderId: parentId });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", target.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = event => {
          if (!event.lengthComputable) return;
          const progress = Math.max(2, Math.round((event.loaded / event.total) * 96));
          setUploads(current => current.map(item => item.name === file.name && item.status === "uploading" ? { ...item, progress } : item));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload gagal (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Koneksi upload terputus"));
        xhr.send(file);
      });
      await registerUploadMutation.mutateAsync({ storageKey: target.key, stableUrl: target.url, originalName: target.originalName, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, folderId: parentId });
      setUploads(current => current.map(item => item.name === file.name && item.status === "uploading" ? { ...item, progress: 100, status: "done" } : item));
    } catch (error) {
      setUploads(current => current.map(item => item.name === file.name && item.status === "uploading" ? { ...item, status: "error", message: error instanceof Error ? error.message : "Upload gagal" } : item));
    } finally {
      void index;
    }
  }

  function handleFiles(files: FileList | File[]) {
    setShowUpload(true);
    for (const file of Array.from(files)) void uploadOne(file);
  }

  function promptCreateFolder() {
    const name = window.prompt("Nama folder baru");
    if (name?.trim()) createFolderMutation.mutate({ name: name.trim(), parentId });
  }

  function promptRenameFolder(folderId: number, currentName: string) {
    const name = window.prompt("Nama folder", currentName);
    if (name?.trim() && name.trim() !== currentName) renameFolderMutation.mutate({ folderId, name: name.trim() });
  }

  function promptRenameFile(fileId: number, currentName: string) {
    const name = window.prompt("Nama file", currentName);
    if (name?.trim() && name.trim() !== currentName) renameFileMutation.mutate({ fileId, originalName: name.trim() });
  }

  function promptFolderAction(folderId: number, currentName: string, kind: string) {
    if (kind !== "custom") return;
    const action = window.prompt("Aksi folder: rename, copy, move, atau delete", "rename")?.trim().toLowerCase();
    if (action === "rename") promptRenameFolder(folderId, currentName);
    if (action === "copy") copyFolderMutation.mutate({ folderId, parentId });
    if (action === "move") {
      const value = window.prompt(`ID folder tujuan untuk “${currentName}”. Kosongkan untuk root.`);
      const target = value?.trim() ? Number(value) : null;
      if (value !== null && (target === null || Number.isNaN(target))) return;
      moveFolderMutation.mutate({ folderId, parentId: target });
    }
    if (action === "delete" && window.confirm(`Hapus folder ${currentName} beserta indeks file di dalamnya?`)) deleteFolderMutation.mutate({ folderId });
  }

  function promptMoveFile(fileId: number, currentName: string) {
    const value = window.prompt(`ID folder tujuan untuk “${currentName}”. Kosongkan untuk root.`);
    const folderId = value?.trim() ? Number(value) : null;
    if (value !== null && (folderId === null || Number.isNaN(folderId))) return;
    moveFileMutation.mutate({ fileId, folderId });
  }

  function promptShareFile(fileId: number, currentName: string) {
    const email = window.prompt(`Email penerima untuk “${currentName}”`);
    if (email?.trim()) shareMutation.mutate({ fileId, sharedWithEmail: email.trim(), permission: "viewer" });
  }

  if (loading) return <div className="pb-auth-loading"><div className="pb-spinner" /> Memuat sesi PlanetBintang…</div>;
  if (!user) {
    return <div className="pb-auth-gate"><div className="pb-auth-mark"><Orbit size={30} /></div><p className="pb-eyebrow">GALERI / DASHBOARD</p><h1>Dashboard tersedia setelah login.</h1><p>Daftar atau masuk dengan akun PlanetBintang untuk membuka file manager pribadi dan menyimpan objek media serta dokumen Anda.</p><button className="pb-button pb-button-primary pb-button-large" onClick={() => startLogin()}>Masuk / Daftar <ArrowRightIcon /></button><Link href="/" className="pb-text-link">Kembali ke beranda</Link></div>;
  }

  return (
    <div className="pb-dashboard-shell">
      <aside className={`pb-sidebar ${mobileNav ? "is-open" : ""}`}>
        <div className="pb-sidebar-brand"><Link href="/" className="pb-brand"><span className="pb-brand-mark"><Orbit size={20} /></span><span>PlanetBintang</span></Link><button className="pb-icon-button pb-mobile-close" onClick={() => setMobileNav(false)} aria-label="Tutup menu"><X size={18} /></button></div>
        <div className="pb-sidebar-scroll">
          <p className="pb-side-label">WORKSPACE</p>
          <Link href="/galeri/dashboard" className="pb-side-item active"><LayoutDashboard size={18} /><span>Dashboard</span></Link>
          <p className="pb-side-label side-label-spaced">GALERI</p>
          {data?.menuFolders.map(folder => <button key={folder.id} className={`pb-side-item ${parentId === folder.id ? "active" : ""}`} onClick={() => { setParentId(folder.id); setSearch(""); setMobileNav(false); }}>{folderIcon(folder.kind)}<span>{folder.name}</span>{folder.kind === "all-files" && <span className="pb-side-count">{data.stats.fileCount}</span>}</button>)}
          <p className="pb-side-label side-label-spaced">AKUN</p>
          <button className="pb-side-item"><ShieldCheck size={18} /><span>Keamanan</span></button>
          <button className="pb-side-item"><Users size={18} /><span>Kolaborasi</span></button>
        </div>
        <div className="pb-sidebar-user"><div className="pb-avatar">{initials(user.name)}</div><div className="pb-user-copy"><strong>{user.name || "Profil PlanetBintang"}</strong><small>{user.email || "Akun terhubung"}</small></div><button className="pb-icon-button" onClick={() => void logout()} aria-label="Keluar"><LogOut size={16} /></button></div>
      </aside>

      <main className="pb-dashboard-main">
        <header className="pb-dashboard-topbar"><div className="pb-topbar-left"><button className="pb-icon-button pb-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Buka menu"><Menu size={20} /></button><div className="pb-breadcrumb"><span>GALERI</span><ChevronRight size={14} /><strong>{currentTitle}</strong></div></div><div className="pb-search"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari file, folder, dokumen…" /><kbd>⌘ K</kbd></div><div className="pb-topbar-actions"><button className="pb-icon-button has-dot" aria-label="Notifikasi"><Bell size={19} /></button><div className="pb-top-profile"><div className="pb-avatar small">{initials(user.name)}</div><div><strong>{user.name || "Profil"}</strong><span><i /> Premium</span></div><ChevronDown size={16} /></div></div></header>

        <div className="pb-dashboard-content">
          <div className="pb-page-heading"><div><p className="pb-eyebrow">RUANG KERJA / PRIVATE</p><h1>Dashboard</h1><p className="pb-muted">Pusat file PlanetBintang untuk media, dokumen, dan kode Anda.</p></div><div className="pb-heading-actions"><button className="pb-button pb-button-secondary" onClick={promptCreateFolder}><FolderPlus size={17} /> Folder baru</button><button className="pb-button pb-button-primary" onClick={() => { setShowUpload(true); inputRef.current?.click(); }}><UploadCloud size={17} /> Unggah</button></div></div>

          <section className="pb-overview-grid">
            <div className="pb-card pb-profile-card"><div className="pb-card-header"><span className="pb-card-kicker">PROFILE SUMMARY</span><MoreHorizontal size={19} /></div><div className="pb-profile-main"><div className="pb-avatar large">{initials(user.name)}</div><div><h2>Selamat datang, {user.name?.split(" ")[0] || "Profil"}.</h2><p className="pb-muted">Ruang kerja Anda siap dipakai.</p></div></div><div className="pb-profile-progress"><div><span>Profile completion</span><strong>92%</strong></div><div className="pb-progress-track"><span style={{ width: "92%" }} /></div></div></div>
            <div className="pb-card pb-storage-card"><div className="pb-card-header"><span className="pb-card-kicker">CLOUD STORAGE BREAKDOWN</span><strong>{formatBytes(data?.stats.usedBytes ?? 0)} <em>/ 500 GB</em></strong></div><div className="pb-storage-bar"><span style={{ width: `${storagePercent}%` }} /></div><div className="pb-storage-legend">{(data?.stats.categories.length ? data.stats.categories : [{ category: "document", bytes: 0 }, { category: "photo", bytes: 0 }, { category: "video", bytes: 0 }]).slice(0, 4).map(item => <span key={item.category}><i style={{ background: categoryColors[item.category] || "#aac7df" }} />{item.category === "movie" ? "Movies" : item.category === "video" ? "Videos" : item.category === "photo" ? "Photos" : "Documents"} <b>{formatBytes(item.bytes)}</b></span>)}</div><div className="pb-storage-foot"><span>{data?.stats.fileCount ?? 0} file aktif</span><span>{data?.stats.folderCount ?? 0} folder terindeks</span></div></div>
            <div className="pb-card pb-upload-card" onDragOver={event => { event.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={event => { event.preventDefault(); setDragActive(false); handleFiles(event.dataTransfer.files); }}><div className={`pb-upload-drop ${dragActive ? "is-dragging" : ""}`}><div className="pb-upload-plus"><Plus size={24} /></div><strong>Quick Upload</strong><span>Tarik file ke sini atau klik untuk memilih</span><button className="pb-upload-action" onClick={() => { setShowUpload(true); inputRef.current?.click(); }}><UploadCloud size={16} /> Pilih file</button></div><input ref={inputRef} type="file" multiple hidden onChange={event => { if (event.target.files) handleFiles(event.target.files); event.currentTarget.value = ""; }} /></div>
          </section>

          {showUpload && uploads.length > 0 && <section className="pb-upload-status pb-card"><div className="pb-section-heading"><div><span className="pb-card-kicker">UPLOAD QUEUE</span><h2>Transfer ke object storage</h2></div><button className="pb-icon-button" onClick={() => setUploads([])} aria-label="Tutup upload queue"><X size={17} /></button></div>{uploads.slice(-4).map((item, index) => <div className="pb-upload-row" key={`${item.name}-${index}`}><div className="pb-file-icon document">{item.status === "done" ? <ShieldCheck size={19} /> : <UploadCloud size={19} />}</div><div className="pb-upload-row-copy"><strong>{item.name}</strong><small>{item.status === "error" ? item.message : item.status === "done" ? "Tersimpan aman di object storage" : "Mengirim langsung ke storage…"}</small><div className="pb-progress-track"><span className={item.status === "error" ? "error" : ""} style={{ width: `${item.progress}%` }} /></div></div><b>{item.status === "error" ? "Gagal" : `${item.progress}%`}</b></div>)}</section>}

            <section className="pb-card pb-recent-card"><div className="pb-section-heading"><div><span className="pb-card-kicker">RECENT MEDIA &amp; FOLDERS</span><h2>File terbaru</h2></div><button className="pb-link-button" onClick={() => { setParentId(null); setSearch(""); }}>Lihat semua <ChevronRight size={16} /></button></div><div className="pb-recent-grid">{data?.recentFolders.slice(0, 3).map(folder => <button className="pb-folder-card" key={folder.id} onClick={() => setParentId(folder.id)}><span className="pb-folder-illustration">{folderIcon(folder.kind)}</span><span><strong>{folder.name}</strong><small>Folder · ID {folder.id}</small></span><MoreHorizontal size={17} /></button>)}{data?.recentFiles.slice(0, 3).map(file => <div className="pb-media-card" key={file.id}><div className={`pb-file-icon ${file.category}`}>{fileIcon(file.mimeType, file.category)}</div><div className="pb-media-copy"><strong>{file.originalName}</strong><small>{file.category} · {formatBytes(file.sizeBytes)}</small><span>{formatDate(file.updatedAt)}</span></div><button className="pb-icon-button" onClick={() => promptRenameFile(file.id, file.originalName)} aria-label={`Aksi ${file.originalName}`}><MoreHorizontal size={17} /></button></div>)}{!data?.recentFolders.length && !data?.recentFiles.length && <div className="pb-empty">Belum ada file. Unggah dokumen pertama Anda.</div>}</div></section>

          <section className="pb-lower-grid"><div className="pb-card pb-items-card"><div className="pb-section-heading"><div><span className="pb-card-kicker">CURRENT LOCATION</span><h2>{parentId ? currentTitle : "Menu GALERI"}</h2></div><div className="pb-inline-actions"><button className="pb-icon-button" onClick={promptCreateFolder} aria-label="Buat folder"><FolderPlus size={17} /></button><button className="pb-icon-button" onClick={() => { setShowUpload(true); inputRef.current?.click(); }} aria-label="Unggah"><UploadCloud size={17} /></button></div></div><div className="pb-item-list">{data?.folders.map(folder => <div className="pb-item-row" key={`folder-${folder.id}`}><button className="pb-item-main" onClick={() => setParentId(folder.id)}><span className="pb-file-icon folder">{folderIcon(folder.kind)}</span><span><strong>{folder.name}</strong><small>Folder · ID {folder.id}</small></span></button><span className="pb-item-meta">Folder</span><button className="pb-icon-button" onClick={() => promptFolderAction(folder.id, folder.name, folder.kind)} aria-label={`Aksi folder ${folder.name}`}><MoreHorizontal size={17} /></button></div>)}{data?.files.map(file => <div className="pb-item-row" key={`file-${file.id}`}><div className="pb-item-main"><span className={`pb-file-icon ${file.category}`}>{fileIcon(file.mimeType, file.category)}</span><span><strong>{file.originalName}</strong><small>{file.mimeType} · {formatBytes(file.sizeBytes)}</small></span></div><span className="pb-item-meta">{formatDate(file.updatedAt)}</span><div className="pb-item-actions"><button className="pb-icon-button" onClick={() => favoriteMutation.mutate({ fileId: file.id })} aria-label="Favorit"><Star size={16} fill={file.isFavorite ? "currentColor" : "none"} /></button><button className="pb-icon-button" onClick={() => void downloadMutation.mutateAsync({ fileId: file.id }).then(result => { window.open(result.url, "_blank", "noopener,noreferrer"); })} aria-label="Unduh"><Download size={16} /></button><div className="pb-action-menu"><button className="pb-icon-button" onClick={() => promptRenameFile(file.id, file.originalName)} aria-label="Edit file"><MoreHorizontal size={17} /></button><div className="pb-action-popover"><button onClick={() => promptRenameFile(file.id, file.originalName)}><Pencil size={14} /> Ganti nama</button><button onClick={() => promptMoveFile(file.id, file.originalName)}><Move size={14} /> Pindahkan</button><button onClick={() => promptShareFile(file.id, file.originalName)}><Share2 size={14} /> Bagikan</button><button onClick={() => copyFileMutation.mutate({ fileId: file.id, folderId: parentId })}><Copy size={14} /> Salin</button><button className="danger" onClick={() => { if (window.confirm(`Hapus ${file.originalName}?`)) deleteFileMutation.mutate({ fileId: file.id }); }}><Trash2 size={14} /> Hapus</button></div></div></div></div>)}{!data?.folders.length && !data?.files.length && <div className="pb-empty"><Archive size={26} /><strong>Folder ini masih kosong</strong><span>Unggah file atau buat folder baru untuk memulai.</span></div>}</div></div>
            <div className="pb-side-panels"><div className="pb-card pb-shared-card"><div className="pb-section-heading"><div><span className="pb-card-kicker">SHARED WITH ME</span><h2>Shared Items</h2></div><Share2 size={18} /></div>{data?.shares.length ? data.shares.map(item => <div className="pb-share-row" key={item.share.id}><div className="pb-avatar tiny">{initials(item.share.sharedWithEmail)}</div><div><strong>{item.file?.originalName || item.folder?.name || "Item shared"}</strong><small>ke {item.share.sharedWithEmail}</small></div><span>{item.share.permission}</span></div>) : <div className="pb-compact-empty">Belum ada item yang dibagikan.</div>}</div><div className="pb-card pb-collab-card"><div className="pb-section-heading"><div><span className="pb-card-kicker">COLLABORATION HUB</span><h2>Aktivitas</h2></div><Users size={18} /></div>{data?.activities.length ? data.activities.slice(0, 3).map(activity => <div className="pb-activity-row" key={activity.id}><span className="pb-activity-dot" /><div><strong>{activity.action}</strong><small>{activity.targetName} · {formatDate(activity.createdAt)}</small></div></div>) : <div className="pb-compact-empty">Aktivitas kolaborasi akan muncul di sini.</div>}</div></div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ArrowRightIcon() { return <ChevronRight size={18} />; }
