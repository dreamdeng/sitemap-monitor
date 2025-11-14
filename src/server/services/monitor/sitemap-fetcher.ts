/**
 * Sitemap Fetcher
 * Responsible for fetching sitemap.xml content
 */

const REQUEST_TIMEOUT = 30000;
const RETRY_TIMES = 3;

export class SitemapFetcher {
  /**
   * Fetch sitemap content
   * @param url Sitemap URL
   * @returns XML string
   */
  async fetch(url: string): Promise<string | null> {
    for (let attempt = 0; attempt < RETRY_TIMES; attempt++) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SitemapMonitor/1.0)'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.text();
      } catch (error) {
        console.warn(`Fetch attempt ${attempt + 1} failed for ${url}:`, error);

        if (attempt < RETRY_TIMES - 1) {
          await this.sleep(1000 * (attempt + 1));
        }
      }
    }

    console.error(`Failed to fetch ${url} after ${RETRY_TIMES} attempts`);
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
