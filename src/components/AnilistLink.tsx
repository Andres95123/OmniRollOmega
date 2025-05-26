import "../../public/animations.css";
import { fetchAnimeInfo } from "../utils/AniList";

interface AnilistIconLinkProps {
  // siteUrl is fetched internally based on title
  title: string | null | undefined; // Title used to fetch anime info
}

export default async function AnilistIconLink({ title }: AnilistIconLinkProps) {
  if (!title) {
    // If title is not provided, return null or a fallback component
    return null; // Or you can return a placeholder component if needed
  }

  // Fetch the anime info from AniList using the title
  const animeInfo = await fetchAnimeInfo(title);
  if (!animeInfo) {
    // If no anime info is found, return null or a fallback component
    return null; // Or you can return a placeholder component if needed
  }

  const url = animeInfo.siteUrl; // Extract the URL from the fetched info
  if (!url) {
    // If no URL is found, return null or a fallback component
    return null; // Or you can return a placeholder component if needed
  }

  // Render the link with the SVG if the URL exists
  return (
    <a
      href={url} // Use the URL from state
      target="_blank"
      rel="noopener noreferrer"
      title={title ?? "View on AniList"} // Use provided title or a default
      className="anime-list-link" // Clase opcional para estilos externos
      style={{
        display: "inline-flex", // Use inline-flex for layout
        alignItems: "center",
        justifyContent: "center",
        width: "32px", // Icon container size
        height: "32px",
        margin: "5px", // Margin around the icon
        verticalAlign: "middle", // Align with adjacent text if needed
        animation: "appear 0.5s ease-out forwards", // Animation for appearance
      }}
    >
      <svg viewBox="0 0 1024 1024" style={{ width: "100%", height: "100%" }}>
        {/* Background */}
        <path fill="#1e2630" d="M0 0h1024v1024H0Z" />
        {/* AniList Logo Part 1 */}
        <path
          fill="#02a9ff"
          d="M643.84 646.54V273.199c0-21.395-11.773-33.203-33.116-33.203h-72.865c-21.344 0-33.123 11.808-33.123 33.203v177.303c0 4.993 47.992 28.178 49.245 33.082 36.565 143.219 7.945 257.84-26.717 263.2 56.675 2.81 62.91 30.128 20.696 11.462 6.458-76.418 31.656-76.269 104.098-2.812.62.634 14.854 30.564 15.74 30.564h171.09c21.344 0 33.116-11.8 33.116-33.2v-73.048c0-21.396-11.772-33.203-33.116-33.203z"
        />
        {/* AniList Logo Part 2 (Letter A) */}
        <path
          fill="#fefefe"
          d="M341.36 240 149.999 786h148.676l32.384-94.444h161.92L524.63 786h147.936L481.938 240Zm23.553 330.56 46.365-151.258 50.785 151.258z"
        />
      </svg>
    </a>
  );
}
