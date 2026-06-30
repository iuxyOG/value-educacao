"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { uniqueCourseSlug, uniqueLessonSlug } from "@/lib/slug"
import { extractYouTubeId } from "@/lib/youtube"

type ActionResult = { success: true } | { success: false; error: string }

async function isAdmin() {
    const session = await auth()
    return session?.user?.role === "ADMIN"
}

// Revalida painel admin, editor do curso, listagens do aluno e todas as aulas.
function revalidateAll(courseId?: string) {
    revalidatePath("/admin")
    if (courseId) revalidatePath(`/admin/cursos/${courseId}`)
    revalidatePath("/app")
    revalidatePath("/app/meus-cursos")
    revalidatePath("/app/cursos/[courseSlug]/aulas/[lessonSlug]", "page")
}

// ---------------- Schemas ----------------
const courseSchema = z.object({
    title: z.string().trim().min(2, "Título muito curto.").max(120, "Título muito longo."),
    description: z.string().trim().max(2000, "Descrição muito longa.").optional(),
    coverImage: z
        .union([
            z.literal(""),
            z.string().trim().url("URL de capa inválida.").startsWith("https://", "A capa deve começar com https://").max(2048),
            // Imagem enviada pelo admin: data URL gerada/compactada no navegador.
            z.string().startsWith("data:image/", "Imagem inválida.").max(1_500_000),
        ])
        .optional(),
    audience: z.enum(["GESTOR", "VENDEDOR"]),
    published: z.boolean().optional(),
})

const moduleSchema = z.object({
    title: z.string().trim().min(2, "Título muito curto.").max(120, "Título muito longo."),
})

const lessonSchema = z.object({
    title: z.string().trim().min(2, "Título muito curto.").max(160, "Título muito longo."),
    description: z.string().trim().max(5000, "Descrição muito longa.").optional(),
    youtubeUrl: z.string().trim().min(1, "Cole a URL do vídeo do YouTube."),
    durationSec: z.number().int().positive().max(86400).optional(),
})

type CourseInput = z.input<typeof courseSchema>
type ModuleInput = z.input<typeof moduleSchema>
type LessonInput = z.input<typeof lessonSchema>

// ---------------- Courses ----------------
export async function createCourse(
    input: CourseInput,
): Promise<{ success: true; courseId: string } | { success: false; error: string }> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }

    const parsed = courseSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

    try {
        const slug = await uniqueCourseSlug(parsed.data.title)
        const course = await prisma.course.create({
            data: {
                title: parsed.data.title,
                slug,
                description: parsed.data.description || null,
                coverImage: parsed.data.coverImage || null,
                audience: parsed.data.audience,
                published: parsed.data.published ?? false,
            },
        })
        revalidateAll(course.id)
        return { success: true, courseId: course.id }
    } catch (e) {
        console.error("createCourse:", e)
        return { success: false, error: "Falha ao criar o curso" }
    }
}

export async function updateCourse(courseId: string, input: CourseInput): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }

    const parsed = courseSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

    try {
        // Slug é mantido estável na edição (não regenerar) para não quebrar URLs.
        await prisma.course.update({
            where: { id: courseId },
            data: {
                title: parsed.data.title,
                description: parsed.data.description || null,
                coverImage: parsed.data.coverImage || null,
                audience: parsed.data.audience,
            },
        })
        revalidateAll(courseId)
        return { success: true }
    } catch (e) {
        console.error("updateCourse:", e)
        return { success: false, error: "Falha ao atualizar o curso" }
    }
}

export async function setCoursePublished(courseId: string, published: boolean): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }
    try {
        await prisma.course.update({ where: { id: courseId }, data: { published } })
        revalidateAll(courseId)
        return { success: true }
    } catch (e) {
        console.error("setCoursePublished:", e)
        return { success: false, error: "Falha ao alterar a publicação" }
    }
}

export async function setCourseArchived(courseId: string, archived: boolean): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }
    try {
        await prisma.course.update({ where: { id: courseId }, data: { archived } })
        revalidateAll(courseId)
        return { success: true }
    } catch (e) {
        console.error("setCourseArchived:", e)
        return { success: false, error: "Falha ao arquivar o curso" }
    }
}

// ---------------- Modules ----------------
export async function createModule(courseId: string, input: ModuleInput): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }

    const parsed = moduleSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

    try {
        const last = await prisma.module.findFirst({ where: { courseId }, orderBy: { order: "desc" } })
        await prisma.module.create({
            data: { title: parsed.data.title, courseId, order: (last?.order ?? 0) + 1 },
        })
        revalidateAll(courseId)
        return { success: true }
    } catch (e) {
        console.error("createModule:", e)
        return { success: false, error: "Falha ao criar o módulo" }
    }
}

