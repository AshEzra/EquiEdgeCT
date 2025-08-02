/**
 * CometChat Configuration
 * 
 * Replace these values with your actual CometChat credentials
 */
export const COMETCHAT_CONFIG = {
  APP_ID: "278833fb48d8c83b", // Replace with your actual App ID from CometChat
  REGION: "US", // Replace with your App's Region
  AUTH_KEY: "e7f74dde7fb77f045a008d4b4856aeffea9d24c9", // Replace with your Auth Key
} as const;

/**
 * CometChat Feature Flags
 * Enable/disable specific features
 */
export const COMETCHAT_FEATURES = {
  // Enable presence subscription for all users
  SUBSCRIBE_PRESENCE: true,
  
  // Enable real-time messaging
  REALTIME_MESSAGING: true,
  
  // Enable message history
  MESSAGE_HISTORY: true,
  
  // Enable typing indicators
  TYPING_INDICATORS: true,
  
  // Enable read receipts
  READ_RECEIPTS: true,
} as const; 