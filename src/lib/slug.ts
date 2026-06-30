import { prisma } from "@/lib/prisma"

/** Slugify: minúsculas, sem acentos, hífens entre tokens. */
export function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
}

/** Slug único para Course (slug @unique). `ignoreId` permite manter o próprio na edição. */
export async function uniqueCourseSlug(title: string, ignoreId?: string): Promise<string> {
    const base = slugify(title) || "curso"
    for (let n = 1; n < 1000; n++) {
        const slug = n === 1 ? base : `${base}-${n}`
        const existing = await prisma.course.findUnique({ where: { slug }, select: { id: true } })
        if (!existing || existing.id === ignoreId) return slug
    }
    return `${base}-${Date.now()}`
}

/** Slug único para Lesson (slug @unique global). */
export async function uniqueLessonSlug(title: string, ignoreId?: string): Promise<string> {
    const base = slugify(title) || "aula"
    for (let n = 1; n < 1000; n++) {
        const slug = n === 1 ? base : `${base}-${n}`
        const existing = await prisma.lesson.findUnique({ where: { slug }, select: { id: true } })
        if (!existing || existing.id === ignoreId) return slug
    }
    return `${base}-${Date.now()}`
}
