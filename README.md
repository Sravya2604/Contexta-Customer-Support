# Contexta — AI Customer Support with Persistent Memory

Contexta is an AI-powered customer support platform that gives support agents durable memory across every conversation. Customers explain their problem once; Contexta remembers and provides increasingly contextual, personalized support.

## How It Works

1. **Customer reaches out** — A customer starts a conversation through the workspace
2. **Contexta recalls memory** — Before responding, the agent queries Hindsight for everything it knows about this customer
3. **Agent responds with context** — The response references past issues, environment, and preferences
4. **Memory persists** — New facts from the conversation are retained for next time

## Architecture

```
Frontend (Vite + React + Tailwind)
    ↓ fetch
Edge Function (Supabase Deno)
    ├── Anthropic LLM (Claude) — agent reasoning
    ├── Hindsight Memory — retain/recall/reflect
    └── Supabase DB — customers, tickets, conversations, messages, outcomes
```

### Data Separation
- **Application Data** (Supabase): customers, tickets, conversations, messages, outcomes
- **Agent Memory** (Hindsight): durable facts about each customer — environment, preferences, previous issues, solutions

## Pages

- **Landing** (`/`) — Hero, problem statement, how it works, feature overview
- **Workspace** (`/workspace`) — 3-column agent workspace (inbox, conversation, context panel)
- **Customers** (`/customers`) — Customer list with stats
- **Customer Profile** (`/customers/:id`) — Timeline, tickets, and memory history
- **Dashboard** (`/dashboard`) — Real-time metrics from app data
- **Memory Insights** (`/memory`) — Every memory retained and recalled
- **Demo** (`/demo`) — Guided demo with memory ON/OFF toggle
- **Search** (`/search`) — Global search across customers and tickets

## Demo Flow

1. Visit `/demo` for the guided experience
2. Meet Priya Sharma — she has 2 previous resolved issues
3. Send: "I'm having trouble uploading a document again."
4. With Memory ON: the agent recalls her previous PDF upload issue (Windows 11, Chrome, app update solved it)
5. Toggle Memory OFF: same message → agent asks generic questions
6. Toggle Memory ON: response improves immediately with recalled context

## Tech Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, Lucide React icons
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI**: Anthropic Claude (agent reasoning)
- **Memory**: Hindsight persistent memory (per-customer memory banks)
