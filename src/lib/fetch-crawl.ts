import * as cheerio from "cheerio";

export async function crawlWithFetch(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; QASupportBot/1.0; +https://qa-support-bot.princemakavana.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch page (${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();

  const title = $("title").first().text().trim();
  const text = $("body").text().replace(/\s+/g, " ").trim();

  return { text, title };
}
