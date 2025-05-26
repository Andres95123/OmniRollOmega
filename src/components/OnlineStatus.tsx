import React, { useState, useEffect } from "react";
import { isServerOnline } from "../utils/server";

const OnlineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // null = checking, true = online, false = offline
  useEffect(() => {
    const checkStatus = async () => {
      // Set checking state before making the request
      if (isOnline !== null) {
        // Wait for morph animation to reach middle point (faster now)
        await new Promise((resolve) => setTimeout(resolve, 150));

        setIsOnline(null); // Set to checking state
      }

      //   const status = await isServerOnline();
      // simulate the response for demonstration purposes
      const status = await isServerOnline(); // Randomly simulate online/offline status

      // Only animate if the status is different from the current one
      if (status !== isOnline) {
        setTimeout(() => {
          setIsOnline(status);
        }, 150);
      } else {
        // If status is the same, just set it without animation
        setIsOnline(status);
      }
    };

    checkStatus();

    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    if (isOnline === null) return "checking...";
    return isOnline ? "online" : "offline";
  };

  const getStatusClass = () => {
    if (isOnline === null) return "checking";
    return isOnline ? "online" : "offline";
  };
  return (
    <span className="status-container">
      <span className="status-text">
        Omniroll is now <span className={`status-word`}>{getStatusText()}</span>
      </span>
      <div className={`status-dot ${getStatusClass()}`} />
    </span>
  );
};

export default OnlineStatus;
