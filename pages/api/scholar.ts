import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

type ScholarResult = {
  title: string;
  link: string;
  authors: string;
  publicationDate: string;
  journal: string;
  citationCount: string;
};

type ScholarMetrics = {
  citationsAll: string;
  citationsSince2019: string;
  hIndexAll: string;
  hIndexSince2019: string;
  i10IndexAll: string;
  i10IndexSince2019: string;
};

type GraphData = {
  year: string;
  citations: string;
};

type ScholarResponse = {
  results?: ScholarResult[];
  metrics?: ScholarMetrics;
  graphData?: GraphData[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScholarResponse>
) {
  const profileUrl =
    "https://scholar.google.com/citations?hl=en&user=2clQgooAAAAJ&view_op=list_works&sortby=pubdate";

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(profileUrl, { waitUntil: "networkidle2" });

    const results = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll(".gsc_a_tr"));
      return rows.slice(0, 20).map((row) => {
        const titleElement = row.querySelector(".gsc_a_at");
        const title = titleElement?.textContent ?? "";
        const link = titleElement?.getAttribute("href") ?? "";
        const authors =
          row.querySelector(".gs_gray")?.textContent?.trim() ?? "";
        const publicationDate =
          row.querySelector(".gsc_a_y")?.textContent ?? "";
        const journal = row.querySelectorAll(".gs_gray")[1]?.textContent ?? "";
        const citationCount =
          row.querySelector(".gsc_a_c a")?.textContent?.trim() || "0";

        return {
          title,
          link,
          authors,
          publicationDate,
          journal,
          citationCount,
        };
      });
    });

    const metrics = await page.evaluate(() => {
      const metricsElements = document.querySelectorAll(
        "#gsc_rsb_st .gsc_rsb_std"
      );
      return {
        citationsAll: metricsElements[0]?.textContent || "0",
        citationsSince2019: metricsElements[1]?.textContent || "0",
        hIndexAll: metricsElements[2]?.textContent || "0",
        hIndexSince2019: metricsElements[3]?.textContent || "0",
        i10IndexAll: metricsElements[4]?.textContent || "0",
        i10IndexSince2019: metricsElements[5]?.textContent || "0",
      };
    });

    const graphData = await page.evaluate(() => {
      const years = Array.from(document.querySelectorAll(".gsc_g_t")).map(
        (el) => el.textContent || ""
      );
      const citations = Array.from(document.querySelectorAll(".gsc_g_a")).map(
        (el) => el.textContent || "0"
      );
      return years.map((year, i) => ({ year, citations: citations[i] || "0" }));
    });

    await browser.close();
    res.status(200).json({ results, metrics, graphData });
  } catch (error) {
    console.error("Error scraping Google Scholar profile:", error);
    res.status(500).json({ error: "Failed to scrape Google Scholar profile" });
  }
}
