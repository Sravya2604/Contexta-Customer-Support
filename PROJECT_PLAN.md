# Contexta — Project Plan

## Overview
Contexta is an AI customer support platform powered by Hindsight persistent memory. Customers explain their problem once; Contexta remembers across conversations and provides increasingly contextual, personalized support.

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
- **Application Data** (Supabase): customers, tickets, conversations, messages, outcomes, agent notes
- **Agent Memory** (Hindsight): durable facts about each customer — environment, preferences, previous issues, solutions, outcomes

## Hindsight Integration

- One memory bank per customer: `customer-{customer_id}`
- `retain`: After each conversation turn, store durable facts (environment, issue, solution, outcome) with tags like `ticket-{id}`, `issue-type:upload`, `outcome:resolved`
- `recall`: Before generating a response, query Hindsight with the customer's current issue to retrieve relevant memories
- `reflect`: Used optionally for disposition-aware answers
- Memory toggle (ON/OFF): When OFF, skip recall entirely — agent behaves as if it has no history

### Memory Abstraction
`src/lib/memory.ts` — wraps HindsightClient calls with typed methods:
- `retainMemory(customerId, content, tags, context)`
- `recallMemory(customerId, query, tags)`
- `getCustomerContext(customerId)` — broad recall for profile view

## Database Schema

### customers
- id (uuid), name, email, company, product, account_status, created_at

### tickets
- id (uuid), customer_id (fk), title, category, priority, status, created_at, updated_at, resolved_at

### conversations
- id (uuid), ticket_id (fk), customer_id (fk), started_at

### messages
- id (uuid), conversation_id (fk), role (customer/agent/system), content, created_at, memory_recalled (jsonb — memories used for this response)

### outcomes
- id (uuid), ticket_id (fk), outcome (resolved/partial/unresolved/escalated), solution_summary, created_at

### memory_events
- id (uuid), customer_id (fk), event_type (retain/recall), content, tags, created_at — audit trail of memory operations for the memory analytics page

## Edge Function: `contexta-agent`

POST endpoint that receives:
- `customerId`, `conversationId`, `message`, `memoryEnabled`

Flow:
1. Fetch customer + active ticket + conversation history from Supabase
2. If memoryEnabled: recall relevant memories from Hindsight
3. Build system prompt with customer context + recalled memories + outcome history
4. Call Anthropic LLM for response
5. If memoryEnabled: retain durable facts from the conversation
6. Store agent response in messages table
7. Return: `{ response, recalledMemories, memoryRetained }`

## Frontend Pages

1. **Landing** (`/`) — hero, problem, how it works, memory demo, CTA
2. **Workspace** (`/workspace`) — 3-column agent workspace (inbox, conversation, context)
3. **Customer Profile** (`/customers/:id`) — profile, timeline, memory history
4. **Dashboard** (`/dashboard`) — metrics from real app data
5. **Demo** (`/demo`) — guided demo scenario with memory ON/OFF toggle
6. **Memory Insights** (`/memory`) — memory analytics from memory_events

## Demo Flow

1. Landing page → "Try Contexta" → Workspace
2. Select customer "Priya Sharma" who has 2 previous resolved issues
3. Start new conversation: "I'm having trouble uploading a document again"
4. Memory ON: Contexta recalls previous PDF upload issue (Windows 11, Chrome, app update solved it)
5. Agent responds with personalized context instead of asking repetitive questions
6. Memory panel shows recalled memories with animation
7. Toggle Memory OFF: same message → agent asks generic questions
8. Toggle Memory ON: response improves immediately
9. View customer profile → timeline shows all interactions

## Visual Design

- Primary: Deep blue (#1e40af) / Electric blue (#3b82f6)
- Accents: Cyan (#06b6d4), Amber (#f59e0b), Green (#10b981), Red (#ef4444)
- Clean white surface with colorful accents
- Font: Inter (system fallback)
- 8px spacing system
- Rounded cards, clear button hierarchy
- Subtle animations: memory recall pulse, typing indicator, smooth transitions

## Implementation Phases

1. Foundation: DB schema, seed data, types, design system
2. Edge function: agent orchestration with Hindsight
3. Core UI: workspace, conversation, memory panel
4. Supporting pages: landing, dashboard, customer profile, demo
5. Polish: animations, responsive, error states
6. Documentation: README, architecture docs, demo script
