import { fetchHtml } from "../lib/fetch";
import * as cheerio from "cheerio";

async function main() {
  const { html } = await fetchHtml("https://trustnodelogic.com/field-notes.html");
  const $ = cheerio.load(html);
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (href && href.includes(".html")) console.log(`${href} -> ${text}`);
  });
}
main().catch(console.error);
