import React from "react";
import FilteringOptions from "../components/FilteringOptions";
import { createRoot } from "react-dom/client";
// Import getSeries instead of getSerie
import { getSeries } from "../utils/server";
import { GetSerieResponse } from "../interfaces/outputs";

// justo dentro de la clase FilterElement, en lugar de los métodos anteriores:
export type FilterOptions = {
  dubCode?: string;
  subCode?: string;
  isNew?: boolean;
  score?: number;
  rating?: string;
  episodes?: number;
};

// Reemplaza la interfaz por una clase con implementación interna
export class FilterElement {
  id: string;
  element: HTMLElement;
  isVisible = true;
  // Lenguajes
  animeInfo: GetSerieResponse | null = null;

  constructor(id: string, element: HTMLElement) {
    this.id = id;
    this.element = element;
  }

  show(): void {
    this.element.style.display = "";
    this.isVisible = true;
  }

  hide(): void {
    this.element.style.display = "none";
    this.isVisible = false;
  }

  isNew(): boolean {
    return this.animeInfo?.Tags?.some((tag) => tag === "isNew") ?? false;
  }

  showIf(options: FilterOptions): void {
    const info = this.animeInfo;
    if (!info) {
      if (options.dubCode === "all") {
        this.show(); // Show the element if no info is available
      } else {
        this.hide(); // Hide the element if no info is available and no "all" option
      }
      console.warn(`No anime info available for ID: ${this.id}`);
      return;
    }

    const { Dubs, Subs, Tags = [] } = info;
    const { Rating, Episodes, Score } = info.Anime;

    let matchesDub: boolean;
    if (options.dubCode === "all") {
      matchesDub = true;
    } else if (options.dubCode && Dubs) {
      matchesDub = Dubs?.some((d) => d.Code === options.dubCode);
    } else {
      matchesDub = false;
    }

    let matchesSub: boolean;
    if (options.subCode === "all") {
      matchesSub = true;
    } else if (options.subCode && Subs) {
      matchesSub = Subs?.some((s) => s.Code === options.subCode);
    } else {
      matchesSub = !options.subCode;
    }

    const showOnlyNew = options.isNew ?? false;
    const matchesNew = showOnlyNew ? this.isNew() : true;

    // Check if the element should be shown based on the filter options
    let matchesScore = true;
    if (options.score) {
      if (!isNaN(Score)) {
        matchesScore = Score >= options.score;
      } else {
        console.warn(`Invalid score for ID: ${this.id}`);
        matchesScore = false;
      }
    }

    let matchesRating = true;
    if (options.rating && options.rating !== "all") {
      matchesRating = Rating === options.rating;
    }

    let matchesEpisodes = true;
    if (options.episodes) {
      if (!isNaN(Episodes)) {
        matchesEpisodes = Episodes >= options.episodes;
      } else {
        console.warn(`Invalid episodes for ID: ${this.id}`);
        matchesEpisodes = false;
      }
    }

    if (
      matchesDub &&
      matchesSub &&
      matchesNew &&
      matchesScore &&
      matchesRating &&
      matchesEpisodes
    ) {
      this.show();
    } else {
      this.hide();
    }
  }
}

// Helper function to fetch info for multiple elements
async function fetchAndAssignAnimeInfo(
  elements: FilterElement[]
): Promise<void> {
  const ids = elements.map((el) => el.id);
  try {
    const response = await getSeries(ids);
    if (response) {
      elements.forEach((el) => {
        const info = response.find((r) => r.Anime.CrunchyID === el.id);
        if (info) {
          el.animeInfo = info;
        } else {
          console.warn(`No info found for ID: ${el.id}`);
        }
      });
    } else {
      console.error("Failed to fetch series info.");
    }
  } catch (error) {
    console.error("Error fetching series info:", error);
  }
}

export async function startFiltering() {
  const browseDropdowns = document.querySelector(
    ".browse-dropdowns"
  ) as HTMLUListElement;
  if (!browseDropdowns) {
    console.error('Element with class "browse-dropdowns" not found.');
    return;
  }

  const classNameFiltering = "filtering-options";
  // Check if the filtering options already exist
  if (browseDropdowns.querySelector(`.${classNameFiltering}`)) {
    // Remove existing filtering options
    const existingFilterOptions = browseDropdowns.querySelector(
      `.${classNameFiltering}`
    );
    if (existingFilterOptions) {
      existingFilterOptions.remove();
      console.log("Removed existing filtering options.");
    } else {
      console.warn("No existing filtering options found to remove.");
    }
  }

  const filterOptionsDiv = document.createElement("div");
  filterOptionsDiv.className = classNameFiltering; // Add a class for styling
  // Añadimos como primer hijo de browseDropdowns
  browseDropdowns.insertAdjacentElement("afterbegin", filterOptionsDiv);
  const root = createRoot(filterOptionsDiv);

  const knownElements = new Map<string, FilterElement>();

  const updateAndRender = async () => {
    const currentElementsOnPage = getElements();
    const newElements: FilterElement[] = [];
    const currentIds = new Set<string>();

    currentElementsOnPage.forEach((newEl) => {
      const { id, element } = newEl;
      currentIds.add(id);

      if (!knownElements.has(id)) {
        // add new element and queue for fetch
        knownElements.set(id, newEl);
        newElements.push(newEl);
      } else {
        // update the existing FilterElement’s DOM node
        knownElements.get(id)!.element = element;
      }
    });

    // remove any that disappeared
    for (const id of Array.from(knownElements.keys())) {
      if (!currentIds.has(id)) {
        knownElements.delete(id);
      }
    }

    console.log("Current elements on page:", currentElementsOnPage);
    console.log("Known elements:", knownElements);
    console.log("New elements:", newElements);

    if (newElements.length > 0) {
      await fetchAndAssignAnimeInfo(newElements);
    }

    const elementsToRender = Array.from(knownElements.values());

    if (elementsToRender.length === 0) {
      console.log("No filter elements to render.");
      root.render(null);
      return;
    }

    root.render(
      React.createElement(FilteringOptions, {
        filterElements: elementsToRender,
      })
    );
  };

  await updateAndRender();

  const browseCollection = document.querySelector(".app-contents");
  let debounceTimeout: NodeJS.Timeout | null = null;

  if (browseCollection) {
    const observer = new MutationObserver(() => {
      console.log("DOM changed, scheduling filter update...");
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(async () => {
        console.log("Stabilization period ended, updating filters...");
        await updateAndRender();
        debounceTimeout = null; // Reset timeout ID after execution
      }, 750); // 750 ms stabilization time
    });

    observer.observe(browseCollection, {
      childList: true, // Observe direct children additions/removals
      subtree: true, // Observe all descendants
    });
  } else {
    console.error('Element with class "erc-browse-collection" not found.');
  }
}

function getElements(): FilterElement[] {
  const browseCards = document.querySelectorAll<HTMLElement>(".browse-card");
  const filterElements: FilterElement[] = [];

  browseCards.forEach((card) => {
    const href = card.querySelector("a")?.getAttribute("href");
    if (!href) return;

    const serieId = href.split("/")[3];
    if (serieId) {
      const fe = new FilterElement(serieId, card);
      filterElements.push(fe);
    } else {
      console.warn("Could not extract series ID from href:", href);
    }
  });

  return filterElements;
}
