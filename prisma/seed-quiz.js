const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // Find a lesson to attach a quiz to
    const lesson = await prisma.lesson.findFirst({
        where: { slug: "conheca-empresa-1-1" }
    })

    if (!lesson) {
        console.log("Lesson not found!")
        return
    }

    // Check if quiz already exists
    const existing = await prisma.quiz.findUnique({
        where: { lessonId: lesson.id }
    })

    if (existing) {
        console.log("Quiz already exists for this lesson!")
        return
    }

    console.log("Creating quiz for lesson:", lesson.title)

    const quiz = await prisma.quiz.create({
        data: {
            title: "Avaliação de Conhecimentos: Visão Geral",
            description: "Teste seus conhecimentos sobre o funcionamento da plataforma e ganhe 50 XP e sua primeira conquista!",
            lessonId: lesson.id,
            questions: {
                create: [
                    {
                        text: "Qual é o principal objetivo da Value Educação?",
                        order: 1,
                        correctOptionId: "opt-1",
                        optionsJson: JSON.stringify([
                            { id: "opt-1", text: "Transformar vendedores em especialistas através de educação corporativa contínua." },
                            { id: "opt-2", text: "Ser apenas uma biblioteca de vídeos aleatórios." },
                            { id: "opt-3", text: "Uma rede social para funcionários." },
                            { id: "opt-4", text: "Vender cursos online abertos ao público." }
                        ])
                    },
                    {
                        text: "Como você ganha XP na plataforma?",
                        order: 2,
                        correctOptionId: "opt-a",
                        optionsJson: JSON.stringify([
                            { id: "opt-a", text: "Concluindo aulas e passando em Quizzes de avaliação." },
                            { id: "opt-b", text: "Deixando o site aberto no navegador o dia todo." },
                            { id: "opt-c", text: "Apenas assistindo 10 segundos de vídeo." },
                            { id: "opt-d", text: "Você não ganha XP, o sistema é apenas informativo." }
                        ])
                    }
                ]
            }
        }
    })

    console.log("Quiz created successfully!", quiz)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
