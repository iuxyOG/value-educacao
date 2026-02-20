import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Play, CheckCircle2, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

const SHARED_COURSE_SLUG = "conheca-empresa"

export default async function MeusCursosPage() {
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

    return (
        <div className="space-y-8 pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
                    <LayoutGrid className="text-[#ff6a1a]" size={32} />
                    Meus Cursos
                </h1>
                <p className="mt-2 text-zinc-400">Catálogo completo de trilhas de conhecimento disponíveis para o seu perfil.</p>
            </div>

            {/* Courses Grid / Trilha de Módulos */}
            <section className="space-y-6">
                {enrollments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] py-24 text-center">
                        <h3 className="text-lg font-medium text-zinc-200">Nenhum curso disponível</h3>
                        <p className="mt-2 text-sm text-zinc-500 max-w-sm">
                            Seu usuário ainda não possui matrícula nos cursos correspondentes a esse perfil.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
                                        "group relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0f0a08] transition-all duration-500",
                                        hasAccess ? "hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#ff6a1a]/10 hover:border-white/10" : "opacity-75 cursor-not-allowed"
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
