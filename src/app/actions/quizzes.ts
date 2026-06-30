"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { canAccessCourse } from "@/lib/access"

interface SubmitAnswerParams {
    quizId: string
    answers: { questionId: string; selectedOptionId: string }[]
}

export async function submitQuizAttempt(params: SubmitAnswerParams) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: params.quizId },
            include: {
                questions: {
                    orderBy: { order: "asc" },
                },
                lesson: {
                    include: {
                        module: {
                            include: {
                                course: {
                                    include: {
                                        enrollments: {
                                            where: {
                                                userId: session.user.id,
                                                status: "BLOCKED",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                module: {
                    include: {
                        course: {
                            include: {
                                enrollments: {
                                    where: {
                                        userId: session.user.id,
                                        status: "BLOCKED",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!quiz) throw new Error("Quiz not found")
        if (quiz.questions.length === 0) throw new Error("Quiz without questions")

        // Suporta quiz de aula e quiz de módulo: valida acesso (publicado + perfil)
        // no curso de origem e bloqueio explícito (matrícula BLOCKED).
        const course = quiz.lesson?.module.course ?? quiz.module?.course
        if (!course) throw new Error("Forbidden")

        const blocked = course.enrollments.length > 0
        if (!canAccessCourse(session.user, course, { blocked })) {
            throw new Error("Forbidden")
        }

        const answerMap = new Map<string, string>()
        for (const answer of params.answers) {
            answerMap.set(answer.questionId, answer.selectedOptionId)
        }

        if (answerMap.size !== quiz.questions.length) {
            throw new Error("All questions must be answered")
        }

        let correctCount = 0
        const answerRecords = quiz.questions.map((question) => {
            const selectedOptionId = answerMap.get(question.id)
            if (!selectedOptionId) {
                throw new Error("Invalid answer payload")
            }

            const isCorrect = question.correctOptionId === selectedOptionId
            if (isCorrect) correctCount++

            return {
                questionId: question.id,
                selectedOptionId,
                isCorrect,
            }
        })

        const score = Math.round((correctCount / quiz.questions.length) * 100)
        const passed = score >= 70

        const attempt = await prisma.$transaction(async (tx) => {
            const alreadyPassedQuiz = passed
                ? await tx.quizAttempt.findFirst({
                    where: {
                        userId: session.user.id,
                        quizId: quiz.id,
                        passed: true,
                    },
                })
                : null

            const createdAttempt = await tx.quizAttempt.create({
                data: {
                    userId: session.user.id,
                    quizId: quiz.id,
                    score,
                    passed,
                    completedAt: new Date(),
                    answers: {
                        create: answerRecords,
                    },
                },
            })

            if (passed && !alreadyPassedQuiz) {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { points: { increment: 50 } },
                })

                const totalPassed = await tx.quizAttempt.count({
                    where: { userId: session.user.id, passed: true },
                })

                if (totalPassed === 1) {
                    const existingBadge = await tx.gamificationBadge.findFirst({
                        where: { userId: session.user.id, name: "Primeiro 10!" },
                    })

                    if (!existingBadge) {
                        await tx.gamificationBadge.create({
                            data: {
                                userId: session.user.id,
                                name: "Primeiro 10!",
                                description: "Passou no seu primeiro Quiz de avaliação",
                            },
                        })
                    }
                }
            }

            return createdAttempt
        })

        revalidatePath(`/app/quiz/${quiz.id}`)

        if (quiz.lesson) {
            revalidatePath(
                `/app/cursos/${quiz.lesson.module.course.slug}/aulas/${quiz.lesson.slug}`
            )
        }

        return { success: true, score, passed, attemptId: attempt.id }
    } catch (error) {
        console.error("Error submitting quiz:", error)
        return { success: false, error: "Failed to submit quiz" }
    }
}
