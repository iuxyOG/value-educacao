import { DefaultSession } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

type AppRole = "ADMIN" | "GESTOR" | "VENDEDOR" | "STUDENT"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: AppRole
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id?: string
        role?: AppRole
    }
}
