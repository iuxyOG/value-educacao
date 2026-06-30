"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { revalidatePath } from "next/cache"

const SHARED_COURSE_SLUG = "conheca-empresa"

const noteSchema = z.object({
    content: z.string().trim().min(1, "A anotação não pode estar vazia.").max(5000, "Máximo de 5000 caracteres."),
    timestamp: z.number().int().min(0).optional(),
})

export async function createNote(lessonId: string, content: string, timestamp?: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const parsed = noteSchema.safeParse({ content, timestamp })
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Anotação inválida" }
    }

    if (!rateLimit(`note:${session.user.id}`, 30, 60_000)) {
        return { success: false, error: "Muitas anotações em sequência. Aguarde um momento." }
    }

    try {
        // Verifica acesso à aula (mesmo critério das páginas de aula/quiz) antes de gravar.
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    include: {
                        course: {
                            include: {
                                enrollments: {
                                    where: { userId: session.user.id, status: "ACTIVE" },
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!lesson) return { success: false, error: "Lesson not found" }

        const course = lesson.module.course
        const hasEnrollment = course.enrollments.length > 0
        const roleAllowed =
            session.user.role === "ADMIN" ||
            course.slug === SHARED_COURSE_SLUG ||
            session.user.role === course.audience

        if (!hasEnrollment || !roleAllowed) {
            return { success: false, error: "Forbidden" }
        }

        await prisma.note.create({
            data: {
                userId: session.user.id,
                lessonId,
                content: parsed.data.content,
                timestamp: parsed.data.timestamp,
            },
        })

        revalidatePath(`/app/cursos/${course.slug}/aulas/${lesson.slug}`)
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
