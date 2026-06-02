import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { getQueryEmbeddings } from "@/lib/embeddings";
import { configDotenv } from "dotenv";
configDotenv();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

export async function POST(req: Request) {
  try {
    const { question, namespace, docId, googleApiKey: rawGoogleApiKey } = await req.json();
    const googleApiKey =
      typeof rawGoogleApiKey === "string" ? rawGoogleApiKey.trim() : "";

    if (!question || !namespace || !docId) {
      return NextResponse.json(
        { error: "Missing question, namespace, or docId" },
        { status: 400 },
      );
    }
    if (!googleApiKey) {
      return NextResponse.json(
        { error: "Gemini API key is required for chat" },
        { status: 400 },
      );
    }

    const pinecone = new Pinecone({
      apiKey: requireEnv("PINECONE_API_KEY"),
    });

    const model = new ChatGoogleGenerativeAI({
      apiKey: googleApiKey,
      model: "gemini-3.1-flash-lite-preview",
      temperature: 0.2,
    });

    console.log(`[CHAT] Querying namespace: ${namespace} for docId: ${docId}`);

    const index = pinecone.Index(requireEnv("PINECONE_INDEX"));

    // Initialize PineconeStore from existing index
    const vectorStore = await PineconeStore.fromExistingIndex(getQueryEmbeddings(googleApiKey), {
      pineconeIndex: index,
      namespace,
      textKey: "text",
    });

    // Perform similarity search with filter
    // NOTE: LangChain PineconeStore doesn't always handle filters perfectly in all versions
    // but we'll try the standard filter approach.
    const results = await vectorStore.similaritySearch(question, 4, {
      documentId: docId,
    });

    if (results.length === 0) {
      return NextResponse.json({
        answer:
          "I couldn't find any relevant information in the knowledge base to answer that question.",
      });
    }

    const contextText = results.map((r) => r.pageContent).join("\n\n");

    const prompt = `You are a helpful AI assistant specialized in answering questions about a website's content.
Using the following context retrieved from the website, please answer the user's question accurately and concisely.
If the context doesn't contain the information needed to answer, honestly say you don't know based on the provided content.

Context:
${contextText}

Question:
${question}

Answer:`;

    const response = await model.invoke(prompt);

    return NextResponse.json({
      answer: response.content,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process chat request";
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: message },
      { status: 500 },
    );
  }
}
