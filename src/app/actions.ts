
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const SHARED_COURSE_SLUG = "conheca-empresa"

export async function toggleLessonCompletion(lessonId: string, path: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    include: {
                        course: {
                            include: {
                                enrollments: {
                                    where: {
                                        userId: session.user.id,
                                        status: "ACTIVE",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!lesson) return { error: "Lesson not found" }

        const hasEnrollment = lesson.module.course.enrollments.length > 0
        const roleAllowed =
            session.user.role === "ADMIN" ||
            lesson.module.course.slug === SHARED_COURSE_SLUG ||
            session.user.role === lesson.module.course.audience

        if (!hasEnrollment || !roleAllowed) {
            return { error: "Forbidden" }
        }

        const existingProgress = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId: session.user.id,
                    lessonId,
                },
            },
        })

        const isCompleted = !!existingProgress?.completedAt

        await prisma.$transaction(async (tx) => {
            if (isCompleted) {
                await tx.progress.delete({
                    where: {
                        userId_lessonId: {
                            userId: session.user.id,
                            lessonId,
                        },
                    },
                })

                const user = await tx.user.findUnique({ where: { id: session.user.id } })
                if (user && user.points >= 10) {
                    await tx.user.update({
                        where: { id: session.user.id },
                        data: { points: { decrement: 10 } },
                    })
                }
                return
            }

            await tx.progress.upsert({
                where: {
                    userId_lessonId: {
                        userId: session.user.id,
                        lessonId,
                    },
                },
                update: {
                    completedAt: new Date(),
                },
                create: {
                    userId: session.user.id,
                    lessonId,
                    completedAt: new Date(),
                },
            })

            await tx.user.update({
                where: { id: session.user.id },
                data: { points: { increment: 10 } },
            })

            const totalCompleted = await tx.progress.count({
                where: { userId: session.user.id, completedAt: { not: null } },
            })

            if (totalCompleted !== 1) {
                return
            }

            const existingBadge = await tx.gamificationBadge.findFirst({
                where: { userId: session.user.id, name: "Primeiros Passos" },
            })

            if (!existingBadge) {
                await tx.gamificationBadge.create({
                    data: {
                        userId: session.user.id,
                        name: "Primeiros Passos",
                        description: "Concluiu sua primeira aula na plataforma",
                    },
                })
            }
        })

        revalidatePath(path)
        return { success: true }
    } catch (error) {
        console.error("Progress Error:", error)
        return { error: "Failed to update progress" }
    }
}
