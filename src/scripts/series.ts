import { createRoot } from "react-dom/client"; // Import createRoot
import { SerieDTO } from "../interfaces/inputs";
import {
  parseSerieCrunchyName,
  parseSerieCrunchyId,
  getElementsByClassName,
  parseComaSeparatedString,
  getElementByAttribute,
} from "../utils/scrapping";
import Badge from "../components/Badge";
import { getSerie, uploadSerie } from "../utils/server";
import { GetSerieResponse } from "../interfaces/outputs";
import Banderas from "../components/Banderas"; // Import the Banderas component
import AnilistIconLink from "../components/AnilistLink";
import AnilistAir from "../components/AnilistAir";
import React from "react"; // Import React
import { save, retrieve, isSaved } from "../utils/storage";

/**
 * Extracts series data from the current DOM based on the provided URL.
 * @param url The current page URL.
 * @returns A SerieDTO object with the extracted data, or null if essential data is missing.
 */
function extractSerieDataFromDOM(url: string): SerieDTO | null {
  const serieId: string = parseSerieCrunchyId(url);
  const serieName: string = parseSerieCrunchyName(url);

  const detalles_serie = document.getElementsByClassName("details-item");
  if (detalles_serie.length < 2) {
    console.error("Could not find details items for audio/subs.");
    return null;
  }

  const audioText =
    detalles_serie[0].querySelector('h5[data-t="details-item-description"]')
      ?.textContent ?? "";
  const audios: string[] = parseComaSeparatedString(audioText);

  const subsText =
    detalles_serie[1].querySelector('h5[data-t="details-item-description"]')
      ?.textContent ?? "";
  const subs: string[] = parseComaSeparatedString(subsText);

  const episodes: number = getElementsByClassName("card").length;

  const scoreButton = document.querySelector('button[data-t="average-rating"]');
  const scoreElement = scoreButton?.querySelectorAll("span")[1];
  const scoreTextRaw = scoreElement?.textContent?.trim() ?? "0";
  const scoreString = scoreTextRaw.split(" ")[0];
  const score = parseFloat(scoreString) || 0;

  const ratingElement = document.querySelector(
    'svg[data-t^="universal-rating-"]'
  );
  const ratingAttribute = ratingElement?.getAttribute("data-t") ?? "";
  const rating =
    ratingAttribute.replace("universal-rating-", "").replace("-svg", "") ||
    "N/A";

  const serie: SerieDTO = {
    crunchy_id: serieId,
    title: serieName,
    episodes: episodes,
    rating: rating,
    score: score,
    dubs: audios,
    subs: subs,
  };

  return serie;
}

/**
 * Processes the extracted series data: uploads it, fetches updated data from the server,
 * updates the UI elements (badge, flags, Anilist info), and saves the data.
 * @param serie The SerieDTO object extracted from the DOM.
 */
async function processAndDisplaySerieData(serie: SerieDTO): Promise<void> {
  // Trim
  serie.dubs = serie.dubs.map((dub) => dub.trim()); // Trim each dub
  serie.subs = serie.subs.map((sub) => sub.trim()); // Trim each sub
  // Upload the series data asynchronously, don't wait for it necessarily
  // Initiate the upload and attach handlers
  const uploadOperationPromise = uploadSerie(serie)
    .then((res) => {
      if (res.status !== "ok") {
        console.error("Error uploading series data:", res.status);
      }
    })
    .catch((err) => {
      console.error("Failed to upload series data:", err);
    });

  // If the series is not saved (e.g., it's new), await the upload completion.
  // Otherwise, let it proceed in the background.
  if (!isSaved("serie_" + serie.crunchy_id)) {
    await uploadOperationPromise;
  }

  // Fetch the potentially updated/enriched series data from the server
  try {
    // Check if the series data is already in local storage
    const serieServer = await getSerie(serie.crunchy_id);
    if (!serieServer) {
      console.error("Failed to fetch series data from server.");
      return; // Stop processing if server data is unavailable
    }

    // Update UI elements with server data
    // These functions can run concurrently as they modify different parts of the DOM
    // If not charged
    if (!document.body.hasAttribute("data-t=series-data-loaded")) {
      await Promise.all([
        addBadge(serieServer),
        addFlags(serieServer),
        addAnilist(serieServer), // Assuming addAnilist is async or returns quickly
      ]);
    }
  } catch (error) {
    console.error("Error processing series data from server:", error);
  }
}

/**
 * Main function to update the series information on the page.
 * Extracts data, uploads it, fetches server data, and updates the UI.
 * @param url The current page URL.
 */
export async function updateSerie(url: string): Promise<void> {
  const serieData = extractSerieDataFromDOM(url);

  if (serieData) {
    await processAndDisplaySerieData(serieData);
  } else {
    console.error("Could not extract series data from the page.");
  }
}

async function addFlags(serie: GetSerieResponse) {
  if (!serie.Dubs || serie.Dubs.length === 0) {
    console.log("No tiene dubs, no se añade nada");
    return;
  }

  console.log("addFlags", serie.Dubs);

  // Contenedor para las banderas
  const flagsContainer = document.createElement("div");
  flagsContainer.className = "flags-container"; // Add a class for styling if needed

  // Create a root for this specific flag element
  const root = createRoot(flagsContainer);

  // Render the Banderas component for the current tag
  root.render(
    Banderas({
      codigosBandera: serie.Dubs,
      flagSize: 32, // Set the size of the flags
      style: {
        display: "flex",
        gap: "4px", // Gap between flags
        // Wrap
        flexWrap: "wrap",
        justifyContent: "flex-start", // Align to the left
        alignItems: "center", // Center vertically
      },
    })
  );

  // Search the data-t=series-hero-logo
  const logoElement = getElementByAttribute(
    "data-t=series-hero-body"
  ) as HTMLElement;
  if (!logoElement) {
    console.error("logoElement not found");
    return;
  }
  // Append the flags container to the logo element
  // Insert as the second child of the logo element
  if (logoElement.children[1]) {
    // If there is a second child, insert before it
    logoElement.insertBefore(flagsContainer, logoElement.children[1]);
  } else {
    // Otherwise (0 or 1 child), append it (becomes the first or second child)
    logoElement.appendChild(flagsContainer);
  }
}

