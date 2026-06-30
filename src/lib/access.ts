import type { CourseAudience, Prisma } from "@prisma/client"

export const SHARED_COURSE_SLUG = "conheca-empresa"

export type AppRole = "ADMIN" | "GESTOR" | "VENDEDOR" | "STUDENT"

/**
 * Apenas o casamento de papel/audiência (ignora publish, archived e block).
 * ADMIN vê tudo; o curso compartilhado é liberado para todos; senão o papel
 * precisa bater com a audiência do curso.
 */
export function roleAllowsCourse(
    user: { role: AppRole },
    course: { slug: string; audience: CourseAudience },
): boolean {
    return (
        user.role === "ADMIN" ||
        course.slug === SHARED_COURSE_SLUG ||
        user.role === course.audience
    )
}

/**
 * Gate de um único curso. `blocked` = existe um Enrollment(user, course) com
 * status BLOCKED. ADMIN ignora publish/archived. Bloqueado sempre nega.
 */
export function canAccessCourse(
    user: { role: AppRole },
    course: { slug: string; audience: CourseAudience; published: boolean; archived?: boolean },
    opts?: { blocked?: boolean },
): boolean {
    if (opts?.blocked) return false
    if (!roleAllowsCourse(user, course)) return false
    if (user.role === "ADMIN") return true
    return course.published && !course.archived
}

/**
 * WHERE para listagens (`prisma.course.findMany`). Matrícula virou deny-list:
 * excluímos cursos em que o usuário está BLOCKED. ADMIN vê tudo (inclusive
 * rascunhos/arquivados); demais veem publicado + não-arquivado + audiência.
 */
export function visibleCoursesWhere(
    user: { id: string; role: AppRole },
): Prisma.CourseWhereInput {
    const notBlocked: Prisma.CourseWhereInput = {
        enrollments: { none: { userId: user.id, status: "BLOCKED" } },
    }

    if (user.role === "ADMIN") {
        return notBlocked
    }

    const audienceOr: NonNullable<Prisma.CourseWhereInput["OR"]> = [{ slug: SHARED_COURSE_SLUG }]
    if (user.role === "GESTOR" || user.role === "VENDEDOR") {
        audienceOr.push({ audience: user.role })
    }

    return { AND: [notBlocked, { published: true }, { archived: false }, { OR: audienceOr }] }
}
