# Second Brain Application

A comprehensive, monetized SaaS application designed to help users organize their tasks, ideas, projects, and thoughts. Powered by the Vercel AI SDK and DeepSeek, it acts as an intelligent "Second Brain," mapping out sprawling projects and processing complex decisions via a token-gated context window model.

## Core Architecture & Stack

- **Framework**: Next.js (App Router)
- **UI & Styling**: React, Tailwind CSS, Shadcn UI, Framer Motion
- **Database Layer**: PostgreSQL, Prisma ORM
- **Authentication**: Better Auth (Email/Password + GitHub, Google, Discord OAuth)
- **AI Integration**: Vercel AI SDK connected to DeepSeek
- **Monetization**: Stripe Checkout, Billing Portal, Webhooks, Token Rolling Window Quotas

## Key Features

- **Conversational Interface**: Users build their projects and tasks by chatting with an AI agent.
- **Projects & Kanban**: Projects hold tasks and items, represented in clean, drag-and-drop structures.
- **Tiered Quota System**:
  - Free: Lifetime token allowance (hard-capped).
  - Pro/Ultra: Rolling 8-hour token limits that automatically reset.
- **Stripe Synchronized**: Accurate, webhook-driven subscription tracking synced locally to the Prisma database.
- **Minimalist Aesthetic**: Professional, monochrome design language with focused feedback.

---

## Local Setup Instructions

### 1. Requirements

- Node.js (v18+)
- PostgreSQL database
- A Stripe account
- DeepSeek API key (or alternative LLM compatible with Vercel AI SDK)
- OAuth credentials (if utilizing Social Logins)

### 2. Clone and Install Dependencies

```bash
git clone <repository-url>
cd brain-app
npm install
```

### 3. Environment Variables Configuration

Copy the sample environment file to create your local `.env`.

```bash
cp .env.example .env
```

Set the variables according to your services:

```env
# Database Configuration
DATABASE_URL="postgres://user:password@localhost:5432/db_name"

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Key
DEEPSEEK_API_KEY="sk-..."

# Better Auth Keys
BETTER_AUTH_SECRET="your-secure-random-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Social Authentication Providers (Optional, leave blank if strictly using email)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# Stripe Billing Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ULTRA_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 4. Database Setup

Ensure your PostgreSQL instance is running. Then push the current Prisma schema into your database and generate the Prisma client.

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Running the Application

Boot up the development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## Testing Billing Locally

Because the platform relies on physical Stripe webhook events to upgrade users and reset their limits, you will need the Stripe CLI running locally to capture those events.

1. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli).
2. Authenticate the CLI with your account:
   ```bash
   stripe login
   ```
3. Begin forwarding webhooks to your local API endpoint:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```
4. Find the `whsec_...` key printed in the terminal output from the `listen` command, and place it into your `.env` as `STRIPE_WEBHOOK_SECRET`.

You can now use Stripe's test credit cards in the `/profile` checkout flow and watch Stripe immediately update your local user limits.

---

## Project Structure

- `/app` - Next.js App Router views, Layouts, and standard API endopints (`/api/chat`, etc.)
- `/app/api/billing` - Stripe Webhook, Checkout, and Portal routing
- `/components/chat` - Chat UI layout including Sidebar, Area, Inputs, and token/quota banners
- `/components/tasks` - The client views for Projects, Kanban, and generated Knowledge items
- `/components/ui` - Shadcn UI functional components
- `/lib` - Core business utilities (`auth.ts`, `prisma.ts`, `stripe.ts`, and core limits configured in `quota.ts`)
- `/prisma` - Database schema definitions
