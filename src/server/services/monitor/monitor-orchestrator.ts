/**
 * Monitor Orchestrator
 * Responsible for orchestrating the entire monitoring process
 */

import { type PrismaClient } from '@prisma/client';
import { SitemapFetcher } from './sitemap-fetcher';
import { SitemapParser } from './sitemap-parser';
import { PageFetcher } from './page-fetcher';
import { MetadataExtractor } from './metadata-extractor';
import { URLComparator } from './url-comparator';

interface MonitorResult {
  websiteId: string;
  success: boolean;
  newCount: number;
  errorMessage?: string;
  durationSeconds: number;
}

export class MonitorOrchestrator {
  private sitemapFetcher: SitemapFetcher;
  private sitemapParser: SitemapParser;
  private pageFetcher: PageFetcher;
  private metadataExtractor: MetadataExtractor;
  private urlComparator: URLComparator;

  constructor(private db: PrismaClient) {
    this.sitemapFetcher = new SitemapFetcher();
    this.sitemapParser = new SitemapParser();
    this.pageFetcher = new PageFetcher();
    this.metadataExtractor = new MetadataExtractor();
    this.urlComparator = new URLComparator();
  }

  /**
   * Monitor a single website
   */
  async monitorWebsite(websiteId: string): Promise<MonitorResult> {
    const startTime = Date.now();

    try {
      // Get website info
      const website = await this.db.website.findUnique({
        where: { id: websiteId }
      });

      if (!website) {
        throw new Error('Website not found');
      }

      // Step 1: Fetch sitemap
      console.log(`[${website.name}] Fetching sitemap...`);
      const sitemapXml = await this.sitemapFetcher.fetch(website.sitemapUrl);

      if (!sitemapXml) {
        throw new Error('Failed to fetch sitemap');
      }

      // Step 2: Parse sitemap
      console.log(`[${website.name}] Parsing sitemap...`);
      const currentUrls = await this.sitemapParser.parse(sitemapXml);

      if (currentUrls.length === 0) {
        throw new Error('No URLs found in sitemap');
      }

      // Step 3: Compare with last URLs
      const lastUrls = (website.lastUrls as string[]) || [];
      const newUrls = this.urlComparator.findNewUrls(currentUrls, lastUrls, 50);

      console.log(`[${website.name}] Found ${newUrls.length} new URLs`);

      // Step 4: Fetch and extract metadata for new URLs
      if (newUrls.length > 0) {
        console.log(`[${website.name}] Fetching metadata...`);
        const pages = await this.pageFetcher.fetchMultiple(newUrls);

        // Extract metadata and save findings
        const findings = pages
          .filter(page => page.html !== null)
          .map(page => {
            const metadata = this.metadataExtractor.extract(page.html!);
            return {
              websiteId: website.id,
              url: page.url,
              title: metadata.title,
              description: metadata.description,
              keywords: metadata.keywords,
              h1: metadata.h1,
            };
          });

        // Save findings to database
        if (findings.length > 0) {
          await this.db.finding.createMany({
            data: findings,
            skipDuplicates: true,
          });
        }
      }

      // Step 5: Update website info
      await this.db.website.update({
        where: { id: website.id },
        data: {
          lastUrls: currentUrls,
          totalUrls: currentUrls.length,
          lastCheckTime: new Date(),
        },
      });

      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

      // Step 6: Create monitor log
      await this.db.monitorLog.create({
        data: {
          websiteId: website.id,
          status: 'SUCCESS',
          newCount: newUrls.length,
          durationSeconds,
        },
      });

      console.log(`[${website.name}] Monitoring completed successfully`);

      return {
        websiteId: website.id,
        success: true,
        newCount: newUrls.length,
        durationSeconds,
      };

    } catch (error) {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`Monitoring failed for website ${websiteId}:`, error);

      // Create error log
      await this.db.monitorLog.create({
        data: {
          websiteId,
          status: 'FAILED',
          newCount: 0,
          errorMessage,
          durationSeconds,
        },
      });

      return {
        websiteId,
        success: false,
        newCount: 0,
        errorMessage,
        durationSeconds,
      };
    }
  }

  /**
   * Monitor all active websites
   */
  async monitorAllWebsites(): Promise<MonitorResult[]> {
    const websites = await this.db.website.findMany({
      where: { status: 'ACTIVE' },
    });

    console.log(`Starting monitoring for ${websites.length} websites...`);

    const results: MonitorResult[] = [];

    // Monitor websites sequentially to avoid overloading
    for (const website of websites) {
      const result = await this.monitorWebsite(website.id);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const totalNewFindings = results.reduce((sum, r) => sum + r.newCount, 0);

    console.log(`Monitoring completed: ${successCount}/${websites.length} successful, ${totalNewFindings} new findings`);

    return results;
  }
}
