import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import CometChatService from "@/services/cometchatService";
import { supabase } from "@/integrations/supabase/client";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBookingHistory, setHasBookingHistory] = useState(false);
  const [isCometChatReady, setIsCometChatReady] = useState(false);

  // Check for booking history and initialize CometChat only if needed
  useEffect(() => {
    const checkBookingHistoryAndInitialize = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Get the user's profile ID (not auth user ID)
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !userProfile) {
          console.error('Error fetching user profile:', profileError);
          setError("Unable to verify your profile. Please try again.");
          return;
        }

        const cometChatService = CometChatService.getInstance();
        
        // Check if user has any booking history using profile ID
        const hasHistory = await cometChatService.checkBookingHistory(userProfile.id);
        setHasBookingHistory(hasHistory);

        if (hasHistory) {
          // Only initialize CometChat if user has booking history
          await cometChatService.initialize();
          
          // Login user to CometChat using profile ID
          const userName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email || 'User';
          await cometChatService.loginUser(userProfile.id, userName, user.user_metadata?.avatar_url);
          
          setIsCometChatReady(true);
          console.log("CometChat ready for user with booking history:", userProfile.id);
        } else {
          console.log("No booking history found for user:", userProfile.id);
        }
      } catch (error) {
        console.error("Failed to check booking history or initialize CometChat:", error);
        setError("Failed to load chat system. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkBookingHistoryAndInitialize();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar showSearchBar={true} />
        <main className="flex flex-col items-center justify-center bg-white min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking your sessions...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar showSearchBar={true} />
        <main className="flex flex-col items-center justify-center bg-white min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Chat System Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show welcome page for users with no booking history
  if (!hasBookingHistory) {
  return (
    <div className="min-h-screen bg-white">
      <TopBar showSearchBar={true} />
      <main className="flex flex-col items-center bg-white min-h-[calc(100vh-4rem)]">
          <div className="bg-black rounded-2xl shadow-lg flex flex-col items-start justify-start p-12 min-w-[400px] min-h-[260px] mt-12 relative">
            <h2 className="text-2xl font-semibold text-white mb-4 text-left w-full">Hello!</h2>
            <p className="text-xl text-white text-left w-full mb-2">
              Once you book an expert, your 1:1 coaching sessions will take place here!
            </p>
            <div className="absolute right-8" style={{ bottom: '32px' }}>
              <div className="w-16 h-16 rounded-full bg-[#353841] flex items-center justify-center relative">
                <MessageCircle className="w-8 h-8 text-white opacity-90" />
                <span className="absolute right-0 bottom-0 w-7 h-7 bg-[#D1D5DB] rounded-full flex items-center justify-center border-4 border-[#353841]">
                  <span className="text-lg font-bold text-black">!</span>
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show loading while CometChat initializes for users with booking history
  if (!isCometChatReady) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar showSearchBar={true} />
        <main className="flex flex-col items-center justify-center bg-white min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your chat history...</p>
          </div>
        </main>
      </div>
    );
  }

  // Render CometChat UI when everything is ready
  return (
    <div className="min-h-screen bg-white">
      <TopBar showSearchBar={true} />
      <main className="flex flex-col bg-white min-h-[calc(100vh-4rem)]">
        <div className="flex-1">
          {/* TODO: Render actual CometChat UI component here */}
          <div className="text-center py-8">
            <p className="text-gray-600">Chat interface ready! Next: Implement CometChat UI component.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;