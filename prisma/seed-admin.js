const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME || "Administrador"

  if (!adminEmail || !adminPassword) {
    console.log(
      "[seed:admin] ADMIN_EMAIL ou ADMIN_PASSWORD ausentes. Seed de admin ignorado."
    )
    return
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: "ADMIN",
      password: passwordHash,
    },
    create: {
      name: adminName,
      email: adminEmail,
      role: "ADMIN",
      password: passwordHash,
    },
  })

  console.log(`[seed:admin] Usuario admin pronto: ${adminUser.email}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error("[seed:admin] erro:", error)
    await prisma.$disconnect()
    process.exit(1)
  })
