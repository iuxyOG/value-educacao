"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@value.com";
    // 1. Upsert Admin User
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: "ADMIN" },
        create: {
            email: adminEmail,
            name: "Admin Value",
            role: "ADMIN",
        },
    });
    console.log(`Reserved Admin: ${admin.email}`);
    // 2. Create "Value Educação" Course
    const courseSlug = "value-educacao-mvp";
    const course = await prisma.course.upsert({
        where: { slug: courseSlug },
        update: {},
        create: {
            title: "Value Educação - MVP",
            slug: courseSlug,
            description: "Curso demonstrativo da plataforma style Kiwify.",
            published: true,
            coverImage: "https://placehold.co/600x400/0B0F14/00E676?text=Value+Educacao",
        },
    });
    console.log(`Course created: ${course.title}`);
    // 3. Create Modules & Lessons
    const modulesData = [
        {
            title: "Módulo 01: Começando",
            order: 1,
            lessons: [
                { title: "Boas vindas", order: 1, youtubeId: "dQw4w9WgXcQ" },
                { title: "Visão Geral", order: 2, youtubeId: "dQw4w9WgXcQ" },
            ]
        },
        {
            title: "Módulo 02: Avançando",
            order: 2,
            lessons: [
                { title: "Setup do Projeto", order: 1, youtubeId: "dQw4w9WgXcQ" },
                { title: "Configurando Prisma", order: 2, youtubeId: "dQw4w9WgXcQ" },
            ]
        }
    ];
    for (const mData of modulesData) {
        // Check if module exists by title (simple check for seed idempotent)
        // Ideally we'd use a unique constraint or just create if course empty
        const existingModule = await prisma.module.findFirst({
            where: { courseId: course.id, title: mData.title }
        });
        let modId = existingModule === null || existingModule === void 0 ? void 0 : existingModule.id;
        if (!existingModule) {
            const mod = await prisma.module.create({
                data: {
                    title: mData.title,
                    order: mData.order,
                    courseId: course.id,
                }
            });
            modId = mod.id;
            console.log(` Created Module: ${mData.title}`);
        }
        if (modId) {
            for (const lData of mData.lessons) {
                const slug = `${courseSlug}-${mData.order}-${lData.order}`.toLowerCase().replace(/\s+/g, '-');
                await prisma.lesson.upsert({
                    where: { slug },
                    update: {},
                    create: {
                        title: lData.title,
                        slug,
                        order: lData.order,
                        youtubeVideoId: lData.youtubeId,
                        moduleId: modId
                    }
                });
            }
        }
    }
    // 4. Enroll Admin in Course
    await prisma.enrollment.upsert({
        where: {
            userId_courseId: {
                userId: admin.id,
                courseId: course.id
            }
        },
        update: {},
        create: {
            userId: admin.id,
            courseId: course.id,
            status: "ACTIVE"
        }
    });
    console.log("Seeding finished.");
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
