import { NextResponse } from "next/server";
import { configDotenv } from "dotenv";
configDotenv();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { ingestContent } = await import("@/lib/vector-store");
    const { url, title, text, length, googleApiKey: rawGoogleApiKey } = await req.json();
    const googleApiKey =
      typeof rawGoogleApiKey === "string" ? rawGoogleApiKey.trim() : "";

    if (!url || !text) {
      console.error("[INGEST] Error: URL or Text missing in request body");
      return NextResponse.json(
        { error: "URL and text are required for ingestion" },
        { status: 400 }
      );
    }
    if (!googleApiKey) {
      console.error("[INGEST] Error: Google API key missing in request body");
      return NextResponse.json(
        { error: "Gemini API key is required for ingestion" },
        { status: 400 }
      );
    }

    console.log(`[INGEST] Received request to ingest: ${url}`);

    const urlObj = new URL(url);
    const namespace = urlObj.hostname.replace(/\./g, "-") + 
                     urlObj.pathname.replace(/\//g, "-").replace(/-$/, "");

    console.log(`[INGEST] Derived Namespace: ${namespace}`);

    const docId = crypto.randomUUID();
    console.log(`[INGEST] Generated unique Document ID: ${docId}`);

    const metadata = {
      url,
      title: title || "",
      length: length || text.length,
      documentId: docId,
    };

    const textData = text + JSON.stringify(metadata);
    const result = await ingestContent(textData, metadata, namespace, googleApiKey);

    return NextResponse.json({
      namespace,
      docId,
      indexName: process.env.PINECONE_INDEX,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to ingest content";
    console.error("API Ingest error:", error);
    return NextResponse.json(
      { error: "Failed to ingest content", details: message },
      { status: 500 }
    );
  }
}
