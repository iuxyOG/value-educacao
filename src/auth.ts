
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { env } from "@/env"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Hash fixo usado apenas para igualar o tempo de resposta quando o e-mail não existe.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-attack-mitigation", 10)

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    secret: env.AUTH_SECRET,
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                })

                // Sempre executa um bcrypt.compare (contra um hash dummy quando o
                // usuário não existe) para não vazar a existência do e-mail pelo
                // tempo de resposta (enumeração de usuários por timing).
                const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH
                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    passwordHash
                )

                if (!user || !user.password || !isPasswordValid) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }
            }
        })
    ],
    pages: {
        signIn: "/login",
        // error: "/login", // Error code passed in query string as ?error=
        // verifyRequest: "/login?verifyRequest=1", // (used for check email message)
        // newUser: "/app" // New users will be directed here on first sign in
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role as "ADMIN" | "GESTOR" | "VENDEDOR" | "STUDENT"
                token.id = user.id
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = (token.role ?? "STUDENT") as "ADMIN" | "GESTOR" | "VENDEDOR" | "STUDENT"
                session.user.id = token.id as string
            }
            return session
        }
    },
    debug: process.env.NODE_ENV === "development",
})
