import { useState, useEffect, ReactNode } from 'react';
import CometChatService from '@/services/cometchatService';
import UserRegistrationService from '@/services/userRegistrationService';

interface CometChatWrapperProps {
  children: ReactNode;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  onReady?: (hasBookingHistory: boolean) => void;
  onError?: (error: Error) => void;
  renderNoHistory?: () => ReactNode;
}

const CometChatWrapper = ({ 
  children, 
  userId, 
  userName, 
  userAvatar, 
  onReady, 
  onError,
  renderNoHistory
}: CometChatWrapperProps) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasBookingHistory, setHasBookingHistory] = useState(false);

  useEffect(() => {
    const initializeCometChat = async () => {
      if (!userId) {
        console.log("No user ID provided, skipping CometChat initialization");
        setIsReady(true);
        onReady?.(false);
        return;
      }

      try {
        const cometChatService = new CometChatService();
        
        // Check if user has booking history for UI purposes
        const hasHistory = await cometChatService.checkBookingHistory(userId);
        setHasBookingHistory(hasHistory);
        
        // Ensure CometChat account exists (fallback in case registration failed)
        const userRegistrationService = new UserRegistrationService();
        await userRegistrationService.ensureCometChatAccount(userId, userName || 'User', userAvatar);
        
        // Always initialize CometChat and login user (accounts are created upon registration)
        await cometChatService.initialize();
        
        // Ensure we're logged out of any previous session first
        try {
          await cometChatService.logout();
          console.log("🔄 Logged out previous user session");
        } catch (logoutError) {
          console.log("No previous session to logout");
        }
        
        // Login user to CometChat (account should already exist from registration)
        await cometChatService.loginUser(userId, userName || 'User', userAvatar);
        
        setIsReady(true);
        onReady?.(hasHistory);
        console.log("✅ CometChat initialized and user logged in:", userId, "Has booking history:", hasHistory);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize CometChat');
        console.error("CometChat initialization error:", error);
        setError(error);
        onError?.(error);
      }
    };

    initializeCometChat();
  }, [userId, userName, userAvatar, onReady, onError]);

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">Failed to load chat system: {error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading chat system...</p>
      </div>
    );
  }

  // Show welcome page for users with no booking history
  if (!hasBookingHistory && renderNoHistory) {
    return <>{renderNoHistory()}</>;
  }

  // Show chat interface for users with booking history
  return <>{children}</>;
};

export default CometChatWrapper; 