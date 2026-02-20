"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createNote(lessonId: string, content: string, timestamp?: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    try {
        await prisma.note.create({
            data: {
                userId: session.user.id,
                lessonId,
                content,
                timestamp,
            },
        })

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    include: {
                        course: {
                            select: { slug: true },
                        },
                    },
                },
            },
        })

        if (lesson) {
            revalidatePath(`/app/cursos/${lesson.module.course.slug}/aulas/${lesson.slug}`)
        }

        return { success: true }
    } catch (error) {
        console.error("Error creating note:", error)
        return { success: false, error: "Failed to create note" }
    }
}

export async function deleteNote(noteId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    try {
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: {
                lesson: {
                    include: {
                        module: {
                            include: {
                                course: {
                                    select: { slug: true },
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!note || note.userId !== session.user.id) {
            throw new Error("Unauthorized or note not found")
        }

        await prisma.note.delete({
            where: { id: noteId },
        })

        revalidatePath(`/app/cursos/${note.lesson.module.course.slug}/aulas/${note.lesson.slug}`)
        return { success: true }
    } catch (error) {
        console.error("Error deleting note:", error)
        return { success: false, error: "Failed to delete note" }
    }
}
