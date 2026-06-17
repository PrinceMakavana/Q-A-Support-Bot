export async function crawlWithBrowserbase(url: string) {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) {
    throw new Error("BROWSERBASE_API_KEY is not configured");
  }

  const { chromium } = await import("playwright-core");
  const { default: Browserbase } = await import("@browserbasehq/sdk");

  const bb = new Browserbase({ apiKey });
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  const session = await bb.sessions.create(
    projectId ? { projectId } : {},
  );

  const browser = await chromium.connectOverCDP(session.connectUrl);
  try {
    const page =
      browser.contexts()[0]?.pages()[0] ?? (await browser.newPage());
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    const title = await page.title();
    return { text, title, sessionId: session.id };
  } finally {
    await browser.close();
  }
}
