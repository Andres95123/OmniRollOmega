import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

// Function to execute the content script
async function executeContentScript(tabId: number) {
  try {
    // Check if we're running in Manifest V3 (Chrome) or V2 (Firefox)
    if (browser.scripting && browser.scripting.executeScript) {
      // Manifest V3 approach (Chrome)
      await browser.scripting.executeScript({
        target: { tabId: tabId },
        files: ["src/content.js"], // Verify this path matches your build output
      });
    } else {
      // Manifest V2 approach (Firefox)
      await browser.tabs.executeScript(tabId, {
        file: "src/content.js", // Verify this path matches your build output
      });
    }
    console.log("Content script executed for tab:", tabId);
  } catch (error) {
    // Log errors, especially useful if the script path is wrong or permissions are missing.
    console.error(`Failed to execute content script for tab ${tabId}:`, error);
    // Consider checking for specific errors like "No matching script" or permission errors.
  }
}

// Listen for when a page finishes loading
browser.webNavigation.onCompleted.addListener(
  async (details) => {
    // Inject script only into the main frame, not iframes
    if (details.frameId !== 0) {
      return;
    }
    console.log("onCompleted event fired for:", details.url);
    await executeContentScript(details.tabId);
  },
  // Filter to only run on crunchyroll.com
  { url: [{ hostContains: "crunchyroll.com" }] }
);

// Listen for history state updates (client-side navigation)
browser.webNavigation.onHistoryStateUpdated.addListener(
  async (details) => {
    // Inject script only into the main frame
    if (details.frameId !== 0) {
      return;
    }
    console.log("onHistoryStateUpdated event fired for:", details.url);
    await executeContentScript(details.tabId);
  },
  // Filter to only run on crunchyroll.com
  { url: [{ hostContains: "crunchyroll.com" }] }
);

// Listen for onInstalled event to clear storage
browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated. Clearing storage.");
  // Save to browser storage that it must be cleaned
  browser.storage.local.set({ clean: true });
});

// Handle fetch requests from content scripts (Firefox compatibility)
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "FETCH_REQUEST") {
    try {
      const { url, options } = message;
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Handle cases where the response might be empty (e.g., 204 No Content)
      if (response.status === 204) {
        return { success: true, data: null };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Background fetch error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
});

console.log("Omniroll Omega background script is running!");
