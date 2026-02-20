
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createLesson } from "./actions"

export default async function AdminPage() {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") return redirect("/app")

    // Fetch all courses and modules for the form
    const courses = await prisma.course.findMany({
        include: {
            modules: true
        }
    })

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">Painel Admin</h1>

            <div className="grid gap-8">
                <Card className="bg-value-surface border-value-border">
                    <CardHeader>
                        <CardTitle>Adicionar Aula</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={async (formData) => { "use server"; await createLesson(formData); }} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Título da Aula</Label>
                                    <Input name="title" placeholder="Ex: Introdução ao Marketing" required className="bg-value-bg" />
                                </div>
                                <div className="space-y-2">
                                    <Label>YouTube ID</Label>
                                    <Input name="youtubeId" placeholder="Ex: dQw4w9WgXcQ" required className="bg-value-bg" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Módulo</Label>
                                <select name="moduleId" className="flex h-10 w-full rounded-md border border-input bg-value-bg px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                                    <option value="">Selecione um módulo...</option>
                                {courses.flatMap(c => c.modules.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {c.title} - {m.title}
                                        </option>
                                    )))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea name="description" placeholder="Conteúdo da aula..." className="bg-value-bg" />
                            </div>

                            <Button type="submit" className="bg-value-primary text-white hover:bg-value-primary/90">
                                Criar Aula
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="bg-value-surface border-value-border">
                    <CardHeader>
                        <CardTitle>Cursos Existentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {courses.map(c => (
                                <li key={c.id} className="p-3 bg-value-bg rounded border border-value-border flex justify-between items-center">
                                    <span>{c.title}</span>
                                    <span className="text-sm text-value-muted">{c.modules.length} Módulos</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
