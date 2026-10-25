// Virtual filesystem utilities for AlluniverS_OS
import {
  generateIndexIeje,
  generateStyleAeea,
  generateFungsiNz,
  generateComponentCk,
  generateRegistryRegs,
  generateSystemLog,
  KATA_CATEGORIES,
  searchKata,
  getKataList,
  getTotalKataCount,
} from "./kata-data.js";

export interface VirtualNode {
  name: string;
  path: string;
  type: "file" | "folder";
  extension?: string;
  content?: string;
  size?: number;
  modified?: string;
  children?: VirtualNode[];
}

export interface FSBrowseResult {
  path: string;
  nodes: VirtualNode[];
  total: number;
  page: number;
  pageSize: number;
}

// Root virtual filesystem structure
export const VIRTUAL_ROOTS: VirtualNode[] = [
  {
    name: "allunivers_os",
    path: "/allunivers_os",
    type: "folder",
    children: [
      {
        name: "reber_ai",
        path: "/allunivers_os/reber_ai",
        type: "folder",
      },
      {
        name: "kata",
        path: "/allunivers_os/kata",
        type: "folder",
      },
    ],
  },
];

// Generate kata folder virtual node
export function buildKataNode(kata: string, category: string): VirtualNode {
  const encoded = encodeURIComponent(kata);
  const basePath = `/allunivers_os/kata/${encoded}`;
  return {
    name: kata,
    path: basePath,
    type: "folder",
    children: [
      {
        name: "index.ieje",
        path: `${basePath}/index.ieje`,
        type: "file",
        extension: ".ieje",
        content: generateIndexIeje(kata, category),
        modified: new Date().toISOString(),
      },
      {
        name: "style.aeea",
        path: `${basePath}/style.aeea`,
        type: "file",
        extension: ".aeea",
        content: generateStyleAeea(kata, category),
        modified: new Date().toISOString(),
      },
      {
        name: "fungsi.nz",
        path: `${basePath}/fungsi.nz`,
        type: "file",
        extension: ".nz",
        content: generateFungsiNz(kata, category),
        modified: new Date().toISOString(),
      },
      {
        name: "component.ck",
        path: `${basePath}/component.ck`,
        type: "file",
        extension: ".ck",
        content: generateComponentCk(kata, category),
        modified: new Date().toISOString(),
      },
      {
        name: "registry.regs",
        path: `${basePath}/registry.regs`,
        type: "file",
        extension: ".regs",
        content: generateRegistryRegs(kata, category),
        modified: new Date().toISOString(),
      },
      {
        name: "activity.log",
        path: `${basePath}/activity.log`,
        type: "file",
        extension: ".log",
        content: generateSystemLog(kata, category),
        modified: new Date().toISOString(),
      },
    ],
  };
}

// Browse a path in the virtual filesystem
export function browseVirtualPath(
  path: string,
  page = 0,
  pageSize = 50
): FSBrowseResult {
  // Root
  if (path === "/" || path === "") {
    return {
      path: "/",
      nodes: VIRTUAL_ROOTS,
      total: VIRTUAL_ROOTS.length,
      page: 0,
      pageSize,
    };
  }

  // /allunivers_os
  if (path === "/allunivers_os") {
    return {
      path,
      nodes: VIRTUAL_ROOTS[0].children || [],
      total: 2,
      page: 0,
      pageSize,
    };
  }

  // /allunivers_os/reber_ai
  if (path === "/allunivers_os/reber_ai") {
    const node = buildKataNode("reber_ai", "system");
    const nodes = (node.children || []).map((c) => ({
      ...c,
      path: c.path.replace(
        `/allunivers_os/kata/${encodeURIComponent("reber_ai")}`,
        "/allunivers_os/reber_ai"
      ),
    }));
    return {
      path,
      nodes,
      total: nodes.length,
      page: 0,
      pageSize,
    };
  }

  // /allunivers_os/kata
  if (path === "/allunivers_os/kata") {
    const allEntries: Array<{ kata: string; category: string }> = [];
    for (const cat of KATA_CATEGORIES) {
      const words = getKataList(cat.id, page, Math.ceil(pageSize / KATA_CATEGORIES.length));
      for (const w of words) {
        allEntries.push({ kata: w, category: cat.id });
      }
    }
    const paginated = allEntries.slice(0, pageSize);
    const nodes = paginated.map((e) => ({
      name: e.kata,
      path: `/allunivers_os/kata/${encodeURIComponent(e.kata)}`,
      type: "folder" as const,
    }));
    return {
      path,
      nodes,
      total: getTotalKataCount(),
      page,
      pageSize,
    };
  }

  // /allunivers_os/kata/[word]
  const kataMatch = path.match(/^\/allunivers_os\/kata\/(.+)$/);
  if (kataMatch) {
    const kata = decodeURIComponent(kataMatch[1]);
    const node = buildKataNode(kata, "mixed");
    return {
      path,
      nodes: node.children || [],
      total: (node.children || []).length,
      page: 0,
      pageSize,
    };
  }

  return { path, nodes: [], total: 0, page: 0, pageSize };
}

// Get file content from virtual filesystem
export function getVirtualFileContent(path: string): string | null {
  // reber_ai files
  if (path === "/allunivers_os/reber_ai/index.ieje") {
    return generateIndexIeje("reber_ai", "system");
  }
  if (path === "/allunivers_os/reber_ai/style.aeea") {
    return generateStyleAeea("reber_ai", "system");
  }
  if (path === "/allunivers_os/reber_ai/fungsi.nz") {
    return generateFungsiNz("reber_ai", "system");
  }
  if (path === "/allunivers_os/reber_ai/component.ck") {
    return generateComponentCk("reber_ai", "system");
  }
  if (path === "/allunivers_os/reber_ai/registry.regs") {
    return generateRegistryRegs("reber_ai", "system");
  }
  if (path === "/allunivers_os/reber_ai/activity.log") {
    return generateSystemLog("reber_ai", "system");
  }

  // kata files
  const kataFileMatch = path.match(
    /^\/allunivers_os\/kata\/([^/]+)\/(index\.ieje|style\.aeea|fungsi\.nz|component\.ck|registry\.regs|activity\.log)$/
  );
  if (kataFileMatch) {
    const kata = decodeURIComponent(kataFileMatch[1]);
    const file = kataFileMatch[2];
    if (file === "index.ieje") return generateIndexIeje(kata, "kata");
    if (file === "style.aeea") return generateStyleAeea(kata, "kata");
    if (file === "fungsi.nz") return generateFungsiNz(kata, "kata");
    if (file === "component.ck") return generateComponentCk(kata, "kata");
    if (file === "registry.regs") return generateRegistryRegs(kata, "kata");
    if (file === "activity.log") return generateSystemLog(kata, "kata");
  }

  return null;
}

// Format file size
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Get file extension color
export function extColor(ext: string): string {
  const map: Record<string, string> = {
    ".ieje": "#0066CC",
    ".aeea": "#4DA3FF",
    ".nz": "#006633",
    ".ck": "#CC6600",
    ".regs": "#660066",
    ".log": "#666666",
    ".ts": "#3178C6",
    ".tsx": "#3178C6",
    ".js": "#F7DF1E",
    ".css": "#1572B6",
    ".html": "#E34F26",
    ".json": "#FFBD2E",
    ".md": "#083FA1",
  };
  return map[ext] || "#333333";
}
