import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { TaskType } from "@google/generative-ai";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  modelName: "text-embedding-004",
  taskType: TaskType.RETRIEVAL_QUERY,
});

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: "gemini-2.5-flash-lite",
  temperature: 0.2,
});

export async function POST(req: Request) {
  try {
    const { question, namespace, docId } = await req.json();

    if (!question || !namespace || !docId) {
      return NextResponse.json(
        { error: "Missing question, namespace, or docId" },
        { status: 400 }
      );
    }

    console.log(`[CHAT] Querying namespace: ${namespace} for docId: ${docId}`);

    const index = pinecone.Index(process.env.PINECONE_INDEX!);
    
    // Initialize PineconeStore from existing index
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace,
      textKey: "text",
    });

    // Perform similarity search with filter
    // NOTE: LangChain PineconeStore doesn't always handle filters perfectly in all versions
    // but we'll try the standard filter approach.
    const results = await vectorStore.similaritySearch(question, 4, {
      documentId: docId
    });

    if (results.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any relevant information in the knowledge base to answer that question."
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
      answer: response.content
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process chat request";
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: message },
      { status: 500 }
    );
  }
}
