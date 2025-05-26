import { createRoot } from "react-dom/client";
import React from "react";
import NotificationContainer from "../components/notification";

export default function showNotifications() {
  // Obtiene el body
  const body = document.querySelector("body");
  if (!body) return;

  // Crea el contenedor de notificaciones
  const notificationContainer = document.createElement("div");
  notificationContainer.id = "notification-container";

  // Lo añade al body
  body.appendChild(notificationContainer);

  // Crea el root de React
  const root = createRoot(notificationContainer);
  // Renderiza el componente de notificaciones
  root.render(React.createElement(NotificationContainer, {}));
  console.log("NotificationContainer rendered");
}
