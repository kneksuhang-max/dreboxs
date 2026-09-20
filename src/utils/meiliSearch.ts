import { Meilisearch as MeiliSearch, type Index } from "meilisearch";
import type { Product, Category } from "../types";

export interface SearchWeights {
  name: number;
  category: number;
  tags: number;
  description: number;
}

export const DEFAULT_SEARCH_WEIGHTS: SearchWeights = {
  name: 10,
  category: 6,
  tags: 8,
  description: 4,
};

export interface SearchHit {
  product: Product;
  score: number;
  matchField: "name" | "category" | "tags" | "description" | "exact";
  snippet?: string;
  typoCount: number;
}

export interface SearchSuggestion {
  text: string;
  type: "product" | "tag" | "category";
  hint: string;
}

export interface MeiliConnectionStatus {
  connected: boolean;
  message: string;
  version?: string;
}

/**
 * Get or initialize MeiliSearch client
 */
export function getMeiliClient(
  host?: string,
  apiKey?: string,
): MeiliSearch | null {
  const finalHost = host?.trim() || "http://localhost:7700";
  try {
    return new MeiliSearch({
      host: finalHost,
      apiKey: apiKey?.trim() || undefined,
    });
  } catch (err) {
    console.warn("Failed to construct MeiliSearch client:", err);
    return null;
  }
}

/**
 * Test connectivity to MeiliSearch host
 */
