import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// E-mails de teste que versões antigas do seed criavam com senha fixa
// (gestor123 / vendedor123 / dev1234). Rode este script uma vez no banco de
// produção para removê-los. A conta ADMIN configurada via ADMIN_EMAIL é preservada.
//
// Uso (dry-run por padrão; só lista o que seria removido):
//   npx tsx prisma/cleanup-test-users.ts
// Para remover de fato:
//   CONFIRM_CLEANUP=yes npx tsx prisma/cleanup-test-users.ts
//
// ATENÇÃO: apagar um usuário remove em cascata enrollments, progresso, notas,
// quizzes, certificados, posts, comentários e curtidas desse usuário.
const TEST_EMAILS = ["gestor@value.com", "vendedor@value.com", "dev@value.com"]

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL
    const emails = TEST_EMAILS.filter((email) => email !== adminEmail)

    const users = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { email: true, role: true },
    })

    if (users.length === 0) {
        console.log("[cleanup] Nenhuma conta de teste encontrada. Nada a fazer.")
        return
    }

    console.log("[cleanup] Contas de teste encontradas:")
    users.forEach((u) => console.log(`  - ${u.email} (${u.role})`))

    if (process.env.CONFIRM_CLEANUP !== "yes") {
        console.log("\n[cleanup] DRY-RUN — nenhuma conta foi removida.")
        console.log("[cleanup] Para remover de fato, rode com CONFIRM_CLEANUP=yes:")
        console.log("  CONFIRM_CLEANUP=yes npx tsx prisma/cleanup-test-users.ts")
        return
    }

    const result = await prisma.user.deleteMany({ where: { email: { in: emails } } })
    console.log(`\n[cleanup] Removidos ${result.count} usuário(s) de teste.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (error) => {
        console.error("[cleanup] erro:", error)
        await prisma.$disconnect()
        process.exit(1)
    })
