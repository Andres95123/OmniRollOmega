import { createRoot } from "react-dom/client";
import {
  getElementByAttribute,
  getElementsByClassName,
  parseSerieCrunchyId,
} from "../utils/scrapping";
import Comments from "../components/Comments";
import React from "react";
import { updateEpisode } from "../utils/server";

export default async function EpisodeParsing(
  episode_id: string,
  serie_name: string
) {
  // Upload episode
  await uploadEpisode(episode_id);
  // add comments
  addComments(episode_id);
}

async function uploadEpisode(episode_id: string) {
  // Obtenemos el elemento con data-t="show-title-link" y obtenemos el href
  const showTitleLink = getElementByAttribute(
    "data-t=show-title-link"
  ) as HTMLAnchorElement;
  if (!showTitleLink) {
    console.error(
      "No se ha encontrado el elemento con data-t='show-title-link'"
    );
    return;
  }

  // Obtenemos el elemento con la clase title y obtenemos el texto
  const titleElement = getElementsByClassName("title")[0] as HTMLElement;
  if (!titleElement) {
    console.error("No se ha encontrado el elemento con la clase title");
    return;
  }

  // Obtenemos el texto del elemento title
  const titleText = titleElement.innerText;
  // Separamos por el '-'
  const titleParts = titleText.split("-");
  // Obtenemos el primer elemento
  const episode: number = parseInt(titleParts[0].split("E")[1].trim());
  // Obtenemos el segundo elemento
  const episodeTitle = titleParts[1].trim();

  // Crea un objeto EpisodeUpdateRequest
  const episodeUpdateRequest = {
    anime_id: parseSerieCrunchyId(showTitleLink.href), // Obtiene el id de la serie
    episode: episode, // Obtiene el episodio
    episode_id: episode_id,
    title: episodeTitle, // Obtiene el titulo del episodio
  };

  // Envia el objeto a la API
  await updateEpisode(episodeUpdateRequest)
    .then((response) => {
      console.log("Episodio actualizado:", response);
    })
    .catch((error) => {
      console.error("Error al actualizar el episodio:", error);
    });
}

function addComments(crunchy_id: string) {
  // Obtain the container with class "current-media-wrapper"
  const container = getElementsByClassName(
    "erc-watch-episode-layout"
  )[0] as HTMLElement;

  // Add a new div element to the container
  const commentsDiv = document.createElement("div");
  commentsDiv.className = "comments-container"; // Add a class for styling

  //   Add the comments div to the container, at the end of the body
  container.appendChild(commentsDiv);

  // Render and Create the .tsx using react
  const containerRoot = createRoot(commentsDiv); // Create a root for the new div

  containerRoot.render(React.createElement(Comments, { crunchy_id })); // Render the Comments component
}
