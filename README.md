# NexusFlow

**Open-Source Workflow Automation Platform with AI Agent Capabilities**

NexusFlow is a visual workflow automation platform with 50+ integration nodes and built-in AI capabilities. Build complex automations by connecting your favorite tools with a drag-and-drop interface, schedule recurring jobs, and let AI handle the rest.

## Features

- **Visual Workflow Builder** -- Drag-and-drop workflow editor built on React Flow
- **50+ Integration Nodes** -- Connect tools, APIs, databases, and services
- **AI Agent Nodes** -- Embed OpenAI-powered agents directly into workflows
- **Scheduled Execution** -- Cron-based scheduling with node-cron
- **Background Job Queue** -- BullMQ-powered job processing with Redis
- **Execution History** -- Track and debug workflow runs with detailed logs
- **Email Notifications** -- Built-in email sending via Nodemailer
- **Rate Limiting** -- Upstash-powered API rate limiting
- **Template Library** -- Pre-built workflow templates for common use cases
- **Dark Mode** -- Full dark/light theme support via next-themes

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Workflow Editor:** React Flow
- **AI:** OpenAI API
- **Queue:** BullMQ + ioredis
- **Database:** PostgreSQL via Drizzle ORM
- **Auth/Storage:** Supabase (SSR)
- **Caching:** Upstash Redis
- **Styling:** Tailwind CSS, Radix UI, shadcn/ui
- **State Management:** Zustand
- **Validation:** Zod + React Hook Form
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis instance
- Supabase project

### Installation

```bash
git clone <repository-url>
cd nexusflow
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgres_url
UPSTASH_REDIS_URL=your_redis_url
OPENAI_API_KEY=your_openai_key
```

### Development

```bash
npm run dev          # Start the app
npm run worker       # Start background worker
npm run db:push      # Push schema to database
npm run seed         # Seed sample data
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── page.tsx               # Landing page
│   └── (dashboard)/
│       ├── workflows/         # Workflow builder & list
│       └── executions/        # Execution history
├── components/                # UI components (Radix UI-based)
└── lib/
    ├── db/                    # Drizzle ORM schema & queries
    └── queue/                 # BullMQ worker & job definitions
```

## License

MIT
