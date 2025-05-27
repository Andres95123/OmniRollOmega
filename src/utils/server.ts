import {
  EpisodeCommentsRequest,
  EpisodeUpdateRequest,
  SerieDTO,
  UserCreateRequest,
} from "../interfaces/inputs";
import {
  EpisodeCommentsDTO,
  EpisodeCommentsResponse,
  GetSerieResponse,
  Notifications,
  UploadSerieResponse,
  UserDTO,
} from "../interfaces/outputs";
import { getUser } from "./auth";
import { retrieve, save } from "./storage";
import browser from "webextension-polyfill";

// --- Configuration ---
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"; // Fallback to localhost if not set

// --- Interfaces ---
interface Anime {
  title: string;
  rating: number;
  crunchy_id: string;
}

interface Serie {
  anime: Anime;
  dubs: string[];
  subs: string[];
  tags: string[];
}

export interface Language {
  ID: number;
  Name: string;
  Code: string;
}

// --- API Call Helper ---

/**
 * Check if we're running in Firefox
 */
function isFirefox(): boolean {
  return (
    typeof browser !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("firefox")
  );
}

/**
 * Firefox-compatible fetch using background script
 */
async function fetchViaBackground<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  const response = await browser.runtime.sendMessage({
    type: "FETCH_REQUEST",
    url,
    options,
  });

  if (!response.success) {
    throw new Error(response.error);
  }

  return response.data as T;
}

/**
 * Generic function for API calls.
 * @param endpoint - The API path (e.g., "/api/users").
 * @param method - HTTP method ("GET", "POST", etc.).
 * @param data - Optional data for the request body (for POST/PUT).
 * @param useAuth - Whether to include Authorization headers.
 * @returns The parsed JSON response.
 * @throws Error if the request fails or returns an error status.
 */
async function fetchApi<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data: unknown | null = null,
  useAuth: boolean = false
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (useAuth) {
    // Assume getUser() is defined elsewhere and returns { token: string, name: string } | null
    // For example: import { getUser } from './auth';
    const user = await getUser(); // Replace with your actual user retrieval logic
    if (!user?.token || !user?.username) {
      throw new Error(
        "Authentication required, but user credentials are missing."
      );
    }
    (options.headers as Record<string, string>)[
      "Authorization"
    ] = `Bearer ${user.token}`;
    (options.headers as Record<string, string>)["User"] = user.username;
  }

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  const url = SERVER_URL + endpoint;

  // Use background script for Firefox to avoid CORS issues
  if (isFirefox()) {
    try {
      const result = await fetchViaBackground<T>(url, options);
      return result;
    } catch (error) {
      console.error("Firefox background fetch failed:", error);
      // Fallback to regular fetch if background fails
    }
  }

  // Regular fetch for Chrome or Firefox fallback
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  // Handle cases where the response might be empty (e.g., 204 No Content)
  if (response.status === 204) {
    return null as T; // Or handle as appropriate for your application
  }
  try {
    return (await response.json()) as T;
  } catch (e) {
    throw new Error(`Failed to parse JSON response: ${e}`);
  }
}

// --- API Functions ---

/**
 * Uploads or updates a series' details.
 * @param serieData - The series data.
 * @returns A promise resolving when the operation is complete. Adjust return type based on API.
 */

export async function uploadSerie(
  serieData: SerieDTO
): Promise<UploadSerieResponse> {
  // This function performs an asynchronous network request,
  // so it must return a Promise.
  // The API returns a simple message upon successful update.
  // Use 'await' when calling uploadSerie to get the UploadSerieResponse object.
  // e.g., const response = await uploadSerie(myData);
  return await fetchApi<UploadSerieResponse>(
    "/api/anime/update",
    "POST",
    serieData,
    false // Assuming authentication is not needed based on the original code
  );
}
/**
 * Get a serie list by its IDs.
 * @param crunchy_id - The ID of the serie.
 * @return The serie object.
 */
// Define the actual structure returned by the /api/animes/info endpoint
interface AnimeInfoResponse {
  animes: GetSerieResponse[];
}

/**
 * Get a serie list by its IDs.
 * @param crunchy_ids - The IDs of the series.
 * @return An array of serie objects.
 */
export async function getSeries(
  crunchy_ids: string[]
): Promise<GetSerieResponse[]> {
  let unknown_ids: string[] = [];
  const seriesFromLocal: GetSerieResponse[] = crunchy_ids
    .map((id) => {
      const serieLocal = retrieve<GetSerieResponse>("serie_" + id);
      if (serieLocal) {
        return serieLocal;
      }
      // If serieLocal is not found, add the ID to unknown_ids
      unknown_ids.push(id);
      return undefined; // Explicitly return undefined if serieLocal is not found or falsy
    })
    .filter((serie): serie is GetSerieResponse => serie !== undefined);

  let seriesFromServer: GetSerieResponse[] = [];

  if (unknown_ids.length > 0) {
    // The fetchApi function can return null (e.g., on 204 No Content),
    // so we type the response accordingly.
    const response = await fetchApi<AnimeInfoResponse | null>(
      `/api/animes/info`,
      "POST",
      // type AnimeInfoRequest struct {
      // 	CrunchyID []string `json:"ids"`
      // }
      { ids: unknown_ids },
      false // Assuming authentication is not needed based on the original code
    );

    // Ensure response is not null and response.animes is an array before using it
    if (response && Array.isArray(response.animes)) {
      seriesFromServer = response.animes;
      // Save the fetched series to local storage
      // This assumes response.animes is in the same order as unknown_ids
      // and has the same length.
      seriesFromServer.forEach((serieData, index) => {
        const correspondingId = unknown_ids[index];
        if (correspondingId && serieData) {
          save("serie_" + correspondingId, serieData);
        }
      });
    } else {
      // Log a warning if the API response isn't as expected.
      // seriesFromServer will remain an empty array.
      console.warn(
        "API response for animes/info was null, or 'animes' field was not an array:",
        response
      );
    }
  }

  // Merge the series from local storage with series fetched from the server
  const mergedSeries = [...seriesFromLocal, ...seriesFromServer];

  // Return the actual array of series
  return mergedSeries;
}

