# Q&A Support Bot (RAG)

A support chatbot built with **Retrieval Augmented Generation (RAG)**. Crawl a website, ingest its content into a vector store, then ask questions and get answers grounded in that knowledge.

## Demo

<video src="https://github.com/PrinceMakavana/Q-A-Support-Bot/raw/main/demo.webm" controls width="100%"></video>

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 15 (App Router)
- **AI & Embeddings:** [Google Gemini](https://ai.google.dev/) (`text-embedding-004`, `gemini-2.5-flash-lite`)
- **Orchestration:** [LangChain](https://js.langchain.com/) (text splitters, Pinecone integration)
- **Vector Store:** [Pinecone](https://www.pinecone.io/)
- **Crawling:** [Playwright](https://playwright.dev/) (JS-rendered pages)
- **UI:** React 19, Tailwind CSS 4, Lucide React, Sonner (toasts)

## Features

- **Crawl:** Enter a URL; the app uses Playwright to fetch the page (including JS-rendered content), plus optional `sitemap.xml` and `llms.txt` in parallel.
- **Ingest:** Chunk text with `RecursiveCharacterTextSplitter` (800 chars, 100 overlap), embed with Gemini, and store in Pinecone with a namespace derived from hostname + path.
- **Chat:** For each ingested site, open a chat that queries Pinecone (top 4 chunks, filtered by document ID) and answers via Gemini, strictly from retrieved context.
- **Local state:** Ingested sites and per-doc chat history are stored in `localStorage` for quick access.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home: URL input, crawl, ingest, list of ingested sites
│   ├── chat/page.tsx         # Chat UI (namespace, docId, siteName via query params)
│   └── api/
│       ├── crawl/route.ts    # POST /api/crawl — Playwright crawl + sitemap/llms.txt
│       ├── ingest/route.ts   # POST /api/ingest — chunk, embed, upsert to Pinecone
│       └── chat/route.ts     # POST /api/chat — RAG query (retrieve + Gemini)
├── components/
│   └── chat-interface.tsx    # Chat messages, input, history persistence
└── lib/
    ├── vector-store.ts      # Chunking, metadata capping, Pinecone upsert
    └── types.ts             # Shared types (e.g. ChatMessage)
```

## Getting Started

### Prerequisites

- Node.js 18+
- [Pinecone](https://www.pinecone.io/) API key and an index (e.g. 1 dimension matching `text-embedding-004`)
- [Google AI](https://ai.google.dev/) (Gemini) API key

### Installation

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` (or `.env.local`) in the project root:

   ```env
   GOOGLE_API_KEY=your_gemini_key
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_INDEX=your_index_name
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). Enter a URL, click to crawl, then ingest. Use **Chat** on an ingested site to ask questions.

### Scripts

| Command       | Description           |
|--------------|-----------------------|
| `npm run dev`   | Start Next.js dev server |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## API Overview

| Endpoint           | Method | Body (JSON)                    | Description |
|--------------------|--------|--------------------------------|-------------|
| `/api/crawl`       | POST   | `{ url: string }`              | Crawl URL with Playwright; return `{ url, title, text, length, sitemap?, llm? }`. |
| `/api/ingest`      | POST   | `{ url, title?, text, length? }` | Chunk, embed, upsert to Pinecone; return `{ namespace, docId, indexName, chunkCount }`. |
| `/api/chat`        | POST   | `{ question, namespace, docId }` | RAG: retrieve top 4 chunks (by docId), then answer with Gemini. Returns `{ answer }`. |

## Environment Variables

| Variable           | Required | Description                          |
|--------------------|----------|--------------------------------------|
| `GOOGLE_API_KEY`   | Yes      | Google AI (Gemini) API key           |
| `PINECONE_API_KEY` | Yes      | Pinecone API key                     |
| `PINECONE_INDEX`   | Yes      | Name of the Pinecone index to use    |

## License

Private — use as per your project terms.
