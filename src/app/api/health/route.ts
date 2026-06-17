import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const checks = {
    browserbase: Boolean(process.env.BROWSERBASE_API_KEY),
    pinecone: Boolean(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX),
    google: Boolean(process.env.GOOGLE_API_KEY),
  };

  const ok = checks.browserbase && checks.pinecone;

  return NextResponse.json(
    {
      ok,
      checks,
      note: checks.browserbase
        ? "Browserbase is configured for JS-rendered pages."
        : "Set BROWSERBASE_API_KEY on the server for JS-rendered sites.",
    },
    { status: ok ? 200 : 503 },
  );
}