export async function testMeiliConnection(
  host: string,
  apiKey?: string,
): Promise<MeiliConnectionStatus> {
  try {
    const client = getMeiliClient(host, apiKey);
    if (!client) {
      return { connected: false, message: "URL host MeiliSearch tidak valid" };
    }

    const health = await client.isHealthy();
    if (health) {
      const version = await client.getVersion();
      return {
        connected: true,
        message: `Terhubung ke MeiliSearch v${version.pkgVersion}`,
        version: version.pkgVersion,
      };
    }
    return {
      connected: false,
      message: "Instance MeiliSearch tidak sehat (unhealthy)",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Koneksi gagal";
    return {
      connected: false,
      message: `Tidak dapat menghubungi MeiliSearch di ${host || "localhost:7700"}: ${errorMsg}`,
    };
  }
}

/**
 * Sync / Index all products, categories, tags, descriptions to MeiliSearch
 */
export async function syncIndexToMeili(
  client: MeiliSearch,
  indexName: string,
  products: Product[],
  categories: Category[],
): Promise<{ success: boolean; message: string; taskUid?: number }> {
  try {
    const catMap = new Map<string, string>();
    categories.forEach((c) => catMap.set(c.id, c.name));

    const index: Index = client.index(indexName || "drebxs_products");

    // Update settings: searchable attributes
    await index.updateSearchableAttributes([
      "name",
      "tags",
      "categoryName",
      "description",
    ]);

    const documents = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      categoryId: p.categoryId || "",
      categoryName: p.categoryId ? catMap.get(p.categoryId) || "Umum" : "Umum",
      tags: p.tags,
      description: p.description,
      isFavorite: p.isFavorite,
      status: p.status,
      priority: p.priority,
      targetMonth: p.targetMonth || "",
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const task = await index.addDocuments(documents, { primaryKey: "id" });
    return {
      success: true,
      message: `Berhasil mengindeks ${documents.length} produk ke MeiliSearch index "${indexName || "drebxs_products"}"`,
      taskUid: task.taskUid,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Index error";
    return {
      success: false,
      message: `Gagal mengindeks ke MeiliSearch: ${errorMsg}`,
    };
  }
}

/**
 * Simple Levenshtein distance calculation for typo-tolerance
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = [];
  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost, // substitution
      );
    }
  }
  return d[m][n];
}

/**
 * Embedded Intelligent Search Engine:
 * Implements MeiliSearch-grade prefix matching, attribute weighting,
 * and typo-tolerance locally for instantaneous, zero-latency feedback.
 */
export function searchSmartEngine(
  query: string,
  products: Product[],
  categories: Category[],
  weights: SearchWeights = DEFAULT_SEARCH_WEIGHTS,
  enableTypoTolerance: boolean = true,
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return products.map((p) => ({
      product: p,
      score: 1,
      matchField: "exact",
      typoCount: 0,
    }));
  }

  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.id, c.name));

  const tokens = q.split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];

  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    const catName = product.categoryId
      ? catMap.get(product.categoryId)?.toLowerCase() || ""
      : "";
    const tagsLower = product.tags.map((t) => t.toLowerCase());
    const descLower = (product.description || "").toLowerCase();

    let totalScore = 0;
    let primaryMatch: SearchHit["matchField"] = "name";
    let maxFieldWeight = 0;
    let minTypoCount = 99;
    let foundSnippet = "";

    for (const token of tokens) {
      let tokenMatched = false;

      // 1. Name Match
      if (nameLower === token) {
        totalScore += weights.name * 3;
        tokenMatched = true;
        if (weights.name > maxFieldWeight) {
          primaryMatch = "name";
          maxFieldWeight = weights.name;
        }
        minTypoCount = Math.min(minTypoCount, 0);
      } else if (nameLower.startsWith(token)) {
        totalScore += weights.name * 2;
        tokenMatched = true;
        if (weights.name > maxFieldWeight) {
          primaryMatch = "name";
          maxFieldWeight = weights.name;
        }
        minTypoCount = Math.min(minTypoCount, 0);
      } else if (nameLower.includes(token)) {
        totalScore += weights.name * 1.5;
        tokenMatched = true;
        if (weights.name > maxFieldWeight) {
          primaryMatch = "name";
          maxFieldWeight = weights.name;
        }
        minTypoCount = Math.min(minTypoCount, 0);
      }

      // 2. Category Match
      if (catName.includes(token)) {
        totalScore += weights.category * 1.8;
        tokenMatched = true;
        if (weights.category > maxFieldWeight) {
          primaryMatch = "category";
          maxFieldWeight = weights.category;
        }
      }

      // 3. Tag Match
      const tagMatch = tagsLower.find(
        (t) => t.includes(token) || token.includes(t),
      );
      if (tagMatch) {
        totalScore += weights.tags * 2;
        tokenMatched = true;
        if (weights.tags > maxFieldWeight) {
          primaryMatch = "tags";
          maxFieldWeight = weights.tags;
        }
      }

      // 4. Description Match
      if (descLower.includes(token)) {
        totalScore += weights.description * 1.2;
        tokenMatched = true;
        if (weights.description > maxFieldWeight) {
          primaryMatch = "description";
          maxFieldWeight = weights.description;
        }

        // extract snippet around match
        if (!foundSnippet) {
          const idx = descLower.indexOf(token);
          const start = Math.max(0, idx - 25);
          const end = Math.min(
            product.description.length,
            idx + token.length + 35,
          );
          foundSnippet =
            (start > 0 ? "..." : "") +
            product.description.slice(start, end) +
            (end < product.description.length ? "..." : "");
        }
      }

      // 5. Typo Tolerance Check (Levenshtein)
      if (!tokenMatched && enableTypoTolerance && token.length >= 3) {
        const words = nameLower.split(/[\s\-_\/]+/);
        for (const word of words) {
          if (Math.abs(word.length - token.length) <= 2) {
            const dist = levenshteinDistance(word, token);
            const maxAllowedDist = token.length > 5 ? 2 : 1;
            if (dist <= maxAllowedDist) {
              totalScore += weights.name * (1 / (dist + 1));
              tokenMatched = true;
              minTypoCount = Math.min(minTypoCount, dist);
              break;
            }
          }
        }
      }

      // Also check typo in tags
      if (!tokenMatched && enableTypoTolerance && token.length >= 3) {
        for (const tag of tagsLower) {
          const dist = levenshteinDistance(tag, token);
          if (dist <= 1) {
            totalScore += weights.tags * 0.8;
            tokenMatched = true;
            minTypoCount = Math.min(minTypoCount, dist);
            break;
          }
        }
      }
    }

    if (totalScore > 0) {
      hits.push({
        product,
        score: Math.round(totalScore * 10) / 10,
        matchField: primaryMatch,
        snippet: foundSnippet,
        typoCount: minTypoCount === 99 ? 0 : minTypoCount,
      });
    }
  }

  // Sort descending by score
  return hits.sort((a, b) => b.score - a.score);
}

/**
 * Generate quick real-time auto-complete suggestions
 */
export function getAutoSearchSuggestions(
  query: string,
  products: Product[],
  categories: Category[],
  limit: number = 6,
): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 1) return [];

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Tag Suggestions
  for (const p of products) {
    for (const tag of p.tags) {
      const tLower = tag.toLowerCase();
      if (tLower.includes(q.replace(/^#/, "")) && !seen.has("tag:" + tLower)) {
        seen.add("tag:" + tLower);
        suggestions.push({
          text: "#" + tag,
          type: "tag",
          hint: "Tag",
        });
      }
    }
  }

  // 2. Category Suggestions
  for (const cat of categories) {
    const cLower = cat.name.toLowerCase();
    if (cLower.includes(q) && !seen.has("cat:" + cLower)) {
      seen.add("cat:" + cLower);
      suggestions.push({
        text: cat.name,
        type: "category",
        hint: "Kategori",
      });
    }
  }

  // 3. Product Name Suggestions
  for (const p of products) {
    const pLower = p.name.toLowerCase();
    if (pLower.includes(q) && !seen.has("prod:" + pLower)) {
      seen.add("prod:" + pLower);
      suggestions.push({
        text: p.name,
        type: "product",
        hint: "Barang Impian",
      });
    }
  }

  return suggestions.slice(0, limit);
}
