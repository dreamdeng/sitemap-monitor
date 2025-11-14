/**
 * Metadata Extractor
 * Responsible for extracting Title, Description, Keywords from HTML
 */

import * as cheerio from 'cheerio';

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string;
  h1: string;
}

export class MetadataExtractor {
  /**
   * Extract metadata from HTML
   */
  extract(html: string): PageMetadata {
    const $ = cheerio.load(html);

    // Extract Title
    let title = $('title').text().trim();
    title = this.cleanTitle(title);

    // Extract Description
    const description = this.extractDescription($);

    // Extract Keywords
    const keywords = this.extractKeywords($, title);

    // Extract H1
    const h1 = $('h1').first().text().trim();

    return {
      title: title || 'No Title',
      description,
      keywords,
      h1
    };
  }

  /**
   * Clean Title (remove site name suffix)
   */
  private cleanTitle(title: string): string {
    const patterns = [
      /\s*[-|]\s*Play\s+Online.*$/i,
      /\s*[-|]\s*Free\s+Game.*$/i,
      /\s*[-|]\s*Poki\s*$/i,
      /\s*[-|]\s*CrazyGames\s*$/i,
      /\s*[-|]\s*Play\s+Free.*$/i,
    ];

    let cleaned = title;
    patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned.trim();
  }

  /**
   * Extract Description
   */
  private extractDescription($: cheerio.CheerioAPI): string {
    const desc = $('meta[name="description"]').attr('content') ||
                 $('meta[property="og:description"]').attr('content') ||
                 '';

    return desc.trim().slice(0, 500);
  }

  /**
   * Extract Keywords
   */
  private extractKeywords($: cheerio.CheerioAPI, title: string): string {
    let keywords = $('meta[name="keywords"]').attr('content') || '';

    // If no keywords, generate from title
    if (!keywords && title && title !== 'No Title') {
      const words = title.split(/\s+/).slice(0, 5);
      keywords = words.join(', ');
    }

    return keywords.trim().slice(0, 200);
  }
}
