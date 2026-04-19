import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 px-6 py-3 flex items-center gap-4">
        <span className="text-sm font-semibold tracking-tight">Admin Panel</span>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground">
          <a href="/admin/models" className="hover:text-foreground transition-colors">
            Models
          </a>
        </nav>
        <div className="ml-auto">
          <a href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to app
          </a>
        </div>
      </header>
      <main className="flex flex-col">{children}</main>
    </div>
  );
}
