import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { PineconeStore } from "@langchain/pinecone";

/** Pinecone metadata size limit per vector (40 KB). Use a safe value to leave headroom. */
const PINECONE_METADATA_LIMIT_BYTES = 40000;

/** Max lengths for string metadata fields to avoid oversized metadata. */
const MAX_METADATA_STRING_LENGTHS: Record<string, number> = {
  url: 2000,
  title: 1000,
};

/**
 * Returns a copy of metadata that fits within Pinecone's size limit when combined with
 * the reserved payload (e.g. the "text" field + chunk content added by PineconeStore).
 * Truncates or omits string values as needed.
 */
function capMetadataSize(
  metadata: Record<string, unknown>,
  reservedBytes: number
): Record<string, unknown> {
  const limit = PINECONE_METADATA_LIMIT_BYTES - reservedBytes;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      const maxLen = MAX_METADATA_STRING_LENGTHS[key];
      result[key] =
        maxLen != null && value.length > maxLen
          ? value.slice(0, maxLen) + "…"
          : value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    } else if (Array.isArray(value) && value.every((el) => typeof el === "string")) {
      result[key] = value;
    }
  }

  let serialized = JSON.stringify(result);
  while (Buffer.byteLength(serialized, "utf8") > limit) {
    const stringKeys = Object.keys(result).filter(
      (k) => typeof result[k] === "string"
    ) as string[];
    if (stringKeys.length === 0) break;
    const byLength = stringKeys
      .map((k) => ({ key: k, len: (result[k] as string).length }))
      .sort((a, b) => b.len - a.len);
    const { key } = byLength[0];
    const str = result[key] as string;
    const next =
      str.length <= 1 ? "" : str.slice(0, Math.floor(str.length / 2)) + "…";
    if (next === "") delete result[key];
    else result[key] = next;
    serialized = JSON.stringify(result);
  }

  return result;
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX!);

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  modelName: "text-embedding-004",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
});

export async function ingestContent(
  text: string,
  metadata: { url: string; title: string; length: number; documentId: string },
  namespace: string
) {
  try {
    console.log(`[VECTOR-STORE] Initializing text splitter (800/100) for documentId: ${metadata.documentId}`);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });

    const doc = new Document({
      pageContent: text,
      metadata,
    });

    console.log(`[VECTOR-STORE] Splitting document into chunks...`);
    const rawChunks = await splitter.splitDocuments([doc]);

    // Cap each chunk's metadata so total (metadata + text) stays under Pinecone's 40KB limit
    const chunks = rawChunks.map((chunk) => {
      const reservedBytes = Buffer.byteLength(
        JSON.stringify({ text: chunk.pageContent }),
        "utf8"
      );
      const cappedMetadata = capMetadataSize(
        chunk.metadata as Record<string, unknown>,
        reservedBytes
      );
      return new Document({
        pageContent: chunk.pageContent,
        metadata: cappedMetadata,
      });
    });

    console.log(`[VECTOR-STORE] Ingesting ${chunks.length} chunks into namespace: ${namespace}`);

    // LangChain's PineconeStore provides a high-level API for upserting
    console.log(`[VECTOR-STORE] Starting Pinecone upsert for namespace: ${namespace}...`);
    await PineconeStore.fromDocuments(chunks, embeddings, {
      pineconeIndex: index,
      namespace,
      textKey: "text",
    });
    console.log(`[VECTOR-STORE] Pinecone upsert completed successfully.`);

    return { success: true, chunkCount: chunks.length };
  } catch (error) {
    console.error("Ingestion error:", error);
    throw error;
  }
}
