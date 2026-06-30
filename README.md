# Headroom Console

Open-source web dashboard for [Headroom](https://github.com/headroomlabs-ai/headroom) — visualize context compression, CCR cache, token savings, and more.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## What is Headroom?

[Headroom](https://github.com/headroomlabs-ai/headroom) is an open-source LLM context optimization layer that reduces token usage and cost through intelligent compression, caching, and content routing. It runs as a local proxy between your application and LLM providers (Anthropic, OpenAI, etc.).

**Headroom Console** gives you a visual dashboard to monitor and understand what Headroom is doing — how many tokens it's saving, which compression strategies are working best, cache hit rates, per-project breakdowns, and more.

## Features

- **Dashboard** — Real-time overview of token savings, cost reduction, compression trends, and request breakdown
- **Request Explorer** — Inspect individual compression requests with before/after token comparison, model/project filtering, and compression distribution charts
- **Cache & Compression** — Compression cache hit/miss rates, prefix cache analytics, strategy distribution, TTL bucket analysis
- **Transform Analysis** — Compare compression strategies (SmartCrusher, ContentRouter, ML Compressor, etc.) with radar charts and content type coverage
- **Projects & Agents** — Per-project and per-model savings breakdown
- **Settings** — Configure proxy connection with live health status display
- **Demo Mode** — Works without a running Headroom proxy using realistic mock data, auto-switches to live data when proxy is detected
- **Dark Theme** — Built with dark-first design

## Quick Start

### Prerequisites

- Node.js 18+
- (Optional) A running [Headroom proxy](https://github.com/headroomlabs-ai/headroom) at `localhost:8787`

### Install & Run

```bash
git clone https://github.com/tingfengyinyue/headroom-console.git
cd headroom-console
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> If no Headroom proxy is running, the console automatically displays demo data. Once a proxy is detected, it switches to live mode with 5-second polling.

### Docker

```bash
docker compose up -d
```

The console will be available at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_HEADROOM_URL` | `http://localhost:8787` | URL of the Headroom proxy to connect to |

Copy `.env.example` to `.env.local` to customize:

```bash
cp .env.example .env.local
```

You can also change the proxy URL at runtime from the Settings page.

### Docker Environment

When running in Docker, use `host.docker.internal` to connect to a proxy running on the host:

```yaml
environment:
  - NEXT_PUBLIC_HEADROOM_URL=http://host.docker.internal:8787
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Headroom Console (Web)              │
│  ┌───────────────────────────────────────────┐  │
│  │         Next.js + React Frontend          │  │
│  │   shadcn/ui · Tailwind CSS · Recharts     │  │
│  └──────────────────┬────────────────────────┘  │
│                     │ Fetch API (5s polling)     │
│  ┌──────────────────▼────────────────────────┐  │
│  │       useHeadroom Hook + Adapters         │  │
│  │   Auto-detect: Live ↔ Demo mode           │  │
│  └──────┬───────────┬───────────┬────────────┘  │
└─────────┼───────────┼───────────┼────────────────┘
          │           │           │
          ▼           ▼           ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ /health  │ │ /stats   │ │ /stats-  │
   │          │ │          │ │  history │
   └──────────┘ └──────────┘ └──────────┘
          Headroom Proxy (port 8787)
```

### Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx            # Dashboard
│   ├── requests/page.tsx   # Request Explorer
│   ├── cache/page.tsx      # Cache & Compression analytics
│   ├── transforms/page.tsx # Transform Analysis
│   ├── projects/page.tsx   # Projects & Agents
│   └── settings/page.tsx   # Connection settings
├── components/
│   ├── app-shell.tsx       # Layout shell (sidebar + header)
│   ├── header.tsx          # Top bar with connection status
│   ├── sidebar.tsx         # Navigation sidebar
│   ├── providers.tsx       # React context (HeadroomProvider)
│   ├── stats-card.tsx      # Reusable stats card component
│   └── ui/                 # shadcn/ui components
├── hooks/
│   └── use-headroom.ts     # Core data hook (live/demo switching)
└── lib/
    ├── types.ts            # Headroom API response types
    ├── adapters.ts         # Raw API → display data transformers
    ├── mock-data.ts        # Demo mode mock data
    ├── headroom-client.ts  # API client class
    ├── format.ts           # Number/token/currency formatters
    └── utils.ts            # Utility functions (cn)
```

## Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/` | Token savings overview, trend charts (daily/weekly), request breakdown pie chart, per-project bar chart |
| Requests | `/requests` | Per-request compression details with search, model/project filtering, compression distribution histogram, request detail dialog |
| Cache | `/cache` | Compression cache hit/miss pie chart, prefix cache token bar chart, strategy distribution, token hit rate gauges, compression vs cache net benefit, TTL bucket analysis |
| Transforms | `/transforms` | Strategy comparison cards, tokens saved bar chart, performance radar chart (reduction/speed/usage), content type coverage |
| Projects | `/projects` | Per-project savings bar chart, token share pie chart, project detail tabs |
| Settings | `/settings` | Proxy URL configuration, connection test, health status display, version info |

## How It Works

1. **Auto-Detection**: On load, the console tries to connect to the configured Headroom proxy URL
2. **Live Mode**: If the proxy responds, real data is fetched from `/health`, `/stats`, and `/stats-history` endpoints every 5 seconds
3. **Demo Mode**: If no proxy is available (or the proxy has no traffic yet), realistic mock data is displayed
4. **Smart Switching**: When connected but with no traffic, the console shows demo data with a banner explaining how to route requests. Users can manually toggle between live and demo views
5. **Type-Safe Adapters**: Raw API responses are validated with type guards and transformed through adapter functions to ensure the UI never crashes on unexpected data shapes

## Headroom API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /health` | Check proxy status, version, config |
| `GET /stats` | Current session statistics (tokens, requests, cost, cache, strategies) |
| `GET /stats-history` | Historical data (daily/weekly/monthly rollups, per-project breakdown) |

## Tech Stack

- [Next.js 16](https://nextjs.org/) — React framework with App Router
- [React 19](https://react.dev/) — UI library
- [shadcn/ui](https://ui.shadcn.com/) — UI component library
- [Tailwind CSS 4](https://tailwindcss.com/) — Utility-first CSS
- [Recharts](https://recharts.org/) — Charts and data visualization
- [Lucide Icons](https://lucide.dev/) — Icon set
- [date-fns](https://date-fns.org/) — Date formatting
- [TypeScript 5](https://www.typescriptlang.org/) — Type safety

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

[MIT](LICENSE)

## Related

- [Headroom](https://github.com/headroomlabs-ai/headroom) — The LLM context optimization proxy this dashboard visualizes
- [Headroom Documentation](https://headroomlabs-ai.github.io/headroom/) — Official Headroom docs
