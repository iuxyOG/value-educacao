"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createPost(content: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (!content.trim()) return { success: false, error: "Content is required" }

    const title = content.length > 50 ? content.slice(0, 47) + "..." : content

    try {
        await prisma.post.create({
            data: {
                title,
                content,
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

    if (!content.trim()) return { success: false, error: "Content is required" }

    try {
        await prisma.comment.create({
            data: {
                content,
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
