"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type ActionResult = { success: true } | { success: false; error: string }

async function getAdminSession() {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") return null
    return session
}

const roleEnum = z.enum(["ADMIN", "GESTOR", "VENDEDOR", "STUDENT"])

const createUserSchema = z.object({
    name: z.string().trim().min(2, "Nome muito curto.").max(120),
    email: z.string().trim().toLowerCase().email("E-mail inválido.").max(200),
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres.").max(200),
    role: roleEnum,
})

const updateUserSchema = z.object({
    name: z.string().trim().min(2, "Nome muito curto.").max(120),
    role: roleEnum,
    // Senha opcional na edição: vazio = manter a atual.
    password: z.union([z.literal(""), z.string().min(6, "A senha deve ter ao menos 6 caracteres.").max(200)]).optional(),
})

export async function createUser(input: z.input<typeof createUserSchema>): Promise<ActionResult> {
    if (!(await getAdminSession())) return { success: false, error: "Unauthorized" }

    const parsed = createUserSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

    try {
        const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } })
        if (existing) return { success: false, error: "Já existe um usuário com esse e-mail." }

        const passwordHash = await bcrypt.hash(parsed.data.password, 10)
        await prisma.user.create({
            data: {
                name: parsed.data.name,
                email: parsed.data.email,
                role: parsed.data.role,
                password: passwordHash,
            },
        })
        revalidatePath("/admin/usuarios")
        return { success: true }
    } catch (e) {
        console.error("createUser:", e)
        return { success: false, error: "Falha ao criar o usuário" }
    }
}

export async function updateUser(userId: string, input: z.input<typeof updateUserSchema>): Promise<ActionResult> {
    if (!(await getAdminSession())) return { success: false, error: "Unauthorized" }

    const parsed = updateUserSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

    try {
        const passwordHash = parsed.data.password ? await bcrypt.hash(parsed.data.password, 10) : undefined
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: parsed.data.name,
                role: parsed.data.role,
                ...(passwordHash ? { password: passwordHash } : {}),
            },
        })
        revalidatePath("/admin/usuarios")
        return { success: true }
    } catch (e) {
        console.error("updateUser:", e)
        return { success: false, error: "Falha ao atualizar o usuário" }
    }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
    const session = await getAdminSession()
    if (!session) return { success: false, error: "Unauthorized" }
    if (session.user.id === userId) return { success: false, error: "Você não pode excluir a própria conta." }

    try {
        await prisma.user.delete({ where: { id: userId } })
        revalidatePath("/admin/usuarios")
        return { success: true }
    } catch (e) {
        console.error("deleteUser:", e)
        return { success: false, error: "Falha ao excluir o usuário" }
    }
}
