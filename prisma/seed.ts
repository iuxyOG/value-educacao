import { PrismaClient, Role, CourseAudience } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

type SeedModule = {
    title: string
    order: number
    lessons: Array<{
        title: string
        order: number
        youtubeId: string
    }>
}

const DEFAULT_YOUTUBE_ID = "JG-xt_OqTlM"
const SHARED_COURSE_SLUG = "conheca-empresa"

const COURSE_ONE_MODULES: SeedModule[] = [
    {
        title: "Boas-vindas à VALUE",
        order: 1,
        lessons: [
            { title: "Quem somos: história e propósito da Value", order: 1, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Nossa visão, missão e valores", order: 2, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Cultura interna: disciplina, aprendizado constante e foco em resultados", order: 3, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "O que esperamos de cada colaborador (comprometimento, proatividade, comunicação clara)", order: 4, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Como trabalhamos: ambiente colaborativo, metas, reuniões e feedbacks", order: 5, youtubeId: DEFAULT_YOUTUBE_ID },
        ],
    },
    {
        title: "Estrutura da Empresa",
        order: 2,
        lessons: [
            { title: "Áreas da Value (Gestão de Contas, Marketing, Sucesso do Cliente, Administrativo etc.)", order: 1, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Quem são os líderes e gestores de referência", order: 2, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Como funciona a hierarquia e a comunicação entre setores", order: 3, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Apresentação das ferramentas internas", order: 4, youtubeId: DEFAULT_YOUTUBE_ID },
        ],
    },
    {
        title: "Rotina e Responsabilidades",
        order: 3,
        lessons: [
            { title: "Horários, organização e postura profissional", order: 1, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Processos de check-in e check-out de tarefas", order: 2, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Como reportar problemas e buscar ajuda", order: 3, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Rotina de acompanhamento de clientes e comunicação interna", order: 4, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Política de prazos, entregas e responsabilidades individuais", order: 5, youtubeId: DEFAULT_YOUTUBE_ID },
        ],
    },
    {
        title: "Cultura de Alta Performance",
        order: 4,
        lessons: [
            { title: "Mentalidade de dono: tratar a conta do cliente como se fosse sua", order: 1, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Foco em resultado: como medimos performance", order: 2, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Resiliência e solução de problemas: como lidar com situações de crise", order: 3, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Celebrando conquistas: valorizamos cada meta batida em equipe", order: 4, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Fundamentos do Trabalho da Value", order: 5, youtubeId: DEFAULT_YOUTUBE_ID },
        ],
    },
    {
        title: "Fundamentos do Trabalho da Value",
        order: 5,
        lessons: [
            { title: "O que entregamos aos clientes", order: 1, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Como lidar com clientes no dia a dia", order: 2, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Check-ins, reuniões e feedbacks", order: 3, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Relatórios quinzenais e mensais", order: 4, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Postura em situações difíceis (quedas de vendas, atrasos, reclamações)", order: 5, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "Pós-venda e fidelização do cliente", order: 6, youtubeId: DEFAULT_YOUTUBE_ID },
        ],
    },
    {
        title: "Gestor x Analista",
        order: 6,
        lessons: [
            { title: "1- O que é ser Gestor de E-commerce na agência", order: 1, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "2- Diferença entre Gestor x Analista", order: 2, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "3- Responsabilidades, limites e rotina de um gestor", order: 3, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "4- Navegação no painel da Shopee", order: 4, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "5- Padrão de anúncios e títulos da Value", order: 5, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "6- Erros comuns em anúncios", order: 6, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "7- Oferta Relâmpago e seus riscos", order: 7, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "8- Cupons e Leve Mais por Menos", order: 8, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "9- ChatGPT ou IAs... Quando e como usá-las a seu favor", order: 9, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "10- Duplicações de anúncios... Estratégico", order: 10, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "11- Métricas das informações gerenciais (Como analisar)", order: 11, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "12- Utilize a \"Batata quente\" quando necessário", order: 12, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "13- Papel do gestor na comunicação", order: 13, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "14- Linguagem e escrita profissional", order: 14, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "15- Pedindo fotos e informações ao cliente", order: 15, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "16- Interpretando demandas", order: 16, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "17- Como delegar demandas (Analista)", order: 17, youtubeId: DEFAULT_YOUTUBE_ID },
            { title: "18- Como \"cobrar\" o cliente da melhor forma", order: 18, youtubeId: DEFAULT_YOUTUBE_ID },
        ],
    },
]

async function upsertUser(params: { email: string; name: string; role: Role; password: string }) {
    const passwordHash = await bcrypt.hash(params.password, 10)

    return prisma.user.upsert({
        where: { email: params.email },
        update: {
            name: params.name,
            role: params.role,
            password: passwordHash,
        },
        create: {
            email: params.email,
            name: params.name,
            role: params.role,
            password: passwordHash,
        },
    })
}

async function upsertCourseWithContent(params: {
    slug: string
    title: string
    description: string
    coverImage: string
    audience: CourseAudience
    modulesData: SeedModule[]
}) {
    const course = await prisma.course.upsert({
        where: { slug: params.slug },
        update: {
            title: params.title,
            description: params.description,
            coverImage: params.coverImage,
            audience: params.audience,
            published: true,
        },
        create: {
            slug: params.slug,
            title: params.title,
            description: params.description,
            coverImage: params.coverImage,
            audience: params.audience,
            published: true,
        },
    })

    for (const moduleData of params.modulesData) {
        const existingModule = await prisma.module.findFirst({
            where: { courseId: course.id, order: moduleData.order },
        })

        const currentModule = existingModule
            ? await prisma.module.update({
                where: { id: existingModule.id },
                data: {
                    title: moduleData.title,
                    order: moduleData.order,
                },
            })
            : await prisma.module.create({
                data: {
                    title: moduleData.title,
                    order: moduleData.order,
                    courseId: course.id,
                },
            })

        for (const lessonData of moduleData.lessons) {
            const slug = `${params.slug}-${moduleData.order}-${lessonData.order}`

            await prisma.lesson.upsert({
                where: { slug },
                update: {
                    title: lessonData.title,
                    order: lessonData.order,
                    youtubeVideoId: lessonData.youtubeId,
                    moduleId: currentModule.id,
                },
                create: {
                    title: lessonData.title,
                    slug,
                    order: lessonData.order,
                    youtubeVideoId: lessonData.youtubeId,
                    moduleId: currentModule.id,
                },
            })
        }
    }

    return course
}

async function enroll(userId: string, courseId: string) {
    await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { status: "ACTIVE" },
        create: {
            userId,
            courseId,
            status: "ACTIVE",
        },
    })
}

