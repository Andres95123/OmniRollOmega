import { updateSerie } from "./scripts/series";
import EpisodeParsing from "./scripts/episode";
import { startFiltering } from "./scripts/filtering";
import browser from "webextension-polyfill";
import { clearAll } from "./utils/storage";
import { initCardsLangShow } from "./scripts/cardsLangShow";
import { cleanSerieName } from "./utils/scrapping";
import showNotifications from "./scripts/notifications";

// See if the browser storage is set to clean
browser.storage.local.get("clean").then((result) => {
  if (result.clean) {
    console.log("Cleaning storage...");
    // Clear the storage
    browser.storage.local.clear().then(() => {
      console.log("Storage cleared.");
      // Remove the clean flag
      browser.storage.local.remove("clean").then(() => {
        console.log("Clean flag removed from storage.");
      });
    });
    clearAll(); // Clear localStorage as well
  } else {
    console.log("No need to clean storage.");
  }
});

// Use a flag to prevent multiple executions
if (!(window as any).__CONTENT_SCRIPT_LOADED__) {
  (window as any).__CONTENT_SCRIPT_LOADED__ = true;

  let executeLogic = () => {
    console.log("DOM stabilized, executing logic.");

    // --- Scripts to run once per page after DOM stabilization ---
    // Ensure initCardsLangShow is defined or imported elsewhere.

    if (!(window as any).__INIT_CARDS_LANG_SHOW_LOADED__) {
      initCardsLangShow();
      (window as any).__INIT_CARDS_LANG_SHOW_LOADED__ = true;
    }

    if (!(window as any).__NOTIFICATIONS_LOADED__) {
      showNotifications();
      (window as any).__NOTIFICATIONS_LOADED__ = true;
    }

    // Add other similar one-time functions here if needed.
    // -----------------------------------------------------------

    const regex_serie = /\/series\/([a-zA-Z0-9-]+)/;
    // Example https://www.crunchyroll.com/es/watch/GJWU2X3DN/the-promise
    const regex_episode = /\/watch\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)/;
    // Example filtering : https://www.crunchyroll.com/es/videos/new o https://www.crunchyroll.com/es/videos/popular
    const regex_filtering = /\/videos\/([a-zA-Z0-9-]+)/;

    const url = window.location.href;

    if (regex_serie.exec(url)) {
      updateSerie(url);
    } else if (regex_episode.exec(url)) {
      const id: string = regex_episode.exec(url)?.[1] || "";
      const name: string = cleanSerieName(regex_episode.exec(url)?.[2] || "");

      if (name === "" || id === "") {
        console.error("Episode ID or name not found in URL.");
        return;
      }

      EpisodeParsing(id, name);
    } else if (regex_filtering.exec(url)) {
      // Call your filtering logic here
      startFiltering();
    }

    (window as any).__CONTENT_SCRIPT_LOADED__ = false; // Reset the flag after execution
  };

  let debounceTimer: number | undefined;
  const DEBOUNCE_DELAY = 1000; // ms - Adjust as needed

  const observer = new MutationObserver((mutations) => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(executeLogic, DEBOUNCE_DELAY);
  });

  const startObserver = () => {
    // Start observing the document body for changes in the subtree and child list
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true, // Optional: observe attribute changes too
    });

    // Initial check in case the page is already stable or loads very fast
    debounceTimer = window.setTimeout(executeLogic, DEBOUNCE_DELAY);
  };

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener("DOMContentLoaded", startObserver);
  }

  // Optional: Disconnect the observer after first execution if the script only needs to run once per page load
  const originalExecuteLogic = executeLogic;
  executeLogic = () => {
    originalExecuteLogic();
    observer.disconnect();
    console.log("MutationObserver disconnected.");
  };
} else {
  console.log("content.ts already loaded, skipping execution.");
}
