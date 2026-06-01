import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

const EMBEDDING_MODEL =
  process.env.GOOGLE_EMBEDDING_MODEL || "gemini-embedding-001";

class StrictGoogleGenerativeAIEmbeddings extends GoogleGenerativeAIEmbeddings {
  async embedQuery(document: string): Promise<number[]> {
    const vector = await super.embedQuery(document);
    if (vector.length === 0) {
      throw new Error(
        `Google embedding model "${this.modelName}" returned an empty vector. Check GOOGLE_API_KEY, GOOGLE_EMBEDDING_MODEL, and model access.`
      );
    }
    return vector;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    return Promise.all(documents.map((document) => this.embedQuery(document)));
  }
}

function getGoogleApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY environment variable");
  }
  return apiKey;
}

export function getDocumentEmbeddings() {
  return new StrictGoogleGenerativeAIEmbeddings({
    apiKey: getGoogleApiKey(),
    modelName: EMBEDDING_MODEL,
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
}

export function getQueryEmbeddings() {
  return new StrictGoogleGenerativeAIEmbeddings({
    apiKey: getGoogleApiKey(),
    modelName: EMBEDDING_MODEL,
    taskType: TaskType.RETRIEVAL_QUERY,
  });
}

export { EMBEDDING_MODEL };
