import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, ChevronRight, Menu, PlayCircle } from "lucide-react"
import { VideoPlayer } from "@/components/video-player"
import { toggleLessonCompletion } from "@/app/actions"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotesSection } from "@/components/notes-section"
import { cn } from "@/lib/utils"

const SHARED_COURSE_SLUG = "conheca-empresa"

interface PageProps {
    params: {
        courseSlug: string
        lessonSlug: string
    }
}

export default async function LessonPage(props: PageProps) {
    const params = await props.params
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const lesson = await prisma.lesson.findUnique({
        where: { slug: params.lessonSlug },
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
                            modules: {
                                orderBy: { order: "asc" },
                                include: {
                                    lessons: {
                                        orderBy: { order: "asc" },
                                        include: {
                                            progress: {
                                                where: { userId: session.user.id },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            progress: {
                where: { userId: session.user.id },
            },
            notes: {
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" },
            },
            quiz: {
                include: {
                    attempts: {
                        where: { userId: session.user.id },
                    },
                },
            },
        },
    })

    if (!lesson || lesson.module.course.slug !== params.courseSlug) return notFound()

    const course = lesson.module.course
    const hasEnrollment = course.enrollments.length > 0
    const roleAllowed =
        session.user.role === "ADMIN" ||
        course.slug === SHARED_COURSE_SLUG ||
        session.user.role === course.audience

    if (!hasEnrollment || !roleAllowed) return notFound()

    const isCompleted = lesson.progress.length > 0 && !!lesson.progress[0].completedAt
    const allLessons = course.modules.flatMap((moduleItem) => moduleItem.lessons)
    const currentIndex = allLessons.findIndex((lessonItem) => lessonItem.id === lesson.id)
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

    const sidebarContent = (
        <div className="flex h-full flex-col bg-[#09090b]">
            <div className="border-b border-white/5 px-6 py-6 shrink-0">
                <Link href="/app" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    <ChevronLeft size={16} />
                    Voltar para cursos
                </Link>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Módulos e aulas</p>
                    <h2 className="text-xl font-bold text-white leading-tight">{course.title}</h2>
                    <p className="text-[10px] uppercase tracking-widest text-[#ff6a1a] font-bold mt-1">
                        {course.modules.length} Módulos • {allLessons.length} Aulas
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <Accordion type="multiple" defaultValue={[lesson.moduleId]} className="w-full space-y-3">
                    {course.modules.map((moduleItem) => {
                        const completedCount = moduleItem.lessons.filter(
                            (lessonItem) => lessonItem.progress.length > 0 && !!lessonItem.progress[0].completedAt
                        ).length

                        return (
                            <AccordionItem key={moduleItem.id} value={moduleItem.id} className="border border-white/5 rounded-xl bg-[#0d0d0f] overflow-hidden">
                                <AccordionTrigger className="px-5 py-4 text-sm font-semibold hover:bg-white/[0.04] hover:no-underline transition-colors data-[state=open]:border-b data-[state=open]:border-white/5">
                                    <div className="flex w-full items-center justify-between pr-2">
                                        <span className="text-zinc-200 text-base font-bold">Módulo {moduleItem.order}</span>
                                        <span className="text-xs text-zinc-400 font-bold bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                            {completedCount}/{moduleItem.lessons.length}
                                        </span>
                                    </div>
                                </AccordionTrigger>

                                <AccordionContent className="p-3">
                                    <div className="space-y-1">
                                        {moduleItem.lessons.map((lessonItem) => {
                                            const lessonCompleted =
                                                lessonItem.progress.length > 0 && !!lessonItem.progress[0].completedAt
                                            const isActive = lessonItem.id === lesson.id

                                            return (
                                                <Link
                                                    key={lessonItem.id}
                                                    href={`/app/cursos/${course.slug}/aulas/${lessonItem.slug}`}
                                                    className={cn(
                                                        "group flex items-center justify-between gap-3 rounded-lg px-4 py-3.5 transition-colors border left-0",
                                                        isActive
                                                            ? "border-[#ff6a1a]/40 bg-[#ff6a1a]/5"
                                                            : "border-transparent hover:bg-white/[0.03]"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <div
                                                            className={cn(
                                                                "text-[10px] uppercase tracking-wider font-bold whitespace-nowrap px-2 py-1 rounded border",
                                                                isActive
                                                                    ? "text-[#ff6a1a] border-[#ff6a1a]/30 bg-[#ff6a1a]/10"
                                                                    : "text-zinc-500 border-white/5 bg-white/[0.02] group-hover:text-zinc-400"
                                                            )}
                                                        >
                                                            Aula {lessonItem.order}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p
                                                                className={cn(
                                                                    "line-clamp-2 text-sm leading-snug",
                                                                    isActive ? "text-white font-bold" : "text-zinc-400 font-medium group-hover:text-zinc-200"
                                                                )}
                                                            >
                                                                {lessonItem.title}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={cn(
                                                            "shrink-0 ml-2 transition-colors",
                                                            lessonCompleted
                                                                ? "text-[#ff6a1a]"
                                                                : isActive
                                                                    ? "text-[#ff6a1a]"
                                                                    : "text-zinc-600 group-hover:text-zinc-500"
                                                        )}
                                                    >
                                                        {lessonCompleted ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />}
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>
        </div>
    )

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] max-w-[1800px] mx-auto pb-12">
            {/* Left Column: Video and Info */}
            <div className="flex flex-col space-y-6">
                {/* Mobile Sidebar Trigger */}
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                            >
                                <Menu size={16} />
                                Ver módulos e aulas
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85vw] max-w-sm border-r border-white/5 bg-[#09090b] p-0">
                            {sidebarContent}
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Video Container */}
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black w-full aspect-video shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />
                    <VideoPlayer videoId={lesson.youtubeVideoId} />
                </div>

                {/* Lesson Info Header */}
                <div className="flex flex-col space-y-4">
                    <div className="pt-2">
                        <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                            <span>Módulo {lesson.module.order}</span>
                            <span className="h-1 w-1 rounded-full bg-zinc-700" />
                            <span>Aula {lesson.order}</span>
                        </p>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-[1.1]">
                            {lesson.title}
                        </h1>
                        <p className="mt-3 text-sm text-zinc-400 font-medium">
                            Treinamento: <span className="text-zinc-300">{course.title}</span>
                        </p>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between pt-4">
                        <form action={async () => {
                            "use server"
                            await toggleLessonCompletion(lesson.id, `/app/cursos/${course.slug}/aulas/${lesson.slug}`)
                        }}>
                            <Button
                                type="submit"
                                size="lg"
                                className={cn(
                                    "w-full sm:w-auto font-bold transition-all px-8 h-12 shadow-lg",
                                    isCompleted
                                        ? "bg-transparent text-[#ff6a1a] hover:bg-[#ff6a1a]/10 border-2 border-[#ff6a1a]"
                                        : "bg-[#ff6a1a] hover:bg-[#ff6a1a]/90 text-white shadow-[#ff6a1a]/20"
                                )}
                            >
                                {isCompleted ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                        Aula concluída
                                    </>
                                ) : (
                                    "Marcar como concluída"
                                )}
                            </Button>
                        </form>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {prevLesson ? (
                                <Button asChild variant="outline" className="flex-1 sm:flex-none border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white h-12 font-semibold">
                                    <Link href={`/app/cursos/${course.slug}/aulas/${prevLesson.slug}`}>
                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                        Anterior
                                    </Link>
                                </Button>
                            ) : (
                                <Button disabled variant="outline" className="flex-1 sm:flex-none border-white/5 bg-transparent text-zinc-600 h-12 font-semibold">
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Anterior
                                </Button>
                            )}

                            {nextLesson ? (
                                <Button asChild variant="outline" className="flex-1 sm:flex-none border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white h-12 font-semibold">
                                    <Link href={`/app/cursos/${course.slug}/aulas/${nextLesson.slug}`}>
                                        Próxima
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild variant="outline" className="flex-1 sm:flex-none border-[#ff6a1a]/20 bg-[#ff6a1a]/10 text-[#ff6a1a] hover:bg-[#ff6a1a]/20 hover:text-[#ff6a1a] h-12 font-semibold">
                                    <Link href="/app">
                                        Finalizar
                                        <CheckCircle2 className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Content Tabs */}
                    <div className="mt-8 pt-4">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-transparent p-0 overflow-x-auto custom-scrollbar">
                                <TabsTrigger
                                    value="overview"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#ff6a1a] data-[state=active]:text-white data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent pb-4 text-sm font-bold text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap px-4"
                                >
                                    Visão Geral
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notes"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#ff6a1a] data-[state=active]:text-white data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent pb-4 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap px-4"
                                >
                                    Anotações & Materiais
                                </TabsTrigger>
                                <TabsTrigger
                                    value="support"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#ff6a1a] data-[state=active]:text-white data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent pb-4 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap px-4"
                                >
                                    Suporte & Dúvidas
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="py-8 outline-none animate-in fade-in duration-500">
                                {lesson.description ? (
                                    <div className="prose prose-invert prose-sm max-w-none text-zinc-400">
                                        <p className="whitespace-pre-line leading-relaxed text-base">{lesson.description}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                                        <p className="text-sm font-medium">Nenhuma descrição disponível para esta aula.</p>
                                    </div>
                                )}

                                {lesson.quiz && (
                                    <div className="mt-8 border border-[#ff6a1a]/20 bg-[#ff6a1a]/5 rounded-2xl p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                                        <div className="pr-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6a1a]/10 text-[#ff6a1a] text-xs font-bold uppercase tracking-wider mb-3">
                                                Avaliação
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">{lesson.quiz.title}</h3>
                                            <p className="text-sm text-zinc-400">{lesson.quiz.description || "Responda o quiz para testar seu aprendizado e ganhar pontos extras."}</p>
                                        </div>

                                        <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2">
                                            {lesson.quiz.attempts && lesson.quiz.attempts.some(a => a.passed) ? (
                                                <div className="flex flex-col items-center text-center p-4 bg-white/5 rounded-xl border border-white/10">
                                                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">Status</span>
                                                    <span className="text-[#ff6a1a] font-bold text-lg">Aprovado</span>
                                                </div>
                                            ) : (
                                                <Button asChild className="w-full sm:w-auto bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 h-12 px-8 font-bold shadow-lg shadow-[#ff6a1a]/20">
                                                    <Link href={`/app/quiz/${lesson.quiz.id}`}>
                                                        Ir para o Quiz
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="notes" className="py-8 outline-none">
                                <NotesSection lessonId={lesson.id} initialNotes={lesson.notes} />
                            </TabsContent>

                            <TabsContent value="support" className="py-8 outline-none">
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                                    <p className="text-sm font-medium mb-3">Tem alguma dúvida sobre este conteúdo?</p>
                                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white">
                                        Deixar um comentário
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Right Column: Desktop Sidebar */}
            <aside className="hidden lg:block h-fit sticky top-6 rounded-2xl border border-white/5 bg-[#09090b] overflow-hidden shadow-xl">
                <div className="max-h-[calc(100vh-3rem)] overflow-y-auto">
                    {sidebarContent}
                </div>
            </aside>
        </div>
    )
}
