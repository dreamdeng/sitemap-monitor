/**
 * Sitemap Parser
 * Responsible for parsing XML and extracting URL lists
 */

import { parseString } from 'xml2js';

interface SitemapUrl {
  loc: string[];
  lastmod?: string[];
}

export class SitemapParser {
  /**
   * Parse sitemap XML
   * @param xml XML string
   * @returns URL array
   */
  async parse(xml: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          // Check if it's a sitemap index
          if (result.sitemapindex) {
            const subsitemaps = result.sitemapindex.sitemap || [];
            const urls = subsitemaps.map((s: any) => s.loc[0]);
            resolve(urls);
            return;
          }

          // Regular sitemap
          if (result.urlset && result.urlset.url) {
            const urls = result.urlset.url.map((u: SitemapUrl) => u.loc[0]);
            resolve(urls);
            return;
          }

          resolve([]);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Check if URL is a sitemap index
   */
  isSitemapUrl(url: string): boolean {
    return url.toLowerCase().includes('sitemap') && url.endsWith('.xml');
  }
}
