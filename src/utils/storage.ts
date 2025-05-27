// Util for saving information in local storage securely under a single key

const APP_STORAGE_KEY = "OMNIROLL:DATA"; // The single key used in localStorage
const SECRET_KEY =
  "1gr23VOHvJvbwjCxT/LyPmAizxJL/a6kKBEWjfOugqgrRm5vmmfFCWe8E/k4wtV5rE9j8iXRWVxMjVy7JgW6SrHTVc8OBX2TAixq5OlgH/rTCdDm/gIQFDlcuAA/Hd26+fHCSamw144qIPG7bvzIegpmfTfST+JSkoHf9BYNkCWeuL7WGoO4tYwVxs1qD2qgFVSuSqEPINpQjT5wS/IuRqsf3lLDLyLKuus17cOB6r7B0m0w7mTjTgW9PovWm5pi2Ot0o/i1Y8nB3CzvkZVwx2DmLPex8BSgkzaUT1R8vQp5x";

function encrypt(value: string): string {
  if (typeof value !== "string") {
    throw new Error("Value must be a string for encryption.");
  }
  try {
    const textEncoder = new TextEncoder();
    const keyEncoder = new TextEncoder();
    const valueBytes = textEncoder.encode(value);
    const keyBytes = keyEncoder.encode(SECRET_KEY);
    const encryptedBytes = new Uint8Array(valueBytes.length);

    for (let i = 0; i < valueBytes.length; i++) {
      // Simple XOR cipher
      encryptedBytes[i] = valueBytes[i] ^ keyBytes[i % keyBytes.length];
      // Add a simple transformation (e.g., add index mod 256) for more obfuscation
      encryptedBytes[i] = (encryptedBytes[i] + i) % 256;
    }

    // Convert bytes to a binary string in chunks to avoid stack overflow
    let binaryString = "";
    const chunkSize = 16384; // Process in chunks (e.g., 16KB)
    for (let i = 0; i < encryptedBytes.length; i += chunkSize) {
      const chunk = encryptedBytes.subarray(
        i,
        i + Math.min(chunkSize, encryptedBytes.length - i)
      );
      // String.fromCharCode.apply can handle a Uint8Array chunk directly
      binaryString += String.fromCharCode.apply(
        null,
        chunk as unknown as number[]
      );
    }

    return btoa(binaryString); // Base64 encode the binary string
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Encryption failed."); // Re-throw to indicate failure
  }
}

function decrypt(value: string): string {
  if (typeof value !== "string") {
    throw new Error("Value must be a string for decryption.");
  }
  try {
    // Base64 decode to a binary string
    const binaryString = atob(value);
    // Convert binary string to Uint8Array
    const encryptedBytes = Uint8Array.from(binaryString, (char) =>
      char.charCodeAt(0)
    );

    const keyEncoder = new TextEncoder();
    const keyBytes = keyEncoder.encode(SECRET_KEY);
    const decryptedBytes = new Uint8Array(encryptedBytes.length);

    for (let i = 0; i < encryptedBytes.length; i++) {
      // Reverse the simple transformation (subtract index mod 256)
      let currentByte = encryptedBytes[i];
      let originalByteBeforeXor = (currentByte - i) % 256;
      // Handle potential negative results from modulo to ensure positive value [0-255]
      if (originalByteBeforeXor < 0) {
        originalByteBeforeXor += 256;
      }
      // Reverse the XOR cipher
      decryptedBytes[i] = originalByteBeforeXor ^ keyBytes[i % keyBytes.length];
    }

    // Decode UTF-8 bytes back to string
    const textDecoder = new TextDecoder();
    return textDecoder.decode(decryptedBytes);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error(
      "Decryption failed. Data might be corrupted or the key is incorrect."
    );
  }
}

// Helper function to retrieve and decrypt the entire storage map
function getStorageMap(): Record<string, any> {
  try {
    const encryptedMap = localStorage.getItem(APP_STORAGE_KEY);
    if (encryptedMap) {
      const decryptedMap = decrypt(encryptedMap); // Use the new decrypt function
      // Basic check for map structure
      const parsedMap = JSON.parse(decryptedMap);
      if (typeof parsedMap === "object" && parsedMap !== null) {
        return parsedMap;
      } else {
        console.error("Decrypted data is not a valid object:", parsedMap);
        localStorage.removeItem(APP_STORAGE_KEY); // Clear invalid data
      }
    }
  } catch (error) {
    // Catch errors from decrypt or JSON.parse
    console.error(
      "Error retrieving, decrypting, or parsing storage map:",
      error
    );
    // If map is corrupted or invalid, start fresh
    localStorage.removeItem(APP_STORAGE_KEY);
  }
  return {}; // Return an empty object if no map exists or an error occurred
}

// Helper function to encrypt and save the entire storage map
function saveStorageMap(map: Record<string, any>): void {
  try {
    const stringifiedMap = JSON.stringify(map);
    const encryptedMap = encrypt(stringifiedMap); // Use the new encrypt function
    localStorage.setItem(APP_STORAGE_KEY, encryptedMap);
  } catch (error) {
    // Catch errors from encrypt
    console.error("Error stringifying or encrypting storage map:", error);
  }
}

export function save<T>(key: string, value: T): void {
  try {
    const storageMap = getStorageMap(); // Get the current map
    const expirationTime = Date.now() + 3600000; // Current time + 1 hour in milliseconds
    storageMap[key] = { value: value, expires: expirationTime }; // Store value with expiration
    saveStorageMap(storageMap); // Save the updated map back to localStorage
  } catch (error) {
    // Error logging is handled within getStorageMap and saveStorageMap
    console.error(`Error saving key "${key}" to storage:`, error);
  }
}

export function retrieve<T>(key: string): T | null {
  try {
    const storageMap = getStorageMap(); // Get the current map
    if (key in storageMap) {
      const storedItem = storageMap[key];

      // Check if the item has the expected structure and expiration property
      if (
        storedItem &&
        typeof storedItem === "object" &&
        "expires" in storedItem &&
        typeof storedItem.expires === "number"
      ) {
        const now = Date.now();

        if (now > storedItem.expires) {
          // Item has expired
          delete storageMap[key]; // Remove expired item
          saveStorageMap(storageMap); // Save the map without the expired item
          return null;
        } else {
          // Item is valid and not expired
          return storedItem.value as T;
        }
      } else {
        // Item has unexpected structure, treat as invalid/expired
        console.warn(`Item with key "${key}" has invalid structure. Removing.`);
        delete storageMap[key];
        saveStorageMap(storageMap);
        return null;
      }
    }
  } catch (error) {
    // Error logging is handled within getStorageMap
    console.error(`Error retrieving key "${key}" from storage:`, error);
  }
  return null; // Return null if the key doesn't exist or an error occurs
}

export function isSaved(key: string): boolean {
  try {
    const storageMap = getStorageMap(); // Get the current map
    if (key in storageMap) {
      const storedItem = storageMap[key];

      // Check if the item has the expected structure and expiration property
      if (
        storedItem &&
        typeof storedItem === "object" &&
        "expires" in storedItem &&
        typeof storedItem.expires === "number"
      ) {
        const now = Date.now();
        return now <= storedItem.expires; // Return true if not expired
      }
    }
  } catch (error) {
    // Error logging is handled within getStorageMap
    console.error(
      `Error checking existence of key "${key}" in storage:`,
      error
    );
  }
  return false; // Return false if the key doesn't exist or an error occurs
}

// Optional: Function to clear the entire storage map
export function clearAll(): void {
  try {
    localStorage.removeItem(APP_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
}

// Function that saves in sync storage


