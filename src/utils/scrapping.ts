// Libreria propia que ayudará a escrapear los datos de la página web
// de crunchyroll

// Funcion para obtener elementos de la página web
export function getElementById(id: string): HTMLElement | null {
  return document.getElementById(id);
}

// Funcion para obtener elementos de la página web
export function getElementsByClassName(
  className: string
): HTMLCollectionOf<Element> {
  return document.getElementsByClassName(className);
}

export function getElementByClassName(className: string): Element | null {
  // Devuelve el primer elemento encontrado con esa clase usando querySelector.
  // Si necesitas todos los elementos con esa clase, considera usar getElementsByClassName(className).
  return document.querySelector(`.${className}`);
}

export function getElementBySelector(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

export function getElementsBySelector(selector: string): NodeListOf<Element> {
  return document.querySelectorAll(selector);
}

/**
 * Funcion para obtener el primer elemento con la etiqueta especificada.
 * @param tag La etiqueta HTML a buscar (ej: 'div', 'span').
 * @returns Element | null El primer elemento encontrado o null si no existe.
 */
export function getElementByTag(tag: string): Element | null {
  // Devuelve el primer elemento encontrado con esa etiqueta usando querySelector.
  // querySelector es generalmente preferido para obtener un único elemento.
  // Si necesitas todos los elementos con esa etiqueta, considera usar getElementsBySelector(tag)
  // o la función original document.getElementsByTagName(tag).
  return document.querySelector(tag);
}

export function getElementByAttribute(attribute: string): Element | null {
  // Devuelve el primer elemento encontrado con ese atributo usando querySelector.
  // Puedes usar un selector de atributo como `[data-t=detail-row-audio-language]`.
  return document.querySelector(`[${attribute}]`);
}

/**
 * Funcion para obtener el id de la serie de crunchyroll
 * @param url
 * @returns string
 */
export function parseSerieCrunchyId(url: string): string {
  // Error si url es null o undefined o vacia
  if (!url) {
    throw new Error("La url es nula o indefinida o vacia");
  }

  // Obtenemos el id de la serie de la url : ejemplo
  // https://www.crunchyroll.com/es/series/G6W4QKX0R/the-rising-of-the-shield-hero
  // return -> G6W4QKX0R
  const regex = /\/series\/([A-Z0-9]+)/;
  const match = regex.exec(url);
  if (match?.[1]) {
    return match[1];
  } else {
    throw new Error("No se ha encontrado el id de la serie en la url");
  }
}

/**
 * Funcion para obtener el nombre de la serie de crunchyroll
 * @param url
 * @returns string
 */
export function parseSerieCrunchyName(url: string): string {
  // Error si url es null o undefined o vacia
  if (!url) {
    throw new Error("La url es nula o indefinida o vacia");
  }

  // Obtenemos el nombre de la serie de la url : ejemplo
  // https://www.crunchyroll.com/es/series/G6W4QKX0R/the-rising-of-the-shield-hero
  // return -> The Rising Of The Shield Hero
  const regex = /\/series\/[A-Z0-9]+\/([a-zA-Z0-9-]+)/;
  const match = regex.exec(url);
  if (match?.[1]) {
    return cleanSerieName(match[1]);
  } else {
    throw new Error("No se ha encontrado el nombre de la serie en la url");
  }
}

/**
 * Funcion para limpiar el nombre de la serie
 * @param name
 * @returns string
 */
export function cleanSerieName(name: string): string {
  // Error si name es null o undefined o vacia
  if (!name) {
    throw new Error("El nombre es nulo o indefinido o vacio");
  }

  // Limpiamos el nombre de la serie : ejemplo
  // The Rising Of The Shield Hero -> The Rising Of The Shield Hero
  // The Rising Of The Shield Hero (Sub) -> The Rising Of The Shield Hero
  // The Rising Of The Shield Hero (Dub) -> The Rising Of The Shield Hero
  // The Rising Of The Shield Hero (Sub) [Español] -> The Rising Of The Shield Hero
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Funcion para obtener el id del episodio de crunchyroll
 * @param url
 * @returns string
 */
export function parseEpisodeCrunchyId(url: string): string {
  // Error si url es null o undefined o vacia
  if (!url) {
    throw new Error("La url es nula o indefinida o vacia");
  }

  // Obtenemos el id del episodio de la url : ejemplo
  // https://www.crunchyroll.com/es/watch/G6W4QKX0R/the-rising-of-the-shield-hero
  // return -> G6W4QKX0R
  const regex = /\/watch\/([A-Z0-9]+)/;
  const match = regex.exec(url);
  if (match?.[1]) {
    return match[1];
  } else {
    throw new Error("No se ha encontrado el id del episodio en la url");
  }
}

/**
 * Funcion para transformar un string a un array de strings separados por comas
 * @param url
 * @returns string
 */
export function parseComaSeparatedString(str: string): string[] {
  if (!str) {
    // Return an empty array or throw an error, depending on desired behavior for empty input
    return [];
    // Or: throw new Error("Input string cannot be empty");
  }

  // Split the string by commas and then trim whitespace from each part.
  const parts = str.split(",");
  const result = parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0); // Filter out empty strings if there are consecutive commas or trailing/leading commas

  if (result.length === 0 && str.trim().length > 0) {
    // This case might happen if the string only contains commas or whitespace.
    // Or if the split logic somehow fails, though unlikely with simple split/trim.
    // Consider if a single non-comma separated value should be returned as a single element array.
    // If the original string wasn't just whitespace and commas, but resulted in empty, it's odd.
    // If the string is like "Japanese" (no commas), split(',') results in ["Japanese"], map results in ["Japanese"].
    // If the string is " , ", split results in [" ", " "], map results in ["", ""], filter results in [].
    // If the string is "Japanese, ", split results in ["Japanese", " "], map results in ["Japanese", ""], filter results in ["Japanese"].
    // Let's refine the logic slightly: if the original string had content, we should probably return it as a single element if no commas are found.
    if (str.includes(",")) {
      // If it included commas but resulted in empty, maybe throw error or return empty array as is.
      console.warn(
        "Parsing resulted in an empty array despite the original string having commas."
      );
    } else if (str.trim().length > 0) {
      // If no commas and string has content, return the trimmed string as a single element array.
      return [str.trim()];
    }
  }

  // Handle the case where the input string might not contain any commas,
  // in which case split(',') returns an array with the original string as the only element.
  // The map(trim) will handle trimming this single element correctly.
  return result;
}
