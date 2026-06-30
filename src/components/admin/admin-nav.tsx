"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
    { href: "/admin", label: "Cursos", icon: BookOpen },
    { href: "/admin/usuarios", label: "Usuários", icon: Users },
] as const

export function AdminNav() {
    const pathname = usePathname()

    return (
        <nav className="flex items-center gap-1">
            {ITEMS.map((it) => {
                const active =
                    it.href === "/admin"
                        ? pathname === "/admin" || pathname.startsWith("/admin/cursos")
                        : pathname.startsWith(it.href)
                return (
                    <Link
                        key={it.href}
                        href={it.href}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                            active ? "bg-white/[0.06] text-white" : "text-zinc-400 hover:bg-white/[0.03] hover:text-white"
                        )}
                    >
                        <it.icon size={16} />
                        <span className="hidden sm:inline">{it.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
