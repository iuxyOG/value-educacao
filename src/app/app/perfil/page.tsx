import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Trophy, Clock, BookOpen, Target, Flame, ChevronRight, Award, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Calculate hours and minutes from seconds
function formatDuration(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}

export default async function ProfileDashboardPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    // Fetch user with progress and stats
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            progress: {
                include: {
                    lesson: true,
                },
            },
            enrollments: {
                include: {
                    course: {
                        include: {
                            modules: {
                                include: {
                                    lessons: true,
                                },
                            },
                        },
                    },
                },
            },
            badges: true,
            certificates: {
                include: {
                    course: true
                }
            }
        },
    })

    if (!user) return redirect("/login")

    // Calculate metrics
    const completedLessons = user.progress.filter(p => p.completedAt)
    const totalStudySeconds = completedLessons.reduce((acc, p) => acc + (p.lesson.durationSec || 0), 0)

    const coursesEnrolled = user.enrollments.length
    let coursesCompleted = 0

    // Count completed courses
    user.enrollments.forEach(enrollment => {
        const course = enrollment.course
        const totalLessonsInCourse = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)

        const completedInCourse = completedLessons.filter(p =>
            course.modules.some(m => m.lessons.some(l => l.id === p.lessonId))
        ).length

        if (totalLessonsInCourse > 0 && completedInCourse === totalLessonsInCourse) {
            coursesCompleted++
        }
    })

    const nameInitials = user.name ? user.name.slice(0, 2).toUpperCase() : "US"

    return (
        <div className="max-w-[1540px] mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight">Meu Perfil Analítico</h1>
                <p className="mt-2 text-zinc-400">Acompanhe seu progresso e conquistas na plataforma.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Profile Header & Points */}
                <div className="lg:col-span-1 border border-white/5 rounded-2xl bg-[#09090b] p-6 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#ff6a1a]/10 to-transparent" />

                    <div className="relative mt-4 h-24 w-24 rounded-full border-2 border-[#ff6a1a] p-1 flex items-center justify-center bg-black/40 shadow-[0_0_30px_rgba(255,106,26,0.15)]">
                        <span className="text-2xl font-black text-white">{nameInitials}</span>
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-white">{user.name || "Usuário"}</h2>
                    <p className="text-sm text-zinc-500">{user.email}</p>
                    <p className="mt-2 text-xs font-semibold px-2.5 py-1 rounded bg-white/5 text-zinc-300 border border-white/10 uppercase tracking-widest">
                        Nível: {user.role}
                    </p>

                    <div className="mt-8 w-full rounded-xl border border-[#ff6a1a]/20 bg-gradient-to-r from-[#ff6a1a]/10 to-transparent p-5 text-left">
                        <div className="flex items-center gap-3 mb-1">
                            <Trophy className="text-[#ff6a1a]" size={20} />
                            <span className="text-sm font-bold text-[#ff6a1a] uppercase tracking-wider">Pontuação Total</span>
                        </div>
                        <p className="text-3xl font-black text-white">{user.points} <span className="text-sm text-zinc-500 font-medium">XP</span></p>
                    </div>
                </div>

                {/* 2. Key Metrics Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="border border-white/5 rounded-2xl bg-[#09090b] p-6 shadow-xl flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-[0.08] transition-opacity">
                            <Clock size={80} />
                        </div>
                        <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Tempo de Estudo</h3>
                        <p className="text-4xl font-black text-white">{formatDuration(totalStudySeconds)}</p>
                        <p className="text-sm text-zinc-500 mt-2 font-medium">Total de horas assistidas</p>
                    </div>

                    <div className="border border-white/5 rounded-2xl bg-[#09090b] p-6 shadow-xl flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-[0.08] transition-opacity">
                            <Target size={80} />
                        </div>
                        <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Aulas Concluídas</h3>
                        <p className="text-4xl font-black text-white">{completedLessons.length}</p>
                        <p className="text-sm text-zinc-500 mt-2 font-medium">Lições finalizadas</p>
                    </div>

                    <div className="border border-white/5 rounded-2xl bg-[#09090b] p-6 shadow-xl flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-[0.08] transition-opacity">
                            <BookOpen size={80} />
                        </div>
                        <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Cursos Ativos</h3>
                        <p className="text-4xl font-black text-white">{coursesEnrolled - coursesCompleted}</p>
                        <p className="text-sm text-zinc-500 mt-2 font-medium">Em andamento</p>
                    </div>

                    <div className="border border-white/5 rounded-2xl bg-[#09090b] p-6 shadow-xl flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-[0.08] transition-opacity text-[#ff6a1a]">
                            <Flame size={80} />
                        </div>
                        <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Cursos Concluídos</h3>
                        <p className="text-4xl font-black text-white">{coursesCompleted}</p>
                        <p className="text-sm text-zinc-500 mt-2 font-medium">Certificados disponíveis</p>
                    </div>

                </div>
            </div>

            {/* 3. Badges & Achievements Area */}
            <div className="mt-8 border border-white/5 rounded-2xl bg-[#09090b] p-6 lg:p-8 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Trophy className="text-[#ff6a1a]" size={20} />
                            Minhas Conquistas
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">Emblemas desbloqueados durante seu aprendizado.</p>
                    </div>
                </div>

                {user.badges.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Trophy className="text-zinc-600" size={32} />
                        </div>
                        <p className="text-zinc-400 font-medium">Você ainda não possui emblemas.</p>
                        <p className="text-sm text-zinc-500 mt-1">Continue estudando para desbloquear novas conquistas!</p>

                        <Link href="/app" className="mt-6 flex items-center gap-2 text-sm font-bold text-[#ff6a1a] hover:underline">
                            Ir para os cursos <ChevronRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {user.badges.map(badge => (
                            <div key={badge.id} className="border border-[#ff6a1a]/20 bg-[#ff6a1a]/5 rounded-xl p-4 flex flex-col items-center text-center transition-transform hover:scale-105">
                                <div className="h-16 w-16 mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a1a] to-orange-400 shadow-[0_0_15px_rgba(255,106,26,0.3)]">
                                    <Trophy className="text-white" size={28} />
                                </div>
                                <h4 className="font-bold text-white text-sm mb-1">{badge.name}</h4>
                                {badge.description && <p className="text-[#ff6a1a] text-xs font-semibold">{badge.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. Certificates Area */}
            <div className="mt-8 border border-white/5 rounded-2xl bg-[#09090b] p-6 lg:p-8 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Award className="text-[#ff6a1a]" size={20} />
                            Meus Certificados
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">Gere e baixe seus certificados de conclusão de cursos.</p>
                    </div>
                </div>

                {user.certificates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Award className="text-zinc-600" size={32} />
                        </div>
                        <p className="text-zinc-400 font-medium">Você ainda não concluiu nenhum curso.</p>
                        <p className="text-sm text-zinc-500 mt-1">Finalize todas as aulas de um curso para emitir seu certificado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {user.certificates.map(cert => {
                            const relatedEnrollment = user.enrollments.find(e => e.courseId === cert.courseId)
                            if (!relatedEnrollment) return null
                            return (
                                <div key={cert.id} className="border border-white/10 bg-white/[0.02] rounded-xl p-5 flex flex-col transition-colors hover:bg-white/[0.04] hover:border-[#ff6a1a]/30 group">
                                    <h4 className="font-bold text-white mb-2 leading-tight">{relatedEnrollment.course.title}</h4>
                                    <p className="text-xs text-zinc-500 font-medium mb-6">
                                        Emitido em {new Date(cert.issuedAt).toLocaleDateString("pt-BR")}
                                    </p>

                                    <div className="mt-auto">
                                        <Button asChild variant="outline" className="w-full bg-[#ff6a1a]/10 border-[#ff6a1a]/20 text-[#ff6a1a] hover:bg-[#ff6a1a]/20 hover:text-[#ff6a1a] font-semibold gap-2">
                                            <Link href={`/app/certificados/${relatedEnrollment.course.slug}`}>
                                                <Download size={16} />
                                                Visualizar Certificado
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

        </div>
    )
}
