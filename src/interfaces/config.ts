// Script con las variables para configuración de la extensión

// Export the interface
export interface Config {
    // Modo
    mode: "dev" | "prod"; // dev o prod
    // Compartir
    share: boolean; // true o false
    // Idioma (autodetectar)
    lang: string; // es, en, fr, de, it, pt, ru, ja, zh, ko, ar, hi, tr, pl, nl, sv, da, no, fi, cs, hu, ro, sk, bg, el, th, vi
}

// Export the default config
export const defaultConfig: Config = {
    // Modo
    mode: "dev", // dev o prod
    // Compartir
    share: true, // true o false
    // Idioma (autodetectar)
    lang: "es",
}

// Export keys if needed elsewhere
export const localKeys = {
    config: "storage:config", // Keep key consistent or update if needed
}

// --- Using chrome.storage.local ---

// Note: chrome.storage.local is asynchronous.
// These synchronous functions won't work directly with it.
// You'll need to refactor Popup.tsx to handle async storage.

// **Synchronous Placeholder Functions (Need Refactoring for Async Storage)**
// These are kept for structural reference but won't work correctly with chrome.storage
// You should replace these with async versions or use a state management library
// that handles async storage.

export function getConfig(): Config {
    console.warn("Synchronous getConfig is a placeholder and won't work correctly with chrome.storage.local. Refactor needed.");
    // Attempt to read synchronously (will likely fail or be unreliable in extensions)
    const configStr = localStorage.getItem(localKeys.config); // Still using localStorage as placeholder

    if (configStr) {
        try {
            return JSON.parse(configStr);
        } catch (e) {
            console.error("Error parsing config from storage:", e);
            // Fallback to default if parsing fails
            localStorage.setItem(localKeys.config, JSON.stringify(defaultConfig));
            return defaultConfig;
        }
    } else {
        // If no config found, save and return default
        localStorage.setItem(localKeys.config, JSON.stringify(defaultConfig));
        return defaultConfig;
    }
}

export function setConfig(config: Config): void {
    console.warn("Synchronous setConfig is a placeholder and won't work correctly with chrome.storage.local. Refactor needed.");
    try {
        // Attempt to write synchronously (will likely fail or be unreliable in extensions)
        localStorage.setItem(localKeys.config, JSON.stringify(config)); // Still using localStorage as placeholder
    } catch (e) {
        console.error("Error saving config to storage:", e);
    }
}