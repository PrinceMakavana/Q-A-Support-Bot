import { NextResponse } from "next/server";
import { chromium } from "playwright";

/** Fetches a URL and returns its body as text, or null on failure. */
async function fetchUrlText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function crawlWithJS(url: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle" });

  const text = await page.evaluate(() => {
    return document.body.innerText;
  });

  
 

  const title = await page.evaluate(() => {
    return document.title;
  });

  await browser.close();
  return { text, title };
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      console.error("[CRAWL] Error: URL is required");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log(`[CRAWL] Starting crawl for: ${url}`);
    const { origin } = new URL(url);
    const sitemapUrl = `${origin}/sitemap.xml`;
    const llmTxtUrl = `${origin}/llms.txt`;

    console.log(`[CRAWL] Derived Sitemap URL: ${sitemapUrl}`);
    console.log(`[CRAWL] Derived LLM TXT URL: ${llmTxtUrl}`);

    // Main page with Playwright + sitemap and llm.txt in parallel (fetch only)
    console.log("[CRAWL] Triggering parallel fetch for page content, sitemap, and llm.txt...");
    const [pageResult, settled] = await Promise.all([
      crawlWithJS(url),
      Promise.allSettled([
        fetchUrlText(sitemapUrl),
        fetchUrlText(llmTxtUrl),
      ]),
    ]);
    console.log("[CRAWL] Parallel fetch completed.");

    const { text, title } = pageResult;
    const sitemap =
      settled[0].status === "fulfilled" && settled[0].value != null
        ? settled[0].value
        : null;
    const llm =
      settled[1].status === "fulfilled" && settled[1].value != null
        ? settled[1].value
        : null;

    console.log(`[CRAWL] Sitemap found: ${!!sitemap}`);
    console.log(`[CRAWL] LLM TXT found: ${!!llm}`);

    if (!text || text.trim().length === 0) {
      console.error("[CRAWL] Error: No content found on page");
      return NextResponse.json({ error: "No content found" }, { status: 404 });
    }

    // Clean up whitespace
    const cleanedText = text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, " ")
      .trim();

    const payload: Record<string, unknown> = {
      url,
      title: title || "",
      text: cleanedText,
      length: cleanedText.length,
    };
    if (sitemap != null && sitemap.trim() !== "") payload.sitemap = sitemap;
    if (llm != null && llm.trim() !== "") payload.llm = llm;

    console.log(`[CRAWL] Successfully prepared payload for ${url} (${cleanedText.length} chars)`);
    return NextResponse.json(payload);
  } catch (error: unknown) {
    console.error("Crawl error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to crawl the website", details: message },
      { status: 500 }
    );
  }
}
