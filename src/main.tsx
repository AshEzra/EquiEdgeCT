import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CometChatUIKit, UIKitSettingsBuilder } from "@cometchat/chat-uikit-react";

/**
 * CometChat Constants - Replace with your actual credentials
 */
const COMETCHAT_CONSTANTS = {
  APP_ID: "278833fb48d8c83b", // Replace with your actual App ID from CometChat
  REGION: "US", // Replace with your App's Region
  AUTH_KEY: "e7f74dde7fb77f045a008d4b4856aeffea9d24c9", // Replace with your Auth Key (leave blank if using Auth Token)
};

/**
 * Configure the CometChat UI Kit using the UIKitSettingsBuilder.
 * This setup determines how the chat UI behaves.
 */
const UIKitSettings = new UIKitSettingsBuilder()
  .setAppId(COMETCHAT_CONSTANTS.APP_ID) // Assign the App ID
  .setRegion(COMETCHAT_CONSTANTS.REGION) // Assign the App's Region
  .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY) // Assign the Authentication Key (if applicable)
  .subscribePresenceForAllUsers() // Enable real-time presence updates for all users
  .build(); // Build the final configuration

/**
 * Initialize the CometChat UI Kit with the configured settings.
 * Once initialized successfully, you can proceed with user authentication and chat features.
 */
CometChatUIKit.init(UIKitSettings)!
  .then(() => {
    console.log("CometChat UI Kit initialized successfully.");
    // You can now call login function to authenticate users
  })
  .catch((error) => {
    console.error("CometChat UI Kit initialization failed:", error); // Log errors if initialization fails
  });

createRoot(document.getElementById("root")!).render(<App />);
