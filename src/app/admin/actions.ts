
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createLesson(formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" }

    const title = formData.get("title") as string
    const youtubeId = formData.get("youtubeId") as string
    const description = formData.get("description") as string
    const moduleId = formData.get("moduleId") as string

    if (!title || !youtubeId || !moduleId) {
        return { error: "Missing required fields" }
    }

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + "-" + Date.now().toString().slice(-4)

    try {
        const moduleRecord = await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                course: {
                    select: { slug: true },
                },
            },
        })

        if (!moduleRecord) {
            return { error: "Invalid module" }
        }

        const lastLesson = await prisma.lesson.findFirst({
            where: { moduleId },
            orderBy: { order: 'desc' }
        })
        const order = (lastLesson?.order || 0) + 1

        await prisma.lesson.create({
            data: {
                title,
                slug,
                youtubeVideoId: youtubeId,
                description,
                moduleId,
                order
            }
        })

        revalidatePath(`/app/cursos/${moduleRecord.course.slug}`)
        return { success: true }
    } catch (e) {
        console.error("Create Lesson Error:", e)
        return { error: "Failed to create lesson" }
    }
}
