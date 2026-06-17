import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import type { TaskType } from "@google/generative-ai";

const EMBEDDING_MODEL =
  process.env.GOOGLE_EMBEDDING_MODEL || "gemini-embedding-001";

class StrictGoogleGenerativeAIEmbeddings extends GoogleGenerativeAIEmbeddings {
  async embedQuery(document: string): Promise<number[]> {
    const vector = await super.embedQuery(document);
    if (vector.length === 0) {
      throw new Error(
        `Google embedding model "${this.modelName}" returned an empty vector. Check the provided Gemini API key, GOOGLE_EMBEDDING_MODEL, and model access.`
      );
    }
    return vector;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    return Promise.all(documents.map((document) => this.embedQuery(document)));
  }
}

function getGoogleApiKey(apiKey: string) {
  if (!apiKey) {
    throw new Error("Missing Google API key");
  }
  return apiKey;
}

export function getDocumentEmbeddings(apiKey: string) {
  return new StrictGoogleGenerativeAIEmbeddings({
    apiKey: getGoogleApiKey(apiKey),
    modelName: EMBEDDING_MODEL,
    taskType: "RETRIEVAL_DOCUMENT" as TaskType,
  });
}

export function getQueryEmbeddings(apiKey: string) {
  return new StrictGoogleGenerativeAIEmbeddings({
    apiKey: getGoogleApiKey(apiKey),
    modelName: EMBEDDING_MODEL,
    taskType: "RETRIEVAL_QUERY" as TaskType,
  });
}

export { EMBEDDING_MODEL };
