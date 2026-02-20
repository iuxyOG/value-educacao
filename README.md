# Value Educacao

Aplicacao Next.js (App Router) com autenticacao via NextAuth e banco via Prisma.

## Requisitos

- Node.js 20+
- Banco PostgreSQL (Railway)

## Variaveis de ambiente

Use `.env.example` como base e configure no Railway:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL` (URL publica da app, ex: `https://seu-app.up.railway.app`)
- `RESEND_API_KEY` (se usar envio de email)
- `EMAIL_FROM`
- `ADMIN_EMAIL`

## Desenvolvimento local

```bash
npm install
npm run db:push
npm run dev
```

## Validacoes

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy no Railway

1. Conecte o repositorio no Railway.
2. Defina as variaveis de ambiente.
3. O arquivo `railway.json` ja executa no start:
   - `npm run db:push && npm run start`
4. Deploy.

## Scripts uteis

- `npm run db:push`: aplica o schema Prisma no banco configurado.
- `npm run typecheck`: checagem TypeScript.
- `npm run lint`: checagem ESLint.
