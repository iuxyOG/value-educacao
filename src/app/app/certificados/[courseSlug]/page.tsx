import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CertificatePrintButton } from "./print-button"

export default async function CertificatePage({ params }: { params: { courseSlug: string } }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const { courseSlug } = await params

    const course = await prisma.course.findUnique({
        where: { slug: courseSlug },
        include: {
            modules: {
                include: {
                    lessons: true
                }
            }
        }
    })

    if (!course) return notFound()

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            progress: true,
            certificates: {
                where: { courseId: course.id }
            }
        }
    })

    if (!user) return redirect("/login")

    // Check completion logic
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
    const completedLessonsIds = user.progress.filter(p => p.completedAt).map(p => p.lessonId)
    const completedInCourse = course.modules.reduce((acc, m) => {
        return acc + m.lessons.filter(l => completedLessonsIds.includes(l.id)).length
    }, 0)

    const isCompleted = totalLessons > 0 && completedInCourse === totalLessons

    if (!isCompleted) {
        return (
            <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Você ainda não concluiu este curso.</h1>
                <p className="text-zinc-400 mb-8">Conclua todas as aulas para desbloquear seu certificado.</p>
                <Button asChild className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90">
                    <Link href={`/app/cursos/${course.slug}`}>Voltar para o Curso</Link>
                </Button>
            </div>
        )
    }

    // Save certificate if it doesn't exist yet
    let certificate = user.certificates[0]
    if (!certificate) {
        certificate = await prisma.certificate.create({
            data: {
                userId: user.id,
                courseId: course.id,
            }
        })
    }

    const issueDate = format(certificate.issuedAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans p-6 lg:p-12 flex flex-col items-center">

            <div className="w-full max-w-[1100px] mb-8 flex items-center justify-between no-print">
                <Link href="/app/perfil" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} />
                    Voltar ao Perfil
                </Link>

                <CertificatePrintButton />
            </div>

            {/* Certificate Container (A4 Landscape aspect ratio approximation) */}
            <div
                id="certificate-container"
                className="relative w-full max-w-[1100px] aspect-[1.414/1] bg-white text-zinc-900 shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:aspect-auto print:h-screen print:m-0"
                style={{
                    backgroundImage: "url('/noise.png')",
                    backgroundSize: "200px 200px" // give it a little texture
                }}
            >
                {/* Visual Borders & Accents */}
                <div className="absolute inset-0 border-[20px] border-[#09090b] pointer-events-none" />
                <div className="absolute inset-4 border-[2px] border-[#ff6a1a]/30 pointer-events-none" />

                {/* Corner Decorative Elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#ff6a1a] opacity-10 rounded-br-full pointer-events-none blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#ff6a1a] opacity-[0.05] rounded-tl-full pointer-events-none blur-3xl" />

                <div className="relative h-full flex flex-col items-center justify-center p-12 md:p-24 text-center z-10">

                    <Logo className="mb-12 origin-top grayscale contrast-200 opacity-80" />

                    <h4 className="text-[#ff6a1a] font-bold tracking-[0.3em] uppercase mb-4 text-sm md:text-base">Certificado de Conclusão</h4>

                    <h1 className="text-4xl md:text-6xl font-black text-[#09090b] mb-8 font-serif italic">
                        {user.name || "Aluno Value"}
                    </h1>

                    <p className="text-zinc-500 font-medium text-lg md:text-xl max-w-2xl leading-relaxed mb-4">
                        Concluiu com êxito todos os requisitos exigidos para o curso
                    </p>

                    <h2 className="text-2xl md:text-3xl font-black text-[#09090b] mb-16 max-w-3xl">
                        {course.title}
                    </h2>

                    <div className="flex w-full justify-between items-end px-12 mt-auto">
                        <div className="text-center">
                            <p className="font-bold text-zinc-800 border-b-2 border-zinc-200 pb-2 w-48 mb-2">
                                {issueDate}
                            </p>
                            <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Data de Emissão</p>
                        </div>

                        <div className="text-center">
                            <p className="font-bold text-zinc-800 border-b-2 border-zinc-200 pb-2 w-48 mb-2">
                                Value Educação
                            </p>
                            <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Diretoria de Ensino</p>
                        </div>
                    </div>

                    <div className="absolute bottom-12 right-12 opacity-20 transform rotate-12">
                        {/* Fake Seal */}
                        <div className="w-24 h-24 rounded-full border-4 border-[#ff6a1a] flex items-center justify-center border-dashed">
                            <div className="w-20 h-20 rounded-full border-2 border-[#ff6a1a] flex items-center justify-center p-2 text-center">
                                <span className="text-[10px] font-black uppercase text-[#ff6a1a]">Certificado Oficial</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS specifically for printing */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: landscape; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
                    .no-print { display: none !important; }
                    nav { display: none !important; }
                }
            `}} />
        </div>
    )
}
