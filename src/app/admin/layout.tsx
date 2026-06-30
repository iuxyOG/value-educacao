import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { ArrowLeft, LogOut } from "lucide-react"
import { AdminNav } from "@/components/admin/admin-nav"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") redirect("/app")

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0a0c] px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Logo className="scale-[0.6] origin-left" />
                        <span className="hidden sm:inline rounded bg-[#ff6a1a]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#ff6a1a] border border-[#ff6a1a]/20">
                            Admin
                        </span>
                    </div>
                    <AdminNav />
                </div>
                <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" className="text-zinc-400 hover:text-white gap-2">
                        <Link href="/app">
                            <ArrowLeft size={16} />
                            <span className="hidden sm:inline">Voltar ao app</span>
                        </Link>
                    </Button>
                    <form
                        action={async () => {
                            "use server"
                            await signOut()
                        }}
                    >
                        <Button type="submit" variant="ghost" size="icon" aria-label="Sair" className="text-zinc-400 hover:text-white">
                            <LogOut size={18} />
                        </Button>
                    </form>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">{children}</main>

            <Toaster />
        </div>
    )
}
