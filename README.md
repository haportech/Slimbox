# Slimbox

Slimbox is an **Industrial-Brutalist** Next.js proxy designed to seamlessly compress your LLM prompts before they hit your final provider (like OpenRouter). By stripping out conversational fillers, collapsing whitespace, and providing a clean hook into external context-compression engines (like Headroom), Slimbox actively reduces your token footprint and latency in real-time.

## Features

- **Real-Time Token Compression:** Automatically collapses redundant whitespace and strips conversational fillers from incoming messages.
- **Headroom Engine Integration:** Built-in support for forwarding prompts to the Headroom API for advanced algorithmic compression.
- **SQLite Analytics:** Asynchronously logs original vs. compressed prompt sizes, tracking your cumulative savings.
- **Stark, Fast UI:** A no-nonsense, OLED-optimized dashboard built with Tailwind CSS, shadcn/ui, and Fira Code typography.
- **Drop-In Compatibility:** Fully compatible with OpenAI API structures. Just point your AI agent or CLI (like Hermes) to `http://localhost:3000/api/proxy/v1` and you're set.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Configure your target:**
   Open [http://localhost:3000/settings](http://localhost:3000/settings) to inject your OpenRouter or Headroom keys.

4. **Connect your agent:**
   Point your CLI or AI workspace's base URL to `http://localhost:3000/api/proxy/v1`. Slimbox will instantly intercept, compress, and forward all chat completion payloads.

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS
- `better-sqlite3` (for session logging)
- `diff` (for granular prompt difference visualization)

## Security

Slimbox operates purely locally by default. Your API keys are strictly persisted to your local SQLite WAL-enabled database and are never transmitted anywhere except directly to your designated upstream LLM or compression provider.
