import { supabase } from "@/integrations/supabase/client";

/**
 * CometChat Constants - Replace with your actual credentials
 */
const COMETCHAT_CONSTANTS = {
  APP_ID: "278833fb48d8c83b", // Replace with your actual App ID from CometChat
  REGION: "US", // Replace with your App's Region
  AUTH_KEY: "e7f74dde7fb77f045a008d4b4856aeffea9d24c9", // Replace with your Auth Key (leave blank if using Auth Token)
};

/**
 * CometChatService - Multi-User Architecture with Direct Messages
 * 
 * This service supports multiple concurrent users with direct 1-on-1 conversations
 * between users and experts. Each user gets their own service instance.
 * 
 * Key Features:
 * - Direct messages (1-on-1) instead of groups
 * - Persistent conversations that remain in message list forever
 * - Each user has isolated CometChat session
 * - Conversations created automatically when first message is sent
 * 
 * Usage Examples:
 * 
 * // For User A
 * const userAService = new CometChatService();
 * await userAService.initialize();
 * await userAService.loginUser('userA', 'User A', 'avatarA');
 * 
 * // For User B (simultaneously)
 * const userBService = new CometChatService();
 * await userBService.initialize();
 * await userBService.loginUser('userB', 'User B', 'avatarB');
 * 
 * // Each user now has their own isolated session
 * // Direct messages sent from User A will appear as User A's messages
 * // Direct messages sent from User B will appear as User B's messages
 * // No interference between users
 * // Conversations persist in message list forever
 */
class CometChatService {
  // Remove singleton pattern - each user gets their own instance
  private isInitialized = false;
  private isLoggedIn = false;
  private hasBookingHistory = false;
  private CometChatUIKit: any = null;
  private UIKitSettingsBuilder: any = null;
  private CometChat: any = null;
  private currentUserId: string | null = null;

  constructor() {
    // Each instance is independent
  }

  // Remove getInstance() - create new instances instead
  // static getInstance(): CometChatService {
  //   if (!CometChatService.instance) {
  //     CometChatService.instance = new CometChatService();
  //   }
  //   return CometChatService.instance;
  // }

  /**
   * Dynamically import CometChat SDK for SSR compatibility
   */
  private async loadCometChatSDK() {
    if (!this.CometChatUIKit) {
      try {
        const { CometChatUIKit, UIKitSettingsBuilder } = await import("@cometchat/chat-uikit-react");
        const { CometChat } = await import("@cometchat/chat-sdk-javascript");
        this.CometChatUIKit = CometChatUIKit;
        this.UIKitSettingsBuilder = UIKitSettingsBuilder;
        this.CometChat = CometChat;
      } catch (error) {
        console.error("Failed to load CometChat SDK:", error);
        throw error;
      }
    }
  }

