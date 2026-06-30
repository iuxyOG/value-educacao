"use client"

import { UserFormDialog } from "./user-form"
import { DeleteConfirm } from "./delete-confirm"
import { deleteUser } from "@/app/admin/user-actions"
import { Button } from "@/components/ui/button"
import { UserPlus, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Role = "ADMIN" | "GESTOR" | "VENDEDOR" | "STUDENT"
type UserRow = { id: string; name: string | null; email: string; role: Role; createdAt: Date }

const ROLE_LABEL: Record<Role, string> = { ADMIN: "Admin", GESTOR: "Gestor", VENDEDOR: "Vendedor", STUDENT: "Aluno" }

export function UserList({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Usuários</h1>
                    <p className="mt-1 text-sm text-zinc-400">Crie e gerencie quem acessa a plataforma.</p>
                </div>
                <UserFormDialog
                    mode="create"
                    trigger={
                        <Button className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold gap-2">
                            <UserPlus size={16} /> Novo usuário
                        </Button>
                    }
                />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0f]">
                {users.map((u, i) => (
                    <div key={u.id} className={cn("flex items-center gap-4 px-4 py-3", i > 0 && "border-t border-white/5")}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1c] text-sm font-bold text-white">
                            {u.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                                {u.name || "Sem nome"}
                                {u.id === currentUserId ? <span className="ml-2 text-[10px] text-zinc-500">(você)</span> : null}
                            </p>
                            <p className="truncate text-xs text-zinc-500">{u.email}</p>
                        </div>
                        <span
                            className={cn(
                                "rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                                u.role === "ADMIN" ? "border-[#ff6a1a]/30 bg-[#ff6a1a]/10 text-[#ff6a1a]" : "border-white/10 bg-white/5 text-zinc-300"
                            )}
                        >
                            {ROLE_LABEL[u.role]}
                        </span>
                        <UserFormDialog
                            mode="edit"
                            user={u}
                            trigger={
                                <button type="button" aria-label="Editar usuário" className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white">
                                    <Pencil size={16} />
                                </button>
                            }
                        />
                        <DeleteConfirm
                            trigger={
                                <button
                                    type="button"
                                    aria-label="Excluir usuário"
                                    disabled={u.id === currentUserId}
                                    className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            }
                            title="Excluir usuário?"
                            description={`O usuário “${u.name || u.email}” será removido permanentemente, junto com seu progresso, anotações e certificados.`}
                            successMessage="Usuário excluído"
                            action={() => deleteUser(u.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
