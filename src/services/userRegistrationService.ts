import { supabase } from "@/integrations/supabase/client";
import CometChatService from "./cometchatService";

/**
 * UserRegistrationService - Handles user registration and CometChat account creation
 * 
 * This service ensures that CometChat accounts are created immediately upon
 * EquiEdge account creation, providing a seamless chat experience from day one.
 */
class UserRegistrationService {
  /**
   * Create CometChat account for a new user
   * Called immediately after successful EquiEdge account creation
   */
  async createCometChatAccount(userId: string, userName: string, userAvatar?: string): Promise<void> {
    try {
      console.log("Creating CometChat account for new user:", { userId, userName, userAvatar });
      
      const cometChatService = new CometChatService();
      await cometChatService.createUserAccount(userId, userName, userAvatar);
      
      console.log("✅ CometChat account created successfully for user:", userId);
    } catch (error) {
      console.error("Failed to create CometChat account:", error);
      // Don't throw error - CometChat account creation failure shouldn't prevent user registration
      // The account can be created later when user first accesses chat features
    }
  }

  /**
   * Update CometChat account when user profile is updated
   */
  async updateCometChatAccount(userId: string, userName: string, userAvatar?: string): Promise<void> {
    try {
      console.log("Updating CometChat account for user:", { userId, userName, userAvatar });
      
      const cometChatService = new CometChatService();
      
      // Create or update user account (initialization handled inside)
      await cometChatService.createUserAccount(userId, userName, userAvatar);
      
      console.log("✅ CometChat account updated successfully for user:", userId);
    } catch (error) {
      console.error("Failed to update CometChat account:", error);
      // Don't throw error - this is a non-critical operation
    }
  }

  /**
   * Ensure CometChat account exists for user (called when accessing chat features)
   * This is a fallback in case account creation during registration failed
   */
  async ensureCometChatAccount(userId: string, userName: string, userAvatar?: string): Promise<void> {
    try {
      console.log("Ensuring CometChat account exists for user:", { userId, userName, userAvatar });
      
      const cometChatService = new CometChatService();
      await cometChatService.createUserAccount(userId, userName, userAvatar);
      
      console.log("✅ CometChat account ensured for user:", userId);
    } catch (error) {
      console.error("Failed to ensure CometChat account:", error);
      // Don't throw error - this allows the chat interface to still work
      // even if account creation fails temporarily
    }
  }
}

export default UserRegistrationService; 