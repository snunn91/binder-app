# Binder

Binder is a web app for organizing a Pokemon card collection in a digital binder. Users can create binders, search cards and sets, add cards page by page, rearrange layouts with drag and drop, track collection goals, and view an estimated binder value.

## Features

- Email/password and Google sign-in with Supabase authentication
- Binder dashboard with support for multiple binder layouts and color schemes
- Drag-and-drop binder editing for arranging cards across pages
- Card search with card and set views, sorting, rarity filters, and type filters
- Support for both English and Japanese card browsing
- Bulk Box flow for staging cards before placing them into binder pages
- Goal tracking and binder progress/value summaries
- Responsive UI built for desktop and mobile use

## Tech Stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Redux Toolkit for client state
- Supabase for authentication and data storage
- Tailwind CSS 4 for styling
- Radix UI primitives for dialogs, selects, and menus
- `@dnd-kit` for drag-and-drop interactions

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project with the required auth and database setup

### Installation

```bash
npm install
```

### Environment Variables

Create a local environment file and add the public Supabase values used by the app:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Do not commit real credentials to the repository.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` starts the local development server
- `npm run build` creates a production build
- `npm run start` runs the production server
- `npm run lint` runs ESLint
- `npm run type-check` runs TypeScript checks
- `npm run ingest:expansions` imports expansion data
- `npm run ingest:jpn-expansions` imports Japanese expansion data
- `npm run ingest:cards` imports card data
- `npm run ingest:cards:expansion` imports cards by expansion
- `npm run ingest:jpn-cards` imports Japanese card data

## Project Structure

```text
src/app/                 App routes, layouts, and API handlers
src/components/          Reusable UI and binder-specific components
src/lib/                 Auth, store, Supabase clients, hooks, and utilities
src/modals/              Modal flows for binders and card management
src/config/              Binder limits, messages, and display config
scripts/                 Data ingestion scripts
public/assets/           Static images and animation assets
```

## Current Scope

Binder currently focuses on the core collection workflow:

- creating and managing binders
- adding cards from search results
- arranging cards visually across pages
- tracking goals and collection progress
- viewing estimated value totals in USD

## Deployment

The project includes a `netlify.toml` file and can be deployed to platforms that support Next.js. Before deploying, make sure the required environment variables are configured in the hosting platform.
