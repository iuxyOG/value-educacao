"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createUser, updateUser } from "@/app/admin/user-actions"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Role = "ADMIN" | "GESTOR" | "VENDEDOR" | "STUDENT"
type UserData = { id: string; name: string | null; email: string; role: Role }

const ROLES: { value: Role; label: string }[] = [
    { value: "VENDEDOR", label: "Vendedor" },
    { value: "GESTOR", label: "Gestor" },
    { value: "STUDENT", label: "Aluno" },
    { value: "ADMIN", label: "Admin" },
]

export function UserFormDialog({
    mode,
    user,
    trigger,
}: {
    mode: "create" | "edit"
    user?: UserData
    trigger: React.ReactNode
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [name, setName] = useState(user?.name ?? "")
    const [email, setEmail] = useState(user?.email ?? "")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState<Role>(user?.role ?? "VENDEDOR")

    const handleSubmit = () => {
        startTransition(async () => {
            const res =
                mode === "create"
                    ? await createUser({ name, email, password, role })
                    : await updateUser(user!.id, { name, role, password })
            if (res.success) {
                toast.success(mode === "create" ? "Usuário criado" : "Usuário atualizado")
                setOpen(false)
                setPassword("")
            } else {
                toast.error(res.error)
            }
        })
    }

    const canSubmit = name.trim().length >= 2 && (mode === "edit" || (email.trim().length > 0 && password.length >= 6))

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Novo usuário" : "Editar usuário"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="u-name">Nome</Label>
                        <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Maria Silva" className="border-white/10 bg-black/40" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="u-email">E-mail{mode === "edit" ? " (não editável)" : ""}</Label>
                        <Input
                            id="u-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={mode === "edit"}
                            placeholder="pessoa@empresa.com"
                            className="border-white/10 bg-black/40 disabled:opacity-60"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="u-pass">{mode === "create" ? "Senha inicial" : "Nova senha (em branco = manter)"}</Label>
                        <Input id="u-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mín. 6 caracteres" className="border-white/10 bg-black/40" />
                        {mode === "create" ? (
                            <p className="text-xs text-zinc-500">Informe esta senha à pessoa; ela entra com o e-mail + esta senha.</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label>Papel</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRole(r.value)}
                                    className={cn(
                                        "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                                        role === r.value
                                            ? "border-[#ff6a1a]/40 bg-[#ff6a1a]/10 text-[#ff6a1a]"
                                            : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white"
                                    )}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-500">Gestor/Vendedor veem os cursos do seu perfil; Aluno vê só o curso geral; Admin gerencia tudo.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isPending || !canSubmit} className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold gap-2">
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        {mode === "create" ? "Criar usuário" : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