export async function updateModule(moduleId: string, input: ModuleInput): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }

    const parsed = moduleSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

    try {
        const updated = await prisma.module.update({
            where: { id: moduleId },
            data: { title: parsed.data.title },
            select: { courseId: true },
        })
        revalidateAll(updated.courseId)
        return { success: true }
    } catch (e) {
        console.error("updateModule:", e)
        return { success: false, error: "Falha ao atualizar o módulo" }
    }
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }
    try {
        const deleted = await prisma.module.delete({ where: { id: moduleId }, select: { courseId: true } })
        revalidateAll(deleted.courseId)
        return { success: true }
    } catch (e) {
        console.error("deleteModule:", e)
        return { success: false, error: "Falha ao excluir o módulo" }
    }
}

export async function reorderModule(moduleId: string, direction: "up" | "down"): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }
    try {
        const current = await prisma.module.findUnique({ where: { id: moduleId } })
        if (!current) return { success: false, error: "Módulo não encontrado" }

        const neighbor = await prisma.module.findFirst({
            where: { courseId: current.courseId, order: direction === "up" ? { lt: current.order } : { gt: current.order } },
            orderBy: { order: direction === "up" ? "desc" : "asc" },
        })
        if (!neighbor) return { success: true } // já está na ponta

        await prisma.$transaction([
            prisma.module.update({ where: { id: current.id }, data: { order: neighbor.order } }),
            prisma.module.update({ where: { id: neighbor.id }, data: { order: current.order } }),
        ])
        revalidateAll(current.courseId)
        return { success: true }
    } catch (e) {
        console.error("reorderModule:", e)
        return { success: false, error: "Falha ao reordenar o módulo" }
    }
}

// ---------------- Lessons ----------------
export async function createLesson(moduleId: string, input: LessonInput): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }

    const parsed = lessonSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

    const videoId = extractYouTubeId(parsed.data.youtubeUrl)
    if (!videoId) return { success: false, error: "URL do YouTube inválida." }

    try {
        const moduleRecord = await prisma.module.findUnique({ where: { id: moduleId }, select: { courseId: true } })
        if (!moduleRecord) return { success: false, error: "Módulo inválido" }

        const last = await prisma.lesson.findFirst({ where: { moduleId }, orderBy: { order: "desc" } })
        const slug = await uniqueLessonSlug(parsed.data.title)
        await prisma.lesson.create({
            data: {
                title: parsed.data.title,
                slug,
                description: parsed.data.description || null,
                youtubeVideoId: videoId,
                durationSec: parsed.data.durationSec ?? null,
                moduleId,
                order: (last?.order ?? 0) + 1,
            },
        })
        revalidateAll(moduleRecord.courseId)
        return { success: true }
    } catch (e) {
        console.error("createLesson:", e)
        return { success: false, error: "Falha ao criar a aula" }
    }
}

export async function updateLesson(lessonId: string, input: LessonInput): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }

    const parsed = lessonSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

    const videoId = extractYouTubeId(parsed.data.youtubeUrl)
    if (!videoId) return { success: false, error: "URL do YouTube inválida." }

    try {
        // Slug mantido estável na edição (não regenerar).
        const updated = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                title: parsed.data.title,
                description: parsed.data.description || null,
                youtubeVideoId: videoId,
                durationSec: parsed.data.durationSec ?? null,
            },
            select: { module: { select: { courseId: true } } },
        })
        revalidateAll(updated.module.courseId)
        return { success: true }
    } catch (e) {
        console.error("updateLesson:", e)
        return { success: false, error: "Falha ao atualizar a aula" }
    }
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }
    try {
        const deleted = await prisma.lesson.delete({
            where: { id: lessonId },
            select: { module: { select: { courseId: true } } },
        })
        revalidateAll(deleted.module.courseId)
        return { success: true }
    } catch (e) {
        console.error("deleteLesson:", e)
        return { success: false, error: "Falha ao excluir a aula" }
    }
}

export async function reorderLesson(lessonId: string, direction: "up" | "down"): Promise<ActionResult> {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" }
    try {
        const current = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { module: { select: { courseId: true } } },
        })
        if (!current) return { success: false, error: "Aula não encontrada" }

        const neighbor = await prisma.lesson.findFirst({
            where: { moduleId: current.moduleId, order: direction === "up" ? { lt: current.order } : { gt: current.order } },
            orderBy: { order: direction === "up" ? "desc" : "asc" },
        })
        if (!neighbor) return { success: true }

        await prisma.$transaction([
            prisma.lesson.update({ where: { id: current.id }, data: { order: neighbor.order } }),
            prisma.lesson.update({ where: { id: neighbor.id }, data: { order: current.order } }),
        ])
        revalidateAll(current.module.courseId)
        return { success: true }
    } catch (e) {
        console.error("reorderLesson:", e)
        return { success: false, error: "Falha ao reordenar a aula" }
    }
}
