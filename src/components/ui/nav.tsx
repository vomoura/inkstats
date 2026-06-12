"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Download, Trophy, Settings, Home } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tournaments", label: "Torneios", icon: Trophy },
  { href: "/import", label: "Importar", icon: Download },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Perfil", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-accent">
            <img src="/icons/illuminary.png" alt="InkStats" width={28} height={28} className="rounded" />
            InkStats
          </Link>
          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-light text-accent"
                      : "text-muted hover:text-foreground hover:bg-accent-light/50"
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