async function main() {
    const adminUser = await upsertUser({
        email: process.env.ADMIN_EMAIL || "dev@value.com",
        name: process.env.ADMIN_NAME || "Dev Value",
        role: "ADMIN",
        password: process.env.ADMIN_PASSWORD || "dev1234",
    })

    const managerUser = await upsertUser({
        email: "gestor@value.com",
        name: "Gestor Value",
        role: "GESTOR",
        password: "gestor123",
    })

    const sellerUser = await upsertUser({
        email: "vendedor@value.com",
        name: "Vendedor Value",
        role: "VENDEDOR",
        password: "vendedor123",
    })

    await prisma.course.deleteMany({
        where: {
            slug: { not: SHARED_COURSE_SLUG },
        },
    })

    const sharedCourse = await upsertCourseWithContent({
        slug: SHARED_COURSE_SLUG,
        title: "Conheça a empresa",
        description: "Curso completo para conhecer a empresa, com todos os módulos e aulas.",
        coverImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
        audience: "GESTOR",
        modulesData: COURSE_ONE_MODULES,
    })

    await enroll(managerUser.id, sharedCourse.id)
    await enroll(sellerUser.id, sharedCourse.id)
    await enroll(adminUser.id, sharedCourse.id)

    console.log(`Admin: ${adminUser.email} / dev1234`)
    console.log(`Gestor: ${managerUser.email} / gestor123`)
    console.log(`Vendedor: ${sellerUser.email} / vendedor123`)
    console.log("Seed concluído com curso único.")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (error) => {
        console.error(error)
        await prisma.$disconnect()
        process.exit(1)
    })