  /**
   * Initialize CometChat when user has any booking history
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load CometChat SDK dynamically
      await this.loadCometChatSDK();

      const UIKitSettings = new this.UIKitSettingsBuilder()
        .setAppId(COMETCHAT_CONSTANTS.APP_ID)
        .setRegion(COMETCHAT_CONSTANTS.REGION)
        .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
        .subscribePresenceForAllUsers()
        .build();

      await this.CometChatUIKit.init(UIKitSettings);
      this.isInitialized = true;
      console.log("CometChat UI Kit initialized successfully for user:", this.currentUserId);
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
      // Set current user ID for this instance
      this.currentUserId = uid;
      
      // Initialize CometChat if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Logout any existing user first to clear global state
      if (this.isLoggedIn) {
        try {
          await this.CometChatUIKit.logout();
          console.log("🔄 Logged out previous user to clear state");
        } catch (logoutError) {
          console.log("No previous user to logout");
        }
        this.isLoggedIn = false;
      }

      // Create user in CometChat first using core SDK
      try {
        const user = new this.CometChat.User(uid);
        user.setName(name);
        if (avatar) {
          user.setAvatar(avatar);
        }
        
        await this.CometChat.createUser(user, COMETCHAT_CONSTANTS.AUTH_KEY);
        console.log("CometChat user created successfully:", { uid, name, avatar });
      } catch (createError: any) {
        // If user already exists, that's fine - continue to login
        if (createError.code === 'ERR_UID_ALREADY_EXISTS' || createError.code === 'ERR_UID_ALREADY_TAKEN') {
          console.log("User already exists in CometChat, proceeding to login:", uid);
        } else {
          console.error("Error creating CometChat user:", createError);
          throw createError;
        }
      }

      // Login to CometChat
      await this.CometChatUIKit.login(uid, COMETCHAT_CONSTANTS.AUTH_KEY);
      this.isLoggedIn = true;
      this.hasBookingHistory = true;
      console.log("✅ CometChat user created and logged in:", uid);
      console.log("🔍 Current user ID set to:", this.currentUserId);
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

    // Set current user ID for this instance
    this.currentUserId = uid;

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // UI Kit should automatically create user if they don't exist
      console.log("Attempting to login/create user:", { uid, name, avatar });
      await this.CometChatUIKit.login(uid, COMETCHAT_CONSTANTS.AUTH_KEY);
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
  async logout(): Promise<void> {
    if (!this.isLoggedIn || !this.CometChatUIKit) {
      return;
    }

    try {
      await this.CometChatUIKit.logout();
      this.isLoggedIn = false;
      this.currentUserId = null;
      console.log("CometChat logout successful for user:", this.currentUserId);
    } catch (error) {
      console.error("CometChat logout failed:", error);
      throw error;
    }
  }

  /**
   * Create a direct conversation between user and expert (only when booking exists)
   * This creates a persistent 1-on-1 conversation that remains in the message list forever
   */
  async createConversation(userId: string, expertId: string, bookingId: string): Promise<string> {
    if (!this.isLoggedIn) {
      throw new Error("User must be logged in to create conversations");
    }

    try {
      // For direct messages, we don't need to create anything in CometChat
      // The conversation will be automatically created when the first message is sent
      // We just need to ensure both users exist in CometChat
      
      const conversationId = `user_${userId}_expert_${expertId}`;
      console.log("Direct conversation ready:", conversationId);
      
      // The conversation will appear in both users' message lists
      // when they start chatting, and will remain there forever
      
      return conversationId;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      throw error;
    }
  }

  /**
   * Send a direct message to start the conversation
   */
  async sendDirectMessage(receiverId: string, message: string): Promise<void> {
    if (!this.isLoggedIn || !this.currentUserId) {
      throw new Error("User must be logged in to send messages");
    }

    console.log("🔍 Sending message from user:", this.currentUserId, "to:", receiverId);

    try {
      // Create the message with the correct constructor format
      const textMessage = new this.CometChat.TextMessage(
        receiverId,
        message,
        this.CometChat.RECEIVER_TYPE.USER
      );

      // Send the message
      await this.CometChat.sendMessage(textMessage);
      console.log("✅ Direct message sent successfully from:", this.currentUserId, "to:", receiverId);
    } catch (error: any) {
      console.error("❌ Failed to send direct message:", error);
      throw error;
    }
  }

  /**
   * Get direct conversations for the current user
   */
  async getDirectConversations(): Promise<any[]> {
    if (!this.isLoggedIn || !this.currentUserId) {
      return [];
    }

    try {
      const messageRequest = new this.CometChat.MessagesRequestBuilder()
        .setUID(this.currentUserId)
        .setLimit(50)
        .build();

      const messages = await messageRequest.fetchPrevious();
      console.log("Direct conversations fetched:", messages.length);
      return messages;
    } catch (error) {
      console.error("Failed to get direct conversations:", error);
      return [];
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
        .select('id, user_id, expert_id')
        .or(`user_id.eq.${profileId},expert_id.eq.${profileId}`)
        .limit(1);

      if (error) {
        console.error("Error checking booking history:", error);
        return false;
      }

      const hasHistory = data && data.length > 0;
      console.log("Booking history found:", hasHistory, "for profile:", profileId);
      if (hasHistory && data) {
        console.log("Booking details:", data[0]);
      }
      
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
    console.log("Booking history status set to:", hasHistory, "for user:", this.currentUserId);
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

  /**
   * Get current user ID for this instance
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get user's conversations from database
   */
  async getUserConversations(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          booking_id,
          status,
          created_at,
          profiles!conversations_expert_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url
          ),
          bookings (
            id,
            status,
            expert_services (
              title,
              service_type
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching user conversations:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Failed to get user conversations:", error);
      return [];
    }
  }

  /**
   * Get expert's conversations from database
   */
  async getExpertConversations(expertId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          booking_id,
          status,
          created_at,
          profiles!conversations_user_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url
          ),
          bookings (
            id,
            status,
            expert_services (
              title,
              service_type
            )
          )
        `)
        .eq('expert_id', expertId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching expert conversations:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Failed to get expert conversations:", error);
      return [];
    }
  }
}

export default CometChatService; 