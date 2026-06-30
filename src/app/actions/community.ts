"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { revalidatePath } from "next/cache"

const postSchema = z.object({
    content: z.string().trim().min(1, "Escreva algo para publicar.").max(5000, "Máximo de 5000 caracteres."),
})

const commentSchema = z.object({
    content: z.string().trim().min(1, "Escreva um comentário.").max(2000, "Máximo de 2000 caracteres."),
})

export async function createPost(content: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const parsed = postSchema.safeParse({ content })
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Conteúdo inválido" }
    }

    if (!rateLimit(`post:${session.user.id}`, 10, 60_000)) {
        return { success: false, error: "Você está publicando rápido demais. Tente novamente em instantes." }
    }

    const clean = parsed.data.content
    const title = clean.length > 50 ? clean.slice(0, 47) + "..." : clean

    try {
        await prisma.post.create({
            data: {
                title,
                content: clean,
                userId: session.user.id
            }
        })

        revalidatePath("/app/comunidade")
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, error: "Failed to create post" }
    }
}

export async function toggleLike(postId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (!rateLimit(`like:${session.user.id}`, 60, 60_000)) {
        return { success: false, error: "Muitas ações em sequência. Aguarde um momento." }
    }

    try {
        const existingLike = await prisma.like.findFirst({
            where: { postId, userId: session.user.id }
        })

        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } })
        } else {
            await prisma.like.create({
                data: { postId, userId: session.user.id }
            })
        }

        revalidatePath("/app/comunidade")
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, error: "Failed to toggle like" }
    }
}

export async function createComment(postId: string, content: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const parsed = commentSchema.safeParse({ content })
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Comentário inválido" }
    }

    if (!rateLimit(`comment:${session.user.id}`, 20, 60_000)) {
        return { success: false, error: "Você está comentando rápido demais. Tente novamente em instantes." }
    }

    try {
        await prisma.comment.create({
            data: {
                content: parsed.data.content,
                postId,
                userId: session.user.id
            }
        })

        revalidatePath("/app/comunidade")
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, error: "Failed to create comment" }
    }
}
