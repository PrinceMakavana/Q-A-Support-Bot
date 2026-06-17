import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "playwright-core",
    "@browserbasehq/sdk",
    "@pinecone-database/pinecone",
    "@langchain/google-genai",
    "@langchain/pinecone",
    "@langchain/core",
    "@langchain/textsplitters",
    "@google/generative-ai",
    "langchain",
    "cheerio",
  ],
};

export default nextConfig;
