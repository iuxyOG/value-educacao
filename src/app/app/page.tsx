import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, Play, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

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

            {/* Seus Cursos List (Replacing Onboarding Trail) */}
            <section className="space-y-6 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#ff6a1a] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,106,26,0.4)] text-lg">🚀</span>
                        <span className="uppercase">Trilhas de Conhecimento</span>
                    </h2>
                    <Button asChild variant="ghost" className="text-zinc-400 hover:text-white uppercase text-xs font-bold tracking-wider">
                        <Link href="/app/meus-cursos">Ver Todos</Link>
                    </Button>
                </div>

                {enrollments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] py-24 text-center">
                        <h3 className="text-lg font-medium text-zinc-200">Nenhum curso disponível</h3>
                        <p className="mt-2 text-sm text-zinc-500 max-w-sm">
                            Seu usuário ainda não possui matrícula nos cursos correspondentes a esse perfil.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {enrollments.map((enrollment) => {
                            const course = enrollment.course
                            const firstLesson = course.modules[0]?.lessons[0]
                            const hasAccess = !!firstLesson
                            const courseHref = hasAccess
                                ? `/app/cursos/${course.slug}/aulas/${firstLesson.slug}`
                                : null

                            return (
                                <Link
                                    href={courseHref || "#"}
                                    key={course.id}
                                    className={cn(
                                        "group relative flex aspect-[9/16] min-h-[460px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0f0a08] transition-all duration-500",
                                        hasAccess ? "hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#ff6a1a]/20 hover:border-white/10" : "opacity-75 cursor-not-allowed"
                                    )}
                                    aria-disabled={!hasAccess}
                                >
                                    {/* Cover Image */}
                                    {course.coverImage ? (
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-60 mix-blend-luminosity"
                                            style={{ backgroundImage: `url(${course.coverImage})` }}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900 opacity-40 transition-transform duration-700 group-hover:scale-110" />
                                    )}

                                    {/* Gradients to create the screenshot look */}
                                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#ff6a1a] via-[#ff6a1a]/20 to-transparent opacity-80 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-100" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-black/40 to-black/80" />

                                    {/* Additional orange glow on hover */}
                                    <div className="absolute inset-x-0 -bottom-20 h-40 bg-[#ff6a1a] opacity-0 blur-[50px] transition-opacity duration-500 group-hover:opacity-30" />

                                    {/* Content */}
                                    <div className="relative flex h-full flex-col justify-between p-5 z-10">
                                        <div className="flex justify-between items-start">
                                            <span className="rounded bg-black/40 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-300 backdrop-blur-md border border-white/10">
                                                {course.slug === SHARED_COURSE_SLUG ? "Geral" : course.audience}
                                            </span>

                                            {hasAccess ? (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 transition-colors duration-300 group-hover:bg-[#ff6a1a] group-hover:border-[#ff6a1a]">
                                                    <Play className="h-3.5 w-3.5 fill-white text-white ml-0.5" />
                                                </div>
                                            ) : (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                                                    <CheckCircle2 className="h-4 w-4 text-zinc-600" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto text-center w-full">
                                            <div className="mb-3 mx-auto h-[2px] w-6 bg-[#ff6a1a] rounded-full transition-all duration-300 group-hover:w-16 shadow-[0_0_8px_rgba(255,106,26,0.8)]" />
                                            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase leading-[1.1] drop-shadow-lg">
                                                {course.title}
                                            </h3>
                                            <p className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                {course.modules.length} Módulos
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </section>

        </div>
    )
}
