import { z } from "zod";

// Apenas o que o runtime da app realmente precisa é obrigatório. As demais
// (email/admin) são usadas por scripts de seed e ficam opcionais aqui.
const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().optional(),
    ADMIN_EMAIL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
