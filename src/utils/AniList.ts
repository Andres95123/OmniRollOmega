// Define interfaces for the expected API response structure
interface AiringNode {
  airingAt: number;
  episode: number;
  timeUntilAiring: number;
}

interface AiringEdge {
  node: AiringNode;
}

interface AiringSchedule {
  edges: AiringEdge[];
}

interface Media {
  siteUrl: string;
  airingSchedule: AiringSchedule;
}

interface AniListData {
  Media: Media | null;
}

interface AniListError {
  message: string;
  // Add other potential error fields if known
}

interface AniListResponse {
  data: AniListData;
  errors?: AniListError[];
}

// Define the return type for the helper functions
interface AnimeInfo {
  nextEpisodeTime: number | undefined;
  siteUrl: string;
}

// Define types for MediaStatus and MediaType based on AniList schema
type MediaStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";
type MediaType = "ANIME" | "MANGA";

// In-memory cache for anime info promises
const animeInfoCache = new Map<string, Promise<AnimeInfo | null>>();

async function fetchAnimeInfoWithStatus(
  search: string,
  notYetAired: boolean = true,
  status: MediaStatus = "RELEASING",
  type: MediaType = "ANIME"
): Promise<AnimeInfo | null> {
  const query = `
        query Media($search: String, $notYetAired: Boolean, $status: MediaStatus, $type: MediaType) {
            Media(search: $search, status: $status, type: $type) {
                siteUrl
                airingSchedule(notYetAired: $notYetAired) {
                    edges {
                        node {
                            airingAt
                            episode
                            timeUntilAiring
                        }
                    }
                }
            }
        }
    `;

  const variables = {
    search: search,
    notYetAired: notYetAired,
    status: status,
    type: type,
  };

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    });

    // Type assertion for the response JSON
    const data = (await response.json()) as AniListResponse;

    if (data.errors || !data.data?.Media) {
      console.error("AniList error:", data.errors);
      return null;
    }

    const media = data.data.Media;

    return {
      nextEpisodeTime: media.airingSchedule?.edges[0]?.node?.timeUntilAiring,
      siteUrl: media.siteUrl,
    };
  } catch (error) {
    console.error("Error fetching anime info with status:", error);
    // Re-throwing the error might be preferable depending on how you want to handle it upstream
    // throw error;
    return null; // Or return null if you want fetchAnimeInfo to handle it
  }
}

async function fetchAnimeInfoWithoutStatus(
  search: string,
  notYetAired: boolean = true,
  type: MediaType = "ANIME"
): Promise<AnimeInfo | null> {
  const query = `
        query Media($search: String, $notYetAired: Boolean, $type: MediaType) {
            Media(search: $search, type: $type) {
                siteUrl
                airingSchedule(notYetAired: $notYetAired) {
                    edges {
                        node {
                            airingAt
                            episode
                            timeUntilAiring
                        }
                    }
                }
            }
        }
    `;

  const variables = { search, notYetAired, type };

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cache-Control": "max-age=86400", // Consider if this header is appropriate
      },
      body: JSON.stringify({ query, variables }),
    });

    // Type assertion for the response JSON
    const data = (await response.json()) as AniListResponse;

    if (data.errors || !data.data?.Media) {
      console.error("AniList error:", data.errors);
      return null;
    }

    const media = data.data.Media;

    return {
      nextEpisodeTime: media.airingSchedule?.edges[0]?.node?.timeUntilAiring,
      siteUrl: media.siteUrl,
    };
  } catch (error) {
    console.error("Error fetching anime info without status:", error);
    // Re-throwing the error might be preferable
    // throw error;
    return null; // Or return null
  }
}

/**
 * Fetches anime information from AniList, trying first with status 'RELEASING'
 * and then without a specific status if the first attempt fails.
 * Uses an in-memory cache to avoid redundant API calls for the same search term,
 * especially during concurrent requests.
 * @param search The search term for the anime.
 * @returns A Promise resolving to an object containing the next episode time and site URL, or null if not found or an error occurs.
 */
export async function fetchAnimeInfo(
  search: string
): Promise<AnimeInfo | null> {
  // Check cache first
  if (animeInfoCache.has(search)) {
    // Return the cached promise (handles concurrent requests)
    return animeInfoCache.get(search)!;
  }

  // If not in cache, create the promise to fetch the data
  const fetchPromise = (async (): Promise<AnimeInfo | null> => {
    try {
      // Try fetching with status 'RELEASING' first
      let animeInfo = await fetchAnimeInfoWithStatus(search);

      // If not found (null), try fetching without specifying status
      animeInfo ??= await fetchAnimeInfoWithoutStatus(search);

      // Cache the result (even if null)
      return animeInfo;
    } catch (error) {
      // Catch errors potentially re-thrown from helper functions
      console.error(`Error fetching anime info for "${search}":`, error);
      // Important: Remove the failed promise from cache to allow retries
      animeInfoCache.delete(search);
      return null; // Or re-throw error depending on desired behavior
    }
  })();

  // Store the promise in the cache immediately
  animeInfoCache.set(search, fetchPromise);

  // Return the newly created promise
  return fetchPromise;
}

// Optional: Consider adding cache eviction logic (e.g., TTL or max size) if memory usage becomes a concern.
