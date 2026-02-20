import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(1),
    // AUTH_URL: z.string().url().optional(), // Optional in Vercel/Railway
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().email().optional(),
    ADMIN_EMAIL: z.string().email(),
});

export const env = envSchema.parse(process.env);