/**
 * Get a unique serie by its ID.
 * @param crunchy_id - The ID of the serie.
 * @return The serie object.
 * */
export async function getSerie(crunchy_id: string): Promise<GetSerieResponse> {
  // getSeries now correctly returns Promise<GetSerieResponse[]>
  const series = await getSeries([crunchy_id]);
  // Ensure there is at least one result before accessing it
  if (series && series.length > 0) {
    return series[0];
  } else {
    // Handle the case where no series is found for the given ID
    throw new Error(`Serie with ID ${crunchy_id} not found.`);
  }
}

/**
 * Get comments for a episode.
 * @param episode_id - The ID of the serie.
 * @return The serie objects.
 * */
export async function getComments(
  episode_id: string
): Promise<EpisodeCommentsDTO[]> {
  // Fetch the response which has the structure { animes: [...] }
  const response = await fetchApi<EpisodeCommentsResponse>(
    `/api/episode/comments`,
    "POST",
    // type AnimeInfoRequest struct {
    // 	CrunchyID []string `json:"ids"`
    // }
    { episode_id: episode_id },
    false // Assuming authentication is not needed based on the original code
  );
  // Return the actual array of series
  return response.comments;
}

/**
 * Add a comment to a episode.
 * @param episode_id - The ID of the serie.
 * @param comment - The comment to add.
 * @return The serie objects.
 * */
export async function addComment(
  episode_id: string,
  comment: string
): Promise<Serie[]> {
  // Fetch the response which has the structure { animes: [...] }
  const response = await fetchApi<Serie[]>(
    `/api/episode/comment/add`,
    "POST",
    // type AnimeInfoRequest struct {
    // 	CrunchyID []string `json:"ids"`
    // }
    { episode_id: episode_id, comment: comment },
    true // Assuming authentication is not needed based on the original code
  );
  // Return the actual array of series
  return response;
}

/**
 * Delete a comment from a episode.
 * @param crunchy_id - The ID of the serie.
 * @param commentID - The ID of the comment to delete.
 * @return The serie objects.
 */
export async function deleteComment(commentID: string): Promise<Serie[]> {
  // Fetch the response which has the structure { animes: [...] }
  const response = await fetchApi<Serie[]>(
    `/api/episode/comment/delete`,
    "POST",
    // type AnimeInfoRequest struct {
    // 	CrunchyID []string `json:"ids"`
    // }
    { comment_id: commentID },
    true // Assuming authentication is not needed based on the original code
  );
  // Return the actual array of series
  return response;
}

/**
 * Create a new user.
 * @param username - The username of the user.
 * @return The user object.
 * */
export async function createUser(username: string): Promise<UserDTO> {
  // Fetch the response which has the structure { animes: [...] }
  const response = await fetchApi<UserDTO>(
    `/api/user/create`,
    "POST",
    // type AnimeInfoRequest struct {
    // 	CrunchyID []string `json:"ids"`
    // }
    { name: username },
    false // Assuming authentication is not needed based on the original code
  );
  // Return the actual array of series
  return response;
}

/**
 * Get a list of languages.
 * @return The list of languages.
 * */
export async function getLanguages(): Promise<Language[]> {
  // Fetch the response which has the structure { animes: [...] }
  const response = await fetchApi<Language[]>(
    `/api/langs`,
    "GET",
    null,
    false // Assuming authentication is not needed based on the original code
  );
  // Sort by name
  response.sort((a, b) => a.Name.localeCompare(b.Name));
  // Return the actual array of series
  return response;
}

/**
 * Post a new episode info /api/episodes/update
 * @param episode - The episode info to post.
 * @return The episode info.
 * */
export async function updateEpisode(
  episode: EpisodeUpdateRequest
): Promise<EpisodeCommentsDTO> {
  // Fetch the response which has the structure { animes: [...] }
  const response = await fetchApi<EpisodeCommentsDTO>(
    `/api/episode/update`,
    "POST",
    episode,
    false // Assuming authentication is not needed based on the original code
  );
  // Return the actual array of series
  return response;
}

/**
 * Get the notifications /api/notifications
 * @return The notifications.
 */
export async function getNotifications(): Promise<Notifications> {
  // Fetch the response which has the structure { animes: [...] }
  const response = await fetchApi<Notifications>(
    `/api/notifications`,
    "GET",
    null,
    false // Assuming authentication is not needed based on the original code
  );
  // Return the actual array of series
  return response;
}

/**
 * Check if the server is online.
 * @returns A promise that resolves to true if the server is online, false otherwise.
 */
export async function isServerOnline(): Promise<boolean> {
  try {
    const response = await fetch(SERVER_URL + "/api/status", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.status === "ok"; // Assuming the server returns { status: "ok" }
    } else {
      console.error("Server is offline or returned an error:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error checking server status:", error);
    return false;
  }
}
