import { supabase } from "@/integrations/supabase/client";
import { COMETCHAT_CONFIG, COMETCHAT_FEATURES } from "@/config/cometchat";

/**
 * CometChatService - Clean Architecture for Multi-User Platform
 * 
 * This service creates CometChat accounts immediately upon EquiEdge account creation,
 * providing a seamless chat experience from day one.
 * 
 * Key Features:
 * - Immediate account creation upon user registration
 * - Direct messages (1-on-1) between users and experts
 * - Persistent conversations that remain in message list forever
 * - Each user has isolated CometChat session
 * - Conversations created automatically when first message is sent
 * - Booking-based access control at the conversation level
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
  private isInitialized = false;
  private isLoggedIn = false;
  private CometChatUIKit: any = null;
  private UIKitSettingsBuilder: any = null;
  private CometChat: any = null;
  private currentUserId: string | null = null;

  constructor() {
    // Each instance is independent
  }

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
   * Initialize CometChat SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadCometChatSDK();

      const UIKitSettings = new this.UIKitSettingsBuilder()
        .setAppId(COMETCHAT_CONFIG.APP_ID)
        .setRegion(COMETCHAT_CONFIG.REGION)
        .setAuthKey(COMETCHAT_CONFIG.AUTH_KEY)
        .subscribePresenceForAllUsers()
        .build();

      await this.CometChatUIKit.init(UIKitSettings);
      this.isInitialized = true;
      console.log("CometChat UI Kit initialized successfully");
    } catch (error) {
      console.error("CometChat UI Kit initialization failed:", error);
      throw error;
    }
  }

  /**
   * Create CometChat user account (called immediately upon EquiEdge account creation)
   */
  async createUserAccount(uid: string, name: string, avatar?: string): Promise<void> {
    try {
      // Ensure CometChat is fully initialized before creating user
      if (!this.isInitialized) {
        await this.initialize();
      }

      const user = new this.CometChat.User(uid);
      user.setName(name);
      if (avatar) {
        user.setAvatar(avatar);
      }
      
      await this.CometChat.createUser(user, COMETCHAT_CONFIG.AUTH_KEY);
      console.log("✅ CometChat user account created:", { uid, name, avatar });
    } catch (error: any) {
      // If user already exists, that's fine
      if (error.code === 'ERR_UID_ALREADY_EXISTS' || error.code === 'ERR_UID_ALREADY_TAKEN') {
        console.log("User already exists in CometChat:", uid);
      } else {
        console.error("Error creating CometChat user:", error);
        throw error;
      }
    }
  }

  /**
   * Login user to CometChat (called when user accesses chat features)
   */
  async loginUser(uid: string, name: string, avatar?: string): Promise<void> {
    this.currentUserId = uid;

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Check if user is already logged in (CometChat recommended pattern)
      const loggedInUser = await this.CometChatUIKit.getLoggedinUser();
      
      if (!loggedInUser) {
        // No user logged in, proceed with login
        console.log("No existing session found, logging in user:", { uid, name, avatar });
        await this.CometChatUIKit.login(uid, COMETCHAT_CONFIG.AUTH_KEY);
        this.isLoggedIn = true;
        console.log("✅ CometChat login successful:", uid);
      } else {
        // User already logged in, check if it's the same user
        const currentLoggedInUid = loggedInUser.getUid();
        console.log("Found existing session for user:", currentLoggedInUid);
        
        if (currentLoggedInUid === uid) {
          // Same user, use existing session
          this.isLoggedIn = true;
          console.log("✅ Using existing session for user:", uid);
        } else {
          // Different user, logout and login new user
          console.log("🔄 Different user logged in, switching from", currentLoggedInUid, "to", uid);
          await this.CometChatUIKit.logout();
          await this.CometChatUIKit.login(uid, COMETCHAT_CONFIG.AUTH_KEY);
          this.isLoggedIn = true;
          console.log("✅ Switched to new user:", uid);
        }
      }
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
      const conversationRequest = new this.CometChat.ConversationsRequestBuilder()
        .setLimit(50)
        .build();

      const conversations = await conversationRequest.fetchNext();
      console.log("Direct conversations fetched:", conversations.length);
      return conversations;
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
      
      return hasHistory;
    } catch (error) {
      console.error("Failed to check booking history:", error);
      return false;
    }
  }

  /**
   * Get unread message count for notifications
   */
  async getUnreadCount(): Promise<number> {
    if (!this.isLoggedIn) {
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
          updated_at,
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
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error fetching user conversations:", error);
        return [];
      }

      console.log("Fetched conversations for user:", userId, "Count:", data?.length || 0);
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