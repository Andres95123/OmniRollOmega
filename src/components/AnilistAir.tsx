import { fetchAnimeInfo } from "../utils/AniList";
import React, { useState, useEffect } from "react";

interface AnilistIconLinkProps {
  title: string | null | undefined; // Title used to fetch anime info
}

interface AnimeInfo {
  nextEpisodeTime?: number; // Time in seconds until the next episode airs
  // Add other properties from fetchAnimeInfo if needed
}

// Helper function to format time until airing
function getTimeUntilAiring(timeUntilAiring: number): string {
  if (timeUntilAiring <= 0) {
    return "Airing now or finished!";
  }
  const days = Math.floor(timeUntilAiring / 86400);
  const hours = Math.floor((timeUntilAiring % 86400) / 3600);
  const minutes = Math.floor((timeUntilAiring % 3600) / 60);
  const seconds = Math.floor(timeUntilAiring % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${String(hours).padStart(2, "0")}h`); // Pad hours
  if (minutes > 0 || hours > 0 || days > 0)
    parts.push(`${String(minutes).padStart(2, "0")}m`); // Show minutes if hours/days exist
  parts.push(`${String(seconds).padStart(2, "0")}s`); // Always show seconds, padded

  return parts.join(" ");
}

const AnilistAir: React.FC<AnilistIconLinkProps> = ({ title }) => {
  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Effect to fetch anime data
  useEffect(() => {
    if (!title) {
      setLoading(false);
      setAnimeInfo(null);
      setError(null);
      setCountdown(null); // Reset countdown
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setAnimeInfo(null); // Reset previous info
      setCountdown(null); // Reset countdown
      try {
        const info = await fetchAnimeInfo(title);
        setAnimeInfo(info);
        // Initialize countdown if nextEpisodeTime exists
        if (info?.nextEpisodeTime && info.nextEpisodeTime > 0) {
          setCountdown(info.nextEpisodeTime);
        } else {
          setCountdown(0); // Set to 0 if not airing or already aired
        }
      } catch (err) {
        console.error("Failed to fetch anime info:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [title]); // Re-run effect when title changes

  // Effect for the countdown timer
  useEffect(() => {
    // Only run the timer if countdown is initialized and positive
    if (countdown === null || countdown <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown === null || prevCountdown <= 1) {
          clearInterval(intervalId); // Stop timer when it reaches 0 or less
          return 0;
        }
        return prevCountdown - 1; // Decrement countdown by 1 second
      });
    }, 1000); // Update every second

    // Cleanup function to clear the interval when the component unmounts
    // or when the countdown state or animeInfo changes
    return () => clearInterval(intervalId);
  }, [countdown]); // Re-run effect when countdown state changes

  // Conditional Rendering
  if (loading) return null;
  if (error) return <p>{error}</p>;
  // Don't render anything if no valid countdown time is available after loading
  if (countdown === null || !animeInfo?.nextEpisodeTime) return null;

  // Render the countdown timer
  return (
    <p>
      Next episode in:{" "}
      <span style={{ fontWeight: "bold", fontFamily: "monospace" }}>
        {getTimeUntilAiring(countdown)}
      </span>
    </p>
  );
};

export default AnilistAir;
