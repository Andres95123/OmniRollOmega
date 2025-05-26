// Interface for the time object used in CreatedAt and UpdatedAt
export interface TimeObject {
  Time: string; // ISO 8601 date string
  Valid: boolean;
}

// Interface for the Anime object within the response
export interface AnimeDetails {
  ID: number;
  CrunchyID: string;
  Title: string;
  Score: number;
  Rating: string;
  Episodes: number;
  CreatedAt: TimeObject;
  UpdatedAt: TimeObject;
}

// Interface for Dub and Sub objects (they share the same structure)
export interface LanguageInfo {
  Code: string;
  Flag: string;
  Name: string;
}

// The main response interface matching the provided JSON structure
export interface GetSerieResponse {
  Anime: AnimeDetails;
  Dubs: LanguageInfo[];
  Subs: LanguageInfo[];
  Tags?: string[]; // Optional based on potential variations, but present in the example
}

export interface UploadSerieResponse {
  status: string; // Or adjust based on the actual API response structure
}

export interface UserDTO {
  status: string; // Status of the user creation
  token: string; // Token for the user session
  name: string; // Username of the user
}

export interface EpisodeCommentsResponse {
  comments: EpisodeCommentsDTO[]; // Array of comments for the episode
}

export interface EpisodeCommentsDTO {
  id: string; // Episode ID
  user: string; // Username of the user who commented
  creationTime: TimeObject; // Creation time of the comment
  comment: string; // The comment text
}

export interface Notifications {
  notifications: Notification[];
}

export interface Notification {
  ID: string; // Unique identifier for the notification
  Title: string; // Title of the notification
  Message: string; // Body text of the notification
  Type: string; // Type of notification (1: info, 2: warning, 3: error)
}
