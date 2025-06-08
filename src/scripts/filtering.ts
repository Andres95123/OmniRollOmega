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
      // If there are any active filters (not default values), hide elements without info
      const hasActiveFilters =
        (options.dubCode && options.dubCode !== "all") ||
        (options.subCode && options.subCode !== "all") ||
        options.isNew ||
        (options.score !== undefined && options.score > 0) ||
        (options.rating && options.rating !== "all") ||
        (options.episodes !== undefined && options.episodes > 0);

      if (hasActiveFilters) {
        this.hide(); // Hide if any filter is active and we don't have info
      } else {
        this.show(); // Show if no filters are active
      }
      console.warn(`No anime info available for ID: ${this.id}`);
      return;
    }

    const { Dubs, Subs, Tags = [] } = info;
    const { Rating, Episodes, Score } = info.Anime;

    // Validate that we have the required data
    if (typeof Score !== "number" || typeof Episodes !== "number") {
      console.warn(
        `Invalid data types for ID: ${
          this.id
        }. Score: ${typeof Score} (${Score}), Episodes: ${typeof Episodes} (${Episodes})`
      );
      this.hide();
      return;
    }

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
      // If no specific sub code is selected, show all items
      matchesSub = true;
    }

    const showOnlyNew = options.isNew ?? false;
    const matchesNew = showOnlyNew ? this.isNew() : true;

    // Fix score filtering logic - check for valid number and greater than 0 to apply filter
    let matchesScore = true;
    if (options.score !== undefined && options.score > 0) {
      matchesScore = Score >= options.score;
      // Debug logging for score filtering
      if (!matchesScore) {
        console.debug(
          `Score filter failed for ID ${this.id}: Score ${Score} < required ${options.score}`
        );
      }
    }

    let matchesRating = true;
    if (options.rating && options.rating !== "all") {
      matchesRating = Rating === options.rating;
      // Debug logging for rating filtering
      if (!matchesRating) {
        console.debug(
          `Rating filter failed for ID ${this.id}: Rating "${Rating}" !== required "${options.rating}"`
        );
      }
    }

    // Fix episodes filtering logic - check for valid number and greater than 0 to apply filter
    let matchesEpisodes = true;
    if (options.episodes !== undefined && options.episodes > 0) {
      matchesEpisodes = Episodes >= options.episodes;
      // Debug logging for episodes filtering
      if (!matchesEpisodes) {
        console.debug(
          `Episodes filter failed for ID ${this.id}: Episodes ${Episodes} < required ${options.episodes}`
        );
      }
    }

    const shouldShow =
      matchesDub &&
      matchesSub &&
      matchesNew &&
      matchesScore &&
      matchesRating &&
      matchesEpisodes;

    // Debug logging for final decision
    console.debug(`Filter decision for ID ${this.id}:`, {
      shouldShow,
      matchesDub,
      matchesSub,
      matchesNew,
      matchesScore,
      matchesRating,
      matchesEpisodes,
      data: { Score, Episodes, Rating },
      filters: options,
    });

    if (shouldShow) {
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
  addElementsContentVisibility(); // Add content visibility after update

  // Optimized observer setup for better performance
  setupOptimizedObserver(updateAndRender);
}

function setupOptimizedObserver(updateCallback: () => Promise<void>) {
  const browseCollection = document.querySelector(".app-contents");
  if (!browseCollection) {
    console.error('Element with class ".app-contents" not found.');
    return;
  }

  let debounceTimeout: NodeJS.Timeout | null = null;
  let isUpdating = false;
  let lastUpdateTime = 0;
  let isPageVisible = !document.hidden;
  const MIN_UPDATE_INTERVAL = 300; // Minimum 300ms between updates

  // Track page visibility to pause updates when tab is not active
  const handleVisibilityChange = () => {
    isPageVisible = !document.hidden;
    if (isPageVisible && debounceTimeout) {
      // Resume updates when page becomes visible
      performUpdate();
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const performUpdate = async () => {
    if (isUpdating || !isPageVisible) return; // Don't update if page is hidden

    const now = Date.now();
    if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
      // Too soon, reschedule
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(
        performUpdate,
        MIN_UPDATE_INTERVAL - (now - lastUpdateTime)
      );
      return;
    }

    isUpdating = true;
    lastUpdateTime = now;

    try {
      await updateCallback();
      addElementsContentVisibility();
    } catch (error) {
      console.error("Error during filter update:", error);
    } finally {
      isUpdating = false;
      debounceTimeout = null;
    }
  };

  const scheduleUpdate = () => {
    if (!isPageVisible) return; // Don't schedule updates if page is hidden
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(performUpdate, 200); // Reduced from 750ms to 200ms
  };

  // More specific observer targeting only relevant changes
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;

    for (const mutation of mutations) {
      // Only trigger update for relevant changes
      if (mutation.type === "childList") {
        // Check if any added/removed nodes are browse-cards or their containers
        const relevantNodes = Array.from(mutation.addedNodes).concat(
          Array.from(mutation.removedNodes)
        );
        for (const node of relevantNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (
              element.classList?.contains("browse-card") ||
              element.querySelector?.(".browse-card") ||
              element.closest?.(".browse-card")
            ) {
              shouldUpdate = true;
              break;
            }
          }
        }
      }
      if (shouldUpdate) break;
    }

    if (shouldUpdate) {
      console.log("Relevant DOM change detected, scheduling update...");
      scheduleUpdate();
    }
  });

  // More targeted observation - only direct children and specific subtrees
  observer.observe(browseCollection, {
    childList: true,
    subtree: false, // Reduced scope - don't observe deep subtree changes
  });

  // Also observe specific containers that might contain browse-cards
  const cardContainers = browseCollection.querySelectorAll(
    '[class*="collection"], [class*="grid"], [class*="list"]'
  );
  cardContainers.forEach((container) => {
    observer.observe(container, {
      childList: true,
      subtree: false,
    });
  });

  // Cleanup function
  return () => {
    observer.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (debounceTimeout) clearTimeout(debounceTimeout);
  };
}

function getElements(): FilterElement[] {
  const browseCards = document.querySelectorAll<HTMLElement>(".browse-card");
  const filterElements: FilterElement[] = [];

  // Use for...of for better performance with early returns
  for (const card of browseCards) {
    const link = card.querySelector("a");
    if (!link) continue;

    const href = link.getAttribute("href");
    if (!href) continue;

    const pathSegments = href.split("/");
    if (pathSegments.length < 4) {
      console.warn("Invalid href format:", href);
      continue;
    }

    const serieId = pathSegments[3];
    if (serieId && serieId.trim()) {
      filterElements.push(new FilterElement(serieId, card));
    } else {
      console.warn("Could not extract series ID from href:", href);
    }
  }

  return filterElements;
}

async function addElementsContentVisibility() {
  // Optimized: Use requestAnimationFrame to batch DOM operations
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      const browseCards = document.querySelectorAll<HTMLElement>(
        ".browse-card:not([data-content-visibility-set])"
      );

      // Batch DOM operations
      if (browseCards.length > 0) {
        browseCards.forEach((card) => {
          card.style.contentVisibility = "auto";
          card.setAttribute("data-content-visibility-set", "true"); // Mark as processed
        });
        console.log(
          `Applied content-visibility to ${browseCards.length} new cards`
        );
      }

      resolve();
    });
  });
}
