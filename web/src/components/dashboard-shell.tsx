"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  IconHome, IconBook, IconTimer, IconActivity, IconDumbbell,
  IconLeaf, IconUsers, IconBarChart, IconUser, IconLogOut, IconMenu, IconX,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Accueil", icon: <IconHome size={16} /> },
  { href: "/journal", label: "Journal alimentaire", icon: <IconBook size={16} /> },
  { href: "/sessions", label: "Sessions sport", icon: <IconTimer size={16} /> },
  { href: "/mesures", label: "Mesures", icon: <IconActivity size={16} /> },
  { href: "/exercices", label: "Exercices", icon: <IconDumbbell size={16} /> },
  { href: "/aliments", label: "Aliments", icon: <IconLeaf size={16} /> },
  { href: "/ia", label: "Recommandations IA", icon: <IconBarChart size={16} /> },
  { href: "/utilisateurs", label: "Utilisateurs", icon: <IconUsers size={16} />, adminOnly: true },
  { href: "/analytics", label: "Analytics", icon: <IconBarChart size={16} />, adminOnly: true },
  { href: "/profil", label: "Mon profil", icon: <IconUser size={16} /> },
];

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
      )}
    >
      <span className={cn("shrink-0", active ? "text-blue-400" : "text-slate-500")}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const router = useRouter();
  const isAdmin = profile?.app_role === "admin";

  const visibleItems = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = [profile?.prenom, profile?.nom]
    .filter(Boolean)
    .map((s) => (s as string)[0])
    .join("")
    .toUpperCase() || profile?.email?.slice(0, 2).toUpperCase() || "?";

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <IconActivity size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">HealthAI Coach</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Fermer le menu"
          >
            <IconX size={16} aria-hidden />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Navigation principale">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-xs font-semibold text-blue-400">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">
              {[profile?.prenom, profile?.nom].filter(Boolean).join(" ") || "Utilisateur"}
            </p>
            <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          aria-label="Se déconnecter"
        >
          <IconLogOut size={14} aria-hidden />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Focus trap : confine le focus dans la sidebar mobile quand elle est ouverte
  useEffect(() => {
    if (!mobileOpen) return;
    const panel = sidebarRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setMobileOpen(false); return; }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col">
        <div className="fixed top-0 left-0 h-full w-60">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div id="mobile-sidebar-panel" ref={sidebarRef} className="relative w-64 z-10" role="dialog" aria-modal="true" aria-label="Menu de navigation">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-zinc-950/90 border-b border-slate-800 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={mobileOpen}
            aria-controls="mobile-sidebar-panel"
            aria-label="Ouvrir le menu de navigation"
          >
            <IconMenu size={20} aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <IconActivity size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white">HealthAI Coach</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
