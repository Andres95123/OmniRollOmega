import React, { useState, useEffect, useCallback } from "react";

// It's recommended to put the CSS below into a separate file,
// e.g., 'Notification.css', and import it here:
import "../../public/notifications.css";
import { getNotifications } from "../utils/server";
import { Notification } from "../interfaces/outputs";

interface NotificationProps extends Notification {
  onClose: (id: string) => void;
}

const NotificationE: React.FC<NotificationProps> = ({
  ID,
  Title,
  Message,
  Type, // Changed from category to type
  onClose,
}) => {
  const getCategoryClassName = () => {
    // Assuming a mapping for type: info, warning, error
    // This mapping might need adjustment based on actual data values for 'type'.
    switch (Type) {
      case "info":
        return "info";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "default-category"; // Fallback for unmapped types
    }
  };

  return (
    <div className={`notification-item ${getCategoryClassName()}`} role="alert">
      <div className="notification-item-header">
        <div className="notification-item-content">
          <strong className="notification-item-title">{Title}</strong>
          <p className="notification-item-body">{Message}</p>
        </div>
        <button
          onClick={() => onClose(ID)}
          className="notification-item-close-button"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

const CLOSED_NOTIFICATIONS_KEY = "closedNotifications";

const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [closedNotificationIds, setClosedNotificationIds] = useState<
    Set<string>
  >(() => {
    const storedClosedIds = localStorage.getItem(CLOSED_NOTIFICATIONS_KEY);
    return storedClosedIds ? new Set(JSON.parse(storedClosedIds)) : new Set();
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      const notificaciones = await getNotifications();
      setNotifications(notificaciones.notifications);
    };

    fetchNotifications();
  }, []);

  const handleCloseNotification = useCallback((id: string) => {
    setClosedNotificationIds((prevIds) => {
      const newIds = new Set(prevIds);
      newIds.add(id);
      localStorage.setItem(
        CLOSED_NOTIFICATIONS_KEY,
        JSON.stringify(Array.from(newIds))
      );
      return newIds;
    });
  }, []);

  const visibleNotifications = notifications.filter(
    (notification) => !closedNotificationIds.has(notification.ID)
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {visibleNotifications.map((notification) => (
        <NotificationE
          key={notification.ID}
          {...notification}
          onClose={handleCloseNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
