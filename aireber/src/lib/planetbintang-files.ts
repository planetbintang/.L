// Adapter ke File Manager Planetbintang (.L).
// Memakai storage key dan event yang sama dengan system-tools.js.

const WORKSPACE_KEY = "planetbintang.file-manager.workspace.v1";

export interface PlanetbintangWorkspaceFile {
  id: string;
  name: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

function readFiles(): PlanetbintangWorkspaceFile[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(WORKSPACE_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item.name === "string")
      .map((item) => ({
        ...item,
        id: String(item.id || `file-${item.name}`),
        name: String(item.name).replaceAll("/", "-"),
        content: String(item.content ?? ""),
      }));
  } catch {
    return [];
  }
}

function writeFiles(files: PlanetbintangWorkspaceFile[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(files));
    const event = new CustomEvent("planetbintang:workspace-files-changed");
    window.dispatchEvent(event);
    document.dispatchEvent(event);
    return true;
  } catch {
    return false;
  }
}

export function getPlanetbintangWorkspaceFiles(): PlanetbintangWorkspaceFile[] {
  return readFiles();
}

export function getPlanetbintangWorkspaceContext(maxChars = 12000): string {
  const files = readFiles();
  if (!files.length) return "FILE MANAGER WORKSPACE: kosong (belum ada file di /workspace).";

  let used = 0;
  const entries: string[] = [];
  for (const file of files) {
    const header = `\n--- /workspace/${file.name} (${file.content.length} karakter) ---\n`;
    const remaining = Math.max(0, maxChars - used - header.length);
    if (!remaining) break;
    const content = file.content.slice(0, remaining);
    entries.push(`${header}${content}${content.length < file.content.length ? "\n[isi dipotong]" : ""}`);
    used += header.length + content.length;
  }
  return `FILE MANAGER WORKSPACE: ${files.length} file tersimpan di /workspace.${entries.join("")}`;
}

function normalizeName(input: string): string {
  return input.trim().replace(/^\/workspace\//, "").replace(/^\//, "").replaceAll("/", "-").slice(0, 120);
}

export function executePlanetbintangFileCommand(input: string): string | null {
  const text = input.trim();
  const lower = text.toLocaleLowerCase("id-ID");
  const files = readFiles();

  if (/^(daftar|list)(\s+file|\s+workspace)?$/.test(lower) || lower === "kelola file") {
    return files.length
      ? `File Manager /workspace berisi ${files.length} file:\n${files.map((file) => `- ${file.name} (${file.content.length} karakter)`).join("\n")}`
      : "File Manager /workspace masih kosong.";
  }

  const readMatch = text.match(/^(?:baca|read)(?:\s+file)?\s+(.+)$/i);
  if (readMatch) {
    const name = normalizeName(readMatch[1]);
    const file = files.find((entry) => entry.name === name);
    return file
      ? `Isi /workspace/${file.name}:\n\n${file.content || "(file kosong)"}`
      : `File /workspace/${name} tidak ditemukan di File Manager.`;
  }

  const deleteMatch = text.match(/^(?:hapus|delete)(?:\s+file)?\s+(.+)$/i);
  if (deleteMatch) {
    const name = normalizeName(deleteMatch[1]);
    const next = files.filter((file) => file.name !== name);
    if (next.length === files.length) return `File /workspace/${name} tidak ditemukan.`;
    writeFiles(next);
    return `File /workspace/${name} dihapus dari File Manager.`;
  }

  const writeMatch = text.match(/^(?:buat|tulis|simpan)(?:\s+file)?\s+([^\n:]+)(?::|\n)([\s\S]*)$/i);
  if (writeMatch) {
    const name = normalizeName(writeMatch[1]);
    if (!name) return "Nama file tidak boleh kosong.";
    const now = new Date().toISOString();
    const existing = files.find((file) => file.name === name);
    const nextFile: PlanetbintangWorkspaceFile = {
      id: existing?.id || `file-${Date.now().toString(36)}`,
      name,
      content: writeMatch[2],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    writeFiles(existing ? files.map((file) => file.name === name ? nextFile : file) : [nextFile, ...files]);
    return `File /workspace/${name} ${existing ? "diperbarui" : "disimpan"} melalui File Manager.`;
  }

  return null;
}

export function attachPlanetbintangWorkspaceContext(message: string): string {
  return `${message}\n\n[Konten workspace File Manager Planetbintang — gunakan hanya sebagai konteks file yang tersedia]\n${getPlanetbintangWorkspaceContext()}`;
}
