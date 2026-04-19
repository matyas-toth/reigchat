import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] font-sans">
      {/* Top chrome */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="flex items-center gap-0 px-6 h-12">
          {/* Brand mark */}
          <div className="flex items-center gap-2 mr-8 shrink-0">
            <div className="h-4 w-4 rounded-sm bg-white/20 grid place-items-center">
              <div className="h-2 w-2 rounded-[2px] bg-white/80" />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/50">
              Admin
            </span>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-px h-full">
            {[
              { href: "/admin", label: "Overview" },
              { href: "/admin/users", label: "Users" },
              { href: "/admin/models", label: "Models" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative flex items-center px-3 h-full text-[13px] text-white/40 hover:text-white/80 transition-colors duration-100 group"
              >
                {label}
                <span className="absolute bottom-0 left-3 right-3 h-px bg-white/0 group-hover:bg-white/20 transition-all duration-150 rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Right: back link */}
          <div className="ml-auto">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/60 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
              Vissza az apphoz
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
