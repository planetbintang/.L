import { HeadContent, Scripts, createRootRoute, Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import "../styles.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI Reber — AlluniverS_OS" },
      { name: "description", content: "Re:Bersama — Sistem Manajemen AI yang dibangun di atas AlluniverS_OS." },
    ],
  }),
  shellComponent: RootDocument,
});

function Header() {
  const location = useLocation();
  const isStudio = location.pathname === "/" || location.pathname === "/studio";
  const isManager = location.pathname === "/manager";
  const isProjects = location.pathname === "/projects";

  return (
    <header className="reber-header">
      <div className="reber-logo">
        <div className="reber-logo-icon">Re</div>
        <span>AI REBER</span>
      </div>

      <nav className="reber-nav">
        <Link to="/" className={`reber-nav-btn ${isStudio ? "active" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9l6 6M15 9l-6 6" />
          </svg>
          AI Studio
        </Link>
        <Link to="/manager" className={`reber-nav-btn ${isManager ? "active" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          Pengelola File
        </Link>
        <Link to="/projects" className={`reber-nav-btn ${isProjects ? "active" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          Proyek
        </Link>
      </nav>

      <div className="reber-header-right">
        <span className="reber-badge">⚡ AlluniverS_OS</span>
        <span className="reber-badge">v1.0.0</span>
        <span className="reber-badge">
          <span className="reber-status-dot" style={{ marginRight: 4 }} />
          Daring
        </span>
      </div>
    </header>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        <Header />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
