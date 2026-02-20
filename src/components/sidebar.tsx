"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Home, Users, Bookmark, Bell, LayoutGrid, LogOut } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
    user: {
        name?: string | null
        email?: string | null
    }
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()

    const navItems = [
        { href: "/app", icon: Home, label: "Página Inicial", exact: true },
        { href: "/app/meus-cursos", icon: LayoutGrid, label: "Meus Cursos" },
        { href: "/app/comunidade", icon: Users, label: "Comunidade" },
        { href: "#", icon: Bookmark, label: "Aulas Salvas" },
    ]

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0c] flex-col hidden lg:flex border-r border-white/5">
            <div className="flex h-24 items-center px-8">
                <Logo className="scale-[0.85] origin-left" />
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                <div className="space-y-1">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-[#ff6a1a] mb-4">Início</p>

                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href)

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-white/[0.03] text-white border-l-2 border-[#ff6a1a]"
                                        : "text-zinc-400 hover:text-white hover:bg-white/[0.02] border-l-2 border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} className={cn(isActive ? "text-[#ff6a1a]" : "group-hover:text-zinc-300")} />
                                    {item.label}
                                </div>
                                {item.label === "Meus Cursos" && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-white transition-colors group-hover:bg-[#ff6a1a]">+</span>
                                )}
                            </Link>
                        )
                    })}
                </div>

                <div className="space-y-1 pt-2">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Perfil</p>

                    <Link
                        href="/app/perfil"
                        className={cn(
                            "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all border-l-2",
                            pathname === "/app/perfil"
                                ? "bg-white/[0.03] text-white border-[#ff6a1a]"
                                : "text-zinc-300 hover:text-white hover:bg-white/[0.02] border-transparent"
                        )}
                    >
                        <div className="h-8 w-8 rounded-lg bg-[#1a1a1c] flex items-center justify-center text-xs font-bold text-white border border-white/5 transition-transform group-hover:scale-105">
                            {user.name?.charAt(0) || "U"}
                        </div>
                        <span className="truncate">{user.name || "Aluno Value"}</span>
                    </Link>

                    <Link href="#" className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                        <Bell size={18} className="group-hover:text-zinc-300" />
                        Notificações
                    </Link>
                </div>
            </div>

            <div className="p-4 mb-4">
                <Button
                    onClick={() => {
                        signOut({ callbackUrl: "/login" })
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-4 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 h-12 px-4 border-none"
                >
                    <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center border border-white/10">
                        <LogOut size={14} className="text-zinc-500" />
                    </div>
                    Desconectar
                </Button>
            </div>
        </aside>
    )
}
