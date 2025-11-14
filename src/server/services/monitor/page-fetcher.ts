/**
 * Page Fetcher
 * Responsible for fetching page HTML content
 */

import pLimit from 'p-limit';

const MAX_CONCURRENT = 20;
const REQUEST_TIMEOUT = 30000;

export class PageFetcher {
  private limiter = pLimit(MAX_CONCURRENT);

  /**
   * Concurrently fetch multiple pages
   * @param urls URL array
   * @returns HTML content array
   */
  async fetchMultiple(urls: string[]): Promise<Array<{ url: string; html: string | null }>> {
    const tasks = urls.map(url =>
      this.limiter(() => this.fetchSingle(url))
    );

    return Promise.all(tasks);
  }

  /**
   * Fetch single page
   */
  private async fetchSingle(url: string): Promise<{ url: string; html: string | null }> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        return { url, html: null };
      }

      const html = await response.text();
      return { url, html };
    } catch (error) {
      console.error(`Failed to fetch page ${url}:`, error);
      return { url, html: null };
    }
  }
}
