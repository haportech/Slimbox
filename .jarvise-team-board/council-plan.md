# Slimbox - Council Plan

## CEO Founder (Scope)
- **Vision:** A developer dashboard wrapping Headroom's context compression pipeline. Gives real-time visibility into token savings, routing decisions, and session history.
- **Core MVP Features:** 
  1. API Proxy to intercept, compress, and forward LLM requests.
  2. Local SQLite tracking of cost savings, latency, and compression ratios.
  3. Real-time dashboard showing exactly what the agent reads, what gets compressed, and the cost differential.
- **Out of Scope for MVP:** Multi-tenant auth, remote database scaling, complex user management.

## Designer (UX/UI Structure)
- **Aesthetic:** Industrial-Brutalist. Dark mode by default, raw borders, high contrast monospace fonts, harsh shadows.
- **Layout:**
  - **Sidebar:** Navigation (Dashboard, Session History, Settings).
  - **Main Area (Dashboard):** KPI Cards at top (Tokens Saved, % Compression, Latency Overhead, Est. Dollars Saved).
  - **Live Feed Area:** Scrolling terminal-like feed of routing decisions.
- **Empty States:** "No sessions intercepted yet. Point your agent's API URL to `localhost:3000/api/proxy` to begin."
- **Errors:** Hard-edged toast notifications with monospace error traces.

## Engineer (Architecture & Edge Cases)
- **Stack:** Next.js (App Router), Tailwind CSS, shadcn/ui, better-sqlite3.
- **Proxy Implementation:** Next.js Route Handler (`/api/proxy/[...path]`) to intercept OpenAI-compatible requests, run compression (simulate Headroom pipeline for MVP), and forward to real LLM.
- **Database Schema:** `sessions` table (original_tokens, compressed_tokens, latency_ms, status), `requests` table (payload diffs, routing decisions).
- **Edge Cases:**
  - Streaming responses: Need to proxy SSE streams correctly.
  - Headroom failure: Fallback to direct pass-through if compression fails.
  - Large payloads: Handle memory limits with sqlite streams if necessary.
- **Architecture Diagram:** See `architecture.md`.
