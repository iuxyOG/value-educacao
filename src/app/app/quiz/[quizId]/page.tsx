import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { QuizEngine } from "@/components/quiz-engine"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Trophy, ArrowLeft } from "lucide-react"

const SHARED_COURSE_SLUG = "conheca-empresa"

export default async function QuizPage({ params }: { params: { quizId: string } }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const { quizId } = await params

    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: {
                orderBy: { order: "asc" }
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
                                            status: "ACTIVE",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            attempts: {
                where: { userId: session.user.id },
                orderBy: { completedAt: "desc" }
            }
        }
    })

    if (!quiz) return notFound()

    if (quiz.lesson) {
        const course = quiz.lesson.module.course
        const hasEnrollment = course.enrollments.length > 0
        const roleAllowed =
            session.user.role === "ADMIN" ||
            course.slug === SHARED_COURSE_SLUG ||
            session.user.role === course.audience

        if (!hasEnrollment || !roleAllowed) {
            return notFound()
        }
    } else if (session.user.role !== "ADMIN") {
        return notFound()
    }

    const backUrl = quiz.lesson
        ? `/app/cursos/${quiz.lesson.module.course.slug}/aulas/${quiz.lesson.slug}`
        : "/app"

    const successfulAttempt = quiz.attempts.find(a => a.passed)

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans p-6 lg:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href={backUrl} className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} />
                    Voltar para plataforma
                </Link>

                {successfulAttempt ? (
                    <div className="flex flex-col items-center text-center p-12 border border-[#ff6a1a]/20 rounded-3xl bg-gradient-to-b from-[#ff6a1a]/10 to-transparent shadow-2xl animate-in zoom-in duration-500">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-[#ff6a1a] bg-[#ff6a1a]/20">
                            <Trophy className="text-[#ff6a1a]" size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">Quiz Concluído!</h2>
                        <p className="text-zinc-400 mb-6 max-w-sm">Você já atingiu a pontuação mínima neste teste de avaliação e garantiu seus pontos.</p>

                        <div className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-full border border-white/5 mb-8">
                            <CheckCircle2 className="text-[#ff6a1a]" size={20} />
                            <span className="font-bold text-white text-xl">{successfulAttempt.score}% de Aproveitamento</span>
                        </div>

                        <Button asChild className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 h-14 px-10 font-bold shadow-lg shadow-[#ff6a1a]/20 text-lg">
                            <Link href={backUrl}>Continuar Estudos</Link>
                        </Button>
                    </div>
                ) : (
                    <QuizEngine
                        quizId={quiz.id}
                        title={quiz.title}
                        description={quiz.description}
                        questions={quiz.questions}
                        backUrl={backUrl}
                    />
                )}
            </div>
        </div>
    )
}
