/**
 * URL Comparator
 * Responsible for comparing URL lists and finding new ones
 */

export class URLComparator {
  /**
   * Find new URLs by comparing current with last
   * @param currentUrls Current URL list
   * @param lastUrls Last URL list
   * @param maxNewUrls Maximum number of new URLs to return
   * @returns New URL array
   */
  findNewUrls(
    currentUrls: string[],
    lastUrls: string[],
    maxNewUrls: number = 50
  ): string[] {
    // Convert last URLs to Set for faster lookup
    const lastUrlsSet = new Set(lastUrls);

    // Find URLs that exist in current but not in last
    const newUrls = currentUrls.filter(url => !lastUrlsSet.has(url));

    // Limit the number of new URLs
    return newUrls.slice(0, maxNewUrls);
  }

  /**
   * Calculate statistics
   */
  getStats(currentUrls: string[], lastUrls: string[]) {
    return {
      currentTotal: currentUrls.length,
      lastTotal: lastUrls.length,
      newCount: this.findNewUrls(currentUrls, lastUrls).length,
      removedCount: this.findNewUrls(lastUrls, currentUrls).length,
    };
  }
}