export async function addBadge(serie: GetSerieResponse) {
  console.log("addBadgeX", serie);
  // Mira si tiene tags, sino no hace nada
  if (!serie.Tags || serie.Tags.length === 0) {
    console.log("No tiene tags, no se añade nada");
    return;
  }

  console.log("addBadge", serie.Tags);

  //   Si tiene tags, las añadimos al DOM

  // Search the bottom-actions-wrapper
  const bottomActionsWrapper = document.querySelector(
    ".bottom-actions-wrapper"
  ) as HTMLElement;
  if (!bottomActionsWrapper) {
    console.error("bottomActionsWrapper not found");
    return;
  }

  // Create a container for all badges
  const badgeContainer = document.createElement("div");
  // Optional: Add some styling to the container if needed, e.g., for layout
  badgeContainer.style.display = "flex"; // Example: Arrange badges horizontally
  badgeContainer.style.gap = "8px"; // Example: Add space between badges
  badgeContainer.style.marginTop = "10px"; // Example: Add space above the badges

  // Iterate over each tag in the serie.tags array
  serie.Tags.forEach((tag) => {
    // Create a dedicated div for each badge's React root
    const badgeElement = document.createElement("div");

    console.log("badgeElement", badgeElement);

    // Create a root for this specific badge element
    const root = createRoot(badgeElement);

    // Render the Badge component for the current tag
    // Use the tag name in uppercase as the text
    root.render(
      Badge({
        text: modifyText(tag), // Modify the text as needed
        // You can customize backgroundColor and color here if needed based on the tag
        // e.g., backgroundColor: tag === 'ADULT' ? '#FF0000' : undefined,
        // color: tag === 'ADULT' ? '#fff' : undefined,
      })
    );

    // Add the element (hosting the rendered badge) to the container
    badgeContainer.appendChild(badgeElement);
  });

  // Append the container (which now holds all the rendered badges) to the bottomActionsWrapper
  // Insert before the first child if you want them at the top of the wrapper, or appendChild to add at the end
  if (bottomActionsWrapper.firstChild) {
    bottomActionsWrapper.insertBefore(
      badgeContainer,
      bottomActionsWrapper.firstChild
    );
  } else {
    bottomActionsWrapper.appendChild(badgeContainer);
  }

  // Add to the body the charged data-t
  const bodyElement = document.querySelector("body");
  if (!bodyElement) {
    console.error("Body element not found");
    return;
  }
}

function modifyText(text: string): string {
  text = text.trim().toUpperCase(); // Example modification: Trim and convert to uppercase

  if (text === "ISNEW") {
    return "NEW"; // Example modification: Convert "ISNEW" to "NEW"
  } else {
    return text; // No modification for other cases
  }
}

function addAnilist(serie: GetSerieResponse) {
  // Check if the series is from Anilist
  if (serie.Anime?.Title) {
    // Add the Anilist icon link
    addAnilistIconLink(serie);
    // Add the Anilist airing schedule
    addAnilistAiringSchedule(serie);
  } else {
    console.log("No Anilist data available for this series.");
  }
}

async function addAnilistIconLink(serie: GetSerieResponse) {
  // Crea el contenedor para el badge de Anilist
  const anilistBadgeContainer = document.createElement("div");

  anilistBadgeContainer.className = "anilist-badge-container"; // Add a class for styling if needed

  // Create a root directly on the container
  const root = createRoot(anilistBadgeContainer);

  // Render the Badge component for the Anilist badge
  const anilistIcon = await AnilistIconLink({
    title: serie.Anime.Title,
  });

  if (!anilistIcon) {
    console.error("Anilist component not found");
    return;
  }

  root.render(anilistIcon);

  // Search the bottom-actions-wrapper
  const bottomActionsWrapper = document.querySelector(
    ".bottom-actions-wrapper"
  ) as HTMLElement;
  if (!bottomActionsWrapper) {
    console.error("bottomActionsWrapper not found");
    return;
  }

  // Append the Anilist badge container to the bottomActionsWrapper
  bottomActionsWrapper.appendChild(anilistBadgeContainer);
}

async function addAnilistAiringSchedule(serie: GetSerieResponse) {
  // Ensure Anilist data and title exist
  if (!serie.Anime?.Title) {
    console.error("Anilist title not found in serie data.");
    return;
  }

  // Search and append the air to data-t="series-hero-body"
  const logoElement = getElementByAttribute(
    "data-t=series-hero-body"
  ) as HTMLElement;
  if (!logoElement) {
    console.error("logoElement not found for Anilist Airing Schedule");
    return;
  }

  // Creamos un contenedor
  const airingBadgeContainer = document.createElement("div");
  airingBadgeContainer.className = "anilist-air-badge-container"; // Add a class for styling if needed
  // Optional: Add some styling
  airingBadgeContainer.style.marginTop = "10px";

  // Append the airing badge container to the logo element
  // Insert as the end of the logo element
  logoElement.appendChild(airingBadgeContainer);

  // Create a root for this specific badge element
  const rootAiring = createRoot(airingBadgeContainer);

  // Render the AnilistAir component using React.createElement
  // Pass the anime title as a prop named 'title' (assuming AnilistAir accepts this prop)
  rootAiring.render(
    React.createElement(AnilistAir, { title: serie.Anime.Title })
  );
}
