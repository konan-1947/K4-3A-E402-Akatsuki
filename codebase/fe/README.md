This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Backend connection

The source-selection step sends the selected files to the Spring Boot backend and polls the mental-model job.
Set `NEXT_PUBLIC_BE_URL` when the backend is not running at the default local URL:

```bash
NEXT_PUBLIC_BE_URL=http://localhost:8080 npm run dev
```

## Deploy with Coolify

Deploy this directory as a separate Nixpacks application:

- Base Directory: `codebase/fe`
- Port: `3000`
- Static site: disabled

Add `NEXT_PUBLIC_BE_URL` as a **build variable**. Next.js publishes variables
prefixed with `NEXT_PUBLIC_` into the browser bundle while it builds, so changing
the value requires a redeploy.

For the current HTTP-only backend demo, use:

```env
NEXT_PUBLIC_BE_URL=http://j88g4wcso4cs8cks84w8g0w4.103.72.56.152.sslip.io
```

The frontend and backend must use the same scheme: an HTTPS frontend cannot call
an HTTP backend. The backend must also allow the frontend domain through CORS.

Start the backend first and configure its AI keys in `codebase/be/.env`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
