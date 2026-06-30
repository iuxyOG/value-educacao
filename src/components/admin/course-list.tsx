"use client"

import { useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { setCoursePublished, setCourseArchived } from "@/app/admin/actions"
import { CourseFormDialog } from "./course-form"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Archive, ArchiveRestore, BookOpen, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type CourseCard = {
    id: string
    title: string
    slug: string
    description: string | null
    coverImage: string | null
    audience: "GESTOR" | "VENDEDOR"
    published: boolean
    archived: boolean
    _count: { modules: number }
    modules: { _count: { lessons: number } }[]
}

export function CourseList({ courses }: { courses: CourseCard[] }) {
    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Cursos</h1>
                    <p className="mt-1 text-sm text-zinc-400">Crie e gerencie cursos, módulos e aulas.</p>
                </div>
                <CourseFormDialog
                    mode="create"
                    trigger={
                        <Button className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold gap-2">
                            <Plus size={16} /> Novo curso
                        </Button>
                    }
                />
            </div>

            {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-24 text-center">
                    <BookOpen className="mb-3 text-zinc-600" size={40} />
                    <p className="font-medium text-zinc-300">Nenhum curso ainda.</p>
                    <p className="mt-1 text-sm text-zinc-500">Clique em “Novo curso” para começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <CourseCardItem key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    )
}

function CourseCardItem({ course }: { course: CourseCard }) {
    const [isPending, startTransition] = useTransition()
    const lessonCount = course.modules.reduce((acc, m) => acc + m._count.lessons, 0)

    const togglePublished = (next: boolean) => {
        startTransition(async () => {
            const res = await setCoursePublished(course.id, next)
            if (res.success) toast.success(next ? "Curso publicado" : "Curso despublicado")
            else toast.error(res.error)
        })
    }

    const toggleArchived = () => {
        startTransition(async () => {
            const res = await setCourseArchived(course.id, !course.archived)
            if (res.success) toast.success(course.archived ? "Curso restaurado" : "Curso arquivado")
            else toast.error(res.error)
        })
    }

    return (
        <div className={cn("flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0f] shadow-xl", course.archived && "opacity-60")}>
            <div className="relative h-32 bg-gradient-to-br from-zinc-800 to-zinc-900">
                {course.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] to-transparent" />
                <div className="absolute left-3 top-3 flex gap-2">
                    <span className="rounded border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-200 backdrop-blur">
                        {course.audience}
                    </span>
                    {course.archived ? (
                        <span className="rounded border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            Arquivado
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold leading-tight text-white line-clamp-2">{course.title}</h3>
                <p className="mt-1 text-xs text-zinc-500">
                    {course._count.modules} módulos · {lessonCount} aulas
                </p>

                <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                    <span className="text-xs font-semibold text-zinc-300">{course.published ? "Publicado" : "Rascunho"}</span>
                    <Switch checked={course.published} onCheckedChange={togglePublished} disabled={isPending} />
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <Button asChild className="flex-1 bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold gap-1">
                        <Link href={`/admin/cursos/${course.id}`}>
                            Gerenciar <ChevronRight size={16} />
                        </Link>
                    </Button>
                    <CourseFormDialog
                        mode="edit"
                        course={course}
                        trigger={
                            <Button variant="outline" size="icon" aria-label="Editar curso" className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white">
                                <Pencil size={16} />
                            </Button>
                        }
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label={course.archived ? "Restaurar curso" : "Arquivar curso"}
                        onClick={toggleArchived}
                        disabled={isPending}
                        className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white"
                    >
                        {course.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
