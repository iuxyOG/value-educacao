import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, Play } from "lucide-react"

const SHARED_COURSE_SLUG = "conheca-empresa"

export default async function CoursesPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const isAdmin = session.user.role === "ADMIN"
    const allowedAudience = session.user.role === "GESTOR"
        ? "GESTOR"
        : session.user.role === "VENDEDOR"
            ? "VENDEDOR"
            : null

    let enrollments: Array<{
        course: {
            id: string
            title: string
            slug: string
            description: string | null
            coverImage: string | null
            audience: "GESTOR" | "VENDEDOR"
            modules: Array<{
                id: string
                order: number
                lessons: Array<{ id: string; slug: string; title: string; order: number }>
            }>
        }
    }> = []

    if (isAdmin || allowedAudience) {
        try {
            const whereFilter = isAdmin
                ? {
                    userId: session.user.id,
                    status: "ACTIVE" as const,
                    course: { published: true },
                }
                : {
                    userId: session.user.id,
                    status: "ACTIVE" as const,
                    course: {
                        published: true,
                        OR: [
                            { audience: allowedAudience as "GESTOR" | "VENDEDOR" },
                            { slug: SHARED_COURSE_SLUG },
                        ],
                    },
                }

            enrollments = await prisma.enrollment.findMany({
                where: whereFilter,
                include: {
                    course: {
                        include: {
                            modules: {
                                orderBy: { order: "asc" },
                                include: {
                                    lessons: {
                                        orderBy: { order: "asc" },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "asc" },
            })
        } catch (error) {
            console.error("DB Error:", error)
        }
    }

    const firstEnrollmentWithLesson = enrollments.find((enrollment) => enrollment.course.modules[0]?.lessons[0])
    const firstLessonHref = firstEnrollmentWithLesson
        ? `/app/cursos/${firstEnrollmentWithLesson.course.slug}/aulas/${firstEnrollmentWithLesson.course.modules[0].lessons[0].slug}`
        : null

    const onboardingCourse = enrollments.find(e => e.course.slug === SHARED_COURSE_SLUG)?.course
    const onboardingLessons = onboardingCourse?.modules.flatMap(m => m.lessons) || []

    return (
        <div className="space-y-12 pb-12">
            {/* Hero Section */}
            <section className="relative w-full overflow-hidden rounded-2xl bg-[#0d0d0f] border border-white/5 shadow-2xl">
                {/* Background ambient light */}
                <div className="absolute left-0 top-0 h-full w-2/3 bg-gradient-to-r from-[#ff6a1a]/10 to-transparent mix-blend-screen pointer-events-none" />
                <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#ff6a1a]/20 blur-[120px] pointer-events-none" />

                <div className="relative flex min-h-[420px] flex-col justify-center px-8 lg:px-16 py-12 z-10 w-full lg:w-3/4">
                    <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff6a1a]">
                        <span>Início</span>
                        <ChevronRight size={12} className="text-zinc-600" />
                        <span className="text-zinc-400">Cursos Disponíveis</span>
                        <ChevronRight size={12} className="text-zinc-600" />
                        <span className="text-white">Value Educação</span>
                    </div>

                    <h1 className="text-4xl font-light tracking-tight text-white md:text-5xl lg:text-6xl uppercase leading-[1.1] mb-2">
                        Bem vindos a <br />
                        <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-400">
                            Value Educação
                        </span>
                    </h1>

                    {/* Progress Bar (Visual indicator) */}
                    <div className="mt-8 flex w-full max-w-md items-center gap-4">
                        <div className="h-1.5 flex-1 bg-white/10 overflow-hidden rounded-full">
                            <div className="h-full w-[15%] bg-gradient-to-r from-[#ff6a1a] to-[#ff9b68] rounded-full shadow-[0_0_10px_rgba(255,106,26,0.5)]" />
                        </div>
                        <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">15% Concluído</span>
                    </div>

                    {firstLessonHref && (
                        <div className="mt-10">
                            <Button asChild size="lg" className="rounded bg-white text-black hover:bg-zinc-200 transition-all font-bold px-8 h-12">
                                <Link href={firstLessonHref}>
                                    <Play className="mr-2 h-5 w-5 fill-black" />
                                    Continuar Assistindo
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right side fade (for instructor image integration if we had one) */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#09090b] via-[#09090b]/50 to-transparent pointer-events-none hidden md:block" />
            </section>

            {/* Onboarding Trail */}
            {onboardingLessons.length > 0 && (
                <section className="border border-[#ff6a1a]/20 bg-gradient-to-br from-[#ff6a1a]/5 to-transparent rounded-2xl p-8 lg:p-10 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        <div className="md:w-1/3 shrink-0">
                            <h2 className="text-2xl font-black tracking-tight text-white mb-3 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-[#ff6a1a] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,106,26,0.4)] text-sm">🚀</span>
                                Trilha de Onboarding
                            </h2>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-6">Comece sua jornada por aqui! Preparamos um caminho guiado para você entender a nossa cultura e os pilares do nosso negócio.</p>
                            <Button asChild className="bg-transparent border-2 border-[#ff6a1a] text-[#ff6a1a] hover:bg-[#ff6a1a] hover:text-white font-bold h-12 px-6">
                                <Link
                                    href={onboardingLessons.length > 0 ? `/app/cursos/${onboardingCourse?.slug}/aulas/${onboardingLessons[0].slug}` : "#"}
                                >
                                    Ver Curso Completo
                                </Link>
                            </Button>
                        </div>

                        <div className="md:w-2/3 w-full">
                            <div className="flex flex-col gap-4 relative">
                                {/* Connecting timeline line */}
                                <div className="hidden sm:block absolute left-6 top-6 bottom-6 w-0.5 bg-white/10 z-0" />

                                {onboardingLessons.slice(0, 3).map((lesson, idx) => (
                                    <Link
                                        key={lesson.id}
                                        href={`/app/cursos/${onboardingCourse?.slug}/aulas/${lesson.slug}`}
                                        className="relative z-10 flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-[#0a0a0c] hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="shrink-0 w-12 h-12 rounded-full border border-white/10 bg-black/50 flex items-center justify-center font-black text-zinc-500 group-hover:border-[#ff6a1a] group-hover:text-[#ff6a1a] transition-all relative">
                                            {idx + 1}
                                            {/* Glowing dot effect behind number on hover */}
                                            <div className="absolute inset-0 bg-[#ff6a1a]/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1 group-hover:text-[#ff6a1a] transition-colors">{lesson.title}</h4>
                                            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Etapa {idx + 1}</span>
                                        </div>
                                        <ChevronRight size={18} className="text-zinc-600 ml-auto group-hover:text-[#ff6a1a] group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

        </div>
    )
}
