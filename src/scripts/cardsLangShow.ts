import { getSerie } from "../utils/server";
import AnimeLangInfo from "../components/AnimeLangInfo";
import { createRoot, Root as ReactDOMRoot } from "react-dom/client";
import React from "react";
import { LanguageInfo } from "../interfaces/outputs"; // Import LanguageInfo

// Global scope for the component and its state
let langInfoContainerDiv: HTMLDivElement | null = null;
let langInfoRoot: ReactDOMRoot | null = null; // Use ReactDOMRoot type
let lastProcessedId: string | null = null; // To track the last ID for which data was fetched and rendered
let hoverTimeoutId: number | null = null; // Renamed for clarity

// Function to initialize the component container once
function ensureLangInfoContainer() {
  if (!langInfoContainerDiv) {
    langInfoContainerDiv = document.createElement("div");
    langInfoContainerDiv.id = "lang-info-container-global";
    langInfoContainerDiv.style.position = "fixed";
    langInfoContainerDiv.style.display = "none"; // Initially hidden
    langInfoContainerDiv.style.zIndex = "10000"; // Ensure it's on top

    langInfoContainerDiv.addEventListener("mouseover", () => {
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
        hoverTimeoutId = null;
      }
    });

    langInfoContainerDiv.addEventListener("mouseout", (event) => {
      const relatedTarget = event.relatedTarget as Node | null;
      // If the mouse is truly leaving the container (i.e., relatedTarget is not a child of the container)
      if (!langInfoContainerDiv?.contains(relatedTarget)) {
        // Start a short timer to hide. This allows movement to an adjacent link
        // whose mouseover might cancel this timeout.
        if (hoverTimeoutId) clearTimeout(hoverTimeoutId);
        hoverTimeoutId = window.setTimeout(() => {
          updateAndShowLangInfo(null, false);
        }, 30); // Short delay (e.g., 30ms)
      }
    });

    document.body.appendChild(langInfoContainerDiv);
    langInfoRoot = createRoot(langInfoContainerDiv);

    // Add a global listener for when the mouse leaves the entire document (window)
    document.documentElement.addEventListener("mouseleave", () => {
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
        hoverTimeoutId = null;
      }
      updateAndShowLangInfo(null, false);
      lastProcessedId = null; // Add this line
    });
  }
}

// Function to update and show/hide the component
function updateAndShowLangInfo(
  languages: LanguageInfo[] | null, // Changed type to LanguageInfo[]
  show: boolean
) {
  ensureLangInfoContainer();
  if (!langInfoRoot || !langInfoContainerDiv) return;

  if (show && languages && languages.length > 0) {
    langInfoRoot.render(React.createElement(AnimeLangInfo, { languages }));
    langInfoContainerDiv.style.display = "block";

    // Removed dynamic positioning logic (top/left calculations and assignments)
    // The AnimeLangInfo component will now rely on its own internal fixed positioning styles
  } else {
    langInfoContainerDiv.style.display = "none";
  }
}

export function initCardsLangShow() {
  ensureLangInfoContainer();
  addCardsLangShow();
}

function addCardsLangShow() {
  const processedElements = new Set<HTMLAnchorElement>();

  // Procesa los enlaces existentes al inicio
  processLinks(document.querySelectorAll("a"), processedElements);

  // Configura el MutationObserver para observar cambios en el DOM
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === "A") {
              processLinks([element as HTMLAnchorElement], processedElements);
            } else {
              const newLinks = element.querySelectorAll("a");
              if (newLinks.length > 0) {
                processLinks(newLinks, processedElements);
              }
            }
          }
        });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function processLinks(
  links: NodeListOf<HTMLAnchorElement> | HTMLAnchorElement[],
  processedElements: Set<HTMLAnchorElement>
) {
  links.forEach((link) => {
    if (processedElements.has(link)) {
      return;
    }

    const href = link.getAttribute("href");
    const seriesMatch = href ? /\/series\/([a-zA-Z0-9-]+)/.exec(href) : null;

    if (seriesMatch) {
      const id = seriesMatch[1];

      link.addEventListener("mouseover", async (event) => {
        if (hoverTimeoutId) {
          clearTimeout(hoverTimeoutId);
          hoverTimeoutId = null;
        }
        lastProcessedId = id;

        try {
          const serie = await getSerie(id);
          if (id === lastProcessedId) {
            if (serie?.Dubs?.length > 0) {
              updateAndShowLangInfo(serie.Dubs, true); // Removed targetElement
            } else {
              updateAndShowLangInfo(null, false); // Hide if no dubs or no series
            }
          }
        } catch (error) {
          console.error("Error fetching serie data for ID:", id, error);
          if (id === lastProcessedId) {
            updateAndShowLangInfo(null, false);
          }
        }
      });

      link.addEventListener("mouseout", (event) => {
        if (langInfoContainerDiv?.contains(event.relatedTarget as Node)) {
          return;
        }

        if (hoverTimeoutId) clearTimeout(hoverTimeoutId);
        hoverTimeoutId = window.setTimeout(() => {
          if (id === lastProcessedId) {
            updateAndShowLangInfo(null, false);
            lastProcessedId = null; // Add this line
          }
        }, 100);
      });

      // Add click listener to hide flags on navigation
      link.addEventListener("click", () => {
        if (hoverTimeoutId) {
          clearTimeout(hoverTimeoutId);
          hoverTimeoutId = null;
        }
        updateAndShowLangInfo(null, false);
        lastProcessedId = null;
      });

      processedElements.add(link);
    }
  });
}
