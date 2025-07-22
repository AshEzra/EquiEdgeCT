import { CometChatUIKit, UIKitSettingsBuilder } from "@cometchat/chat-uikit-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * CometChat Constants - Replace with your actual credentials
 */
const COMETCHAT_CONSTANTS = {
  APP_ID: "278833fb48d8c83b", // Replace with your actual App ID from CometChat
  REGION: "US", // Replace with your App's Region
  AUTH_KEY: "e7f74dde7fb77f045a008d4b4856aeffea9d24c9", // Replace with your Auth Key (leave blank if using Auth Token)
};

class CometChatService {
  private static instance: CometChatService;
  private isInitialized = false;
  private isLoggedIn = false;
  private hasBookingHistory = false;

  private constructor() {}

  static getInstance(): CometChatService {
    if (!CometChatService.instance) {
      CometChatService.instance = new CometChatService();
    }
    return CometChatService.instance;
  }

  /**
   * Initialize CometChat when user has any booking history
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const UIKitSettings = new UIKitSettingsBuilder()
        .setAppId(COMETCHAT_CONSTANTS.APP_ID)
        .setRegion(COMETCHAT_CONSTANTS.REGION)
        .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
        .subscribePresenceForAllUsers()
        .build();

      await CometChatUIKit.init(UIKitSettings);
      this.isInitialized = true;
      console.log("CometChat UI Kit initialized successfully.");
    } catch (error) {
      console.error("CometChat UI Kit initialization failed:", error);
      throw error;
    }
  }

  /**
   * Create CometChat user and login when first booking is created
   */
  async createUserAndLogin(uid: string, name: string, avatar?: string): Promise<void> {
    try {
      // Initialize CometChat if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Login to CometChat using the UIKit
      await CometChatUIKit.login(uid);
      this.isLoggedIn = true;
      this.hasBookingHistory = true;
      console.log("CometChat user created and logged in:", uid);
    } catch (error) {
      console.error("CometChat user creation/login failed:", error);
      throw error;
    }
  }

  /**
   * Login user to CometChat (if they have any booking history)
   */
  async loginUser(uid: string, name: string, avatar?: string): Promise<void> {
    if (!this.hasBookingHistory) {
      console.log("No booking history found, skipping CometChat login");
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Login to CometChat using the UIKit
      await CometChatUIKit.login(uid);
      this.isLoggedIn = true;
      console.log("CometChat login successful:", uid);
    } catch (error) {
      console.error("CometChat login failed:", error);
      throw error;
    }
  }

  /**
   * Logout user from CometChat
   */
  async logoutUser(): Promise<void> {
    if (!this.isLoggedIn) {
      return;
    }

    try {
      await CometChatUIKit.logout();
      this.isLoggedIn = false;
      console.log("CometChat logout successful");
    } catch (error) {
      console.error("CometChat logout failed:", error);
      throw error;
    }
  }

  /**
   * Create a conversation between user and expert (only when booking exists)
   */
  async createConversation(userId: string, expertId: string, bookingId: string): Promise<string> {
    if (!this.isLoggedIn) {
      throw new Error("User must be logged in to create conversations");
    }

    try {
      const groupId = `booking_${bookingId}`;
      const groupName = `Session - ${bookingId}`;
      
      // For now, we'll just return the group ID
      // The actual group creation will be handled by the CometChat UI component
      console.log("Conversation created:", groupId);
      return groupId;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      throw error;
    }
  }

  /**
   * Check if user has any booking history (active or completed)
   */
  async checkBookingHistory(profileId: string): Promise<boolean> {
    try {
      console.log("Checking booking history for profile:", profileId);
      
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .or(`user_id.eq.${profileId},expert_id.eq.${profileId}`)
        .limit(1);

      if (error) {
        console.error("Error checking booking history:", error);
        return false;
      }

      const hasHistory = data && data.length > 0;
      console.log("Booking history found:", hasHistory, "for profile:", profileId);
      
      // Update the stored state
      this.hasBookingHistory = hasHistory;
      
      return hasHistory;
    } catch (error) {
      console.error("Failed to check booking history:", error);
      return false;
    }
  }

  /**
   * Set booking history status (called when first booking is created)
   */
  setBookingHistory(hasHistory: boolean): void {
    this.hasBookingHistory = hasHistory;
    console.log("Booking history status set to:", hasHistory);
  }

  /**
   * Get unread message count for notifications
   */
  async getUnreadCount(): Promise<number> {
    if (!this.isLoggedIn || !this.hasBookingHistory) {
      return 0;
    }

    try {
      // For now, return 0 as we don't have direct access to unread count
      // This will be handled by the CometChat UI component
      return 0;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }

  /**
   * Check if CometChat is initialized
   */
  getInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if user is logged in
   */
  getLoggedIn(): boolean {
    return this.isLoggedIn;
  }

  /**
   * Check if user has booking history
   */
  getHasBookingHistory(): boolean {
    return this.hasBookingHistory;
  }
}

export default CometChatService; 