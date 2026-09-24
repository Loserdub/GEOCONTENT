import { fetchHtml } from "../lib/fetch";
import * as cheerio from "cheerio";

async function main() {
  const { html } = await fetchHtml("https://trustnodelogic.com");
  const $ = cheerio.load(html);
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (href) console.log(`${href} -> ${text}`);
  });
}
main().catch(console.error);
