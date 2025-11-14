# Sitemap Monitor

A website sitemap monitoring platform built with Next.js 14, T3 Stack, and TypeScript.

## Features

- Monitor website sitemaps for new content
- Automatic discovery of new URLs
- Extract metadata (Title, Description, Keywords, H1)
- Filtering, search, and export capabilities
- Password-protected access
- Scheduled monitoring with Vercel Cron

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **API**: tRPC
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct PostgreSQL connection (for migrations)
- `ADMIN_PASSWORD`: Password to access the application
- `CRON_SECRET`: Secret for protecting cron endpoints

4. Set up the database:

```bash
npm run db:push
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
sitemap-monitor/
├── prisma/              # Database schema
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   ├── server/         # Server-side code
│   │   ├── api/       # tRPC routers
│   │   └── services/  # Business logic
│   ├── styles/        # Global styles
│   └── trpc/          # tRPC client setup
└── public/            # Static assets
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## Deployment

The application is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

## License

MIT
