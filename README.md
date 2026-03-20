# EduNationUz 🎓

EduNationUz is a premium online education platform built with modern web technologies. This repository contains the full source code for the platform, including student portals, an instructor dashboard, an admin control suite, intelligent AI tutoring, and integrated payment gateways.

## 🚀 Tech Stack & Core Libraries

- **Framework:** [Next.js 16.1.6](https://nextjs.org/) (App Router, Turbopack)
- **UI & Components:** React 19, Custom CSS Modules (Vanilla CSS) for a premium, responsive look.
- **Database ORM:** [Prisma](https://www.prisma.io/) (Current Database: SQLite for local dev, easily swappable to PostgreSQL/MySQL via `DATABASE_URL`)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (v4)
- **Video Streaming:** [Mux](https://mux.com/) (using `@mux/mux-node` & `@mux/mux-player-react`)
- **AI Integration:** [Google Gemini](https://ai.google.dev/) (using `@ai-sdk/google` & `ai` package)
- **Emails:** [Resend](https://resend.com/) for transactional emails (welcome, receipts, password resets)
- **Payments:** Local multi-gateway support (Stripe, Payme, Click integrated via webhooks)
- **PDF Generation:** `jspdf` & `html2canvas` for dynamic course certificates.

## ✨ Key Features

1. **Comprehensive Authentication:**
   - Email/Password with integrated Forgot/Reset Password flows (using secure hashed tokens).
   - Phone OTP Auth capabilities.
   - OAuth providers: Google, GitHub, and Telegram OAuth via bot.
2. **Dynamic Course & Lesson Viewer:**
   - Seamless video playback via Mux.
   - Automatic student progress tracking (marks lessons completed upon finishing videos).
3. **Advanced AI Tutor:**
   - Context-aware Retrieval-Augmented Generation (RAG) assistant for courses.
   - Multimodal inputs (file/image understanding) and Voice-to-text integration.
4. **Admin & Instructor Dashboards:**
   - Full control suite for managing platform courses, students, and subscriptions.
   - Dynamic management of standalone "Expert Sessions" with automated n8n workflows for Google Meet link generation.
5. **Multi-Gateway Payment Webhooks:**
   - Handles localized payments efficiently and dynamically updates the database for both standalone purchases and platform subscriptions.

## 🛠️ Getting Started Locally

### 1. Prerequisites
- Node.js (v20+ recommended)
- `npm` or `yarn`

### 2. Installation
Clone this repository and install the dependencies:
```bash
npm install
```

### 3. Environment Variables
You will need an environment file to run the project. Copy `.env.example` to `.env.local` (and/or `.env`) and populate the missing secrets.

```bash
cp .env.example .env.local
```

**Crucial Variables for Local Dev:**
- `DATABASE_URL` (e.g., `"file:./dev.db"`)
- `NEXTAUTH_SECRET` (generate using `openssl rand -base64 32`)
- `NEXTAUTH_URL` (Usually `http://localhost:3000` OR your `ngrok` URL if testing webhooks)
- `RESEND_API_KEY` (for email functionality)
- `MUX_TOKEN_ID` & `MUX_TOKEN_SECRET` (for video loading)
- `GOOGLE_GENERATIVE_AI_API_KEY` (for the AI Tutor)

### 4. Database Initialization
Push the Prisma schema to your local SQLite database and generate the Prisma Client:
```bash
npx prisma generate
npx prisma db push
```
*(Optional) Seed the database with initial test data:*
```bash
npm run db:seed
```

### 5. Start the Development Server
```bash
npm run dev
```
The platform will automatically start on `http://localhost:3000`.

---

## 🔗 Testing Webhooks (Crucial For Developers)

Important platform features rely heavily on server-to-server callbacks (e.g., Payment Confirmations, n8n Expert Session automation, and Telegram Auth). 

If you need to test these features locally, **you must expose your local server to the internet using a tool like ngrok or Cloudflare Tunnels.**

1. Run ngrok on port 3000:
   ```bash
   ngrok http 3000
   ```
2. Update your `.env.local` and `.env` `NEXTAUTH_URL` to match the exact ngrok HTTPS URL:
   ```env
   NEXTAUTH_URL=https://<your-ngrok-id>.ngrok-free.dev
   ```
3. Update your callback URLs in Google Console, GitHub settings, and Webhook dashboards to match the ngrok URL.
4. **Restart the Next.js API server** for the new environment domain to be registered properly by NextAuth. All cross-origin fetch errors on login usually stem from a mismatch in this URL.

## 📁 Repository Structure

- `/src/app/` - Next.js App Router (Pages, API Routes, Layouts)
  - `/api/` - Backend endpoints, webhook handlers (`/payme`, `/stripe`), and auth endpoints.
  - `/(dashboard)/` - Protected dashboard layouts and views for Admins & Instructors.
- `/src/components/` - Reusable React components (UI elements, modals, course cards).
- `/src/lib/` - Shared utilities (Prisma client instantiation, Resend email functions, formatting).
- `/prisma/` - Database schema definition (`schema.prisma`) and migrations.

## 📝 Recent Implementation Notes (Handoff)

- The **Forgot Password Flow** has just been successfully implemented from backend to frontend. Ensure `email.ts` is saved using `UTF-8` encoding.
- **Admin global controls** and subscription overrides are operational in the Admin dashboard.
- If encountering a `[CLIENT_FETCH_ERROR] "Failed to fetch"` error on the login screen, it strictly means you opened `localhost` in your browser while `NEXTAUTH_URL` inside `.env` was set to an `ngrok` domain. Always open the exact domain string specified in `NEXTAUTH_URL`.
