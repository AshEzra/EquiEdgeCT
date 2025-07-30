import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle } from "lucide-react";
import TopBar from "@/components/TopBar";
import CometChatWrapper from "@/components/CometChatWrapper";
import CometChatUI from "@/components/CometChatUI";
import { useUserProfile } from "@/contexts/UserProfileContext";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading, isError } = useUserProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar showSearchBar={true} />
        <main className="flex flex-col items-center justify-center bg-white min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !user || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar showSearchBar={true} />
        <main className="flex flex-col items-center justify-center bg-white min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Profile Error</h3>
              <p className="text-red-600 mb-4">Unable to load your profile. Please try again.</p>
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

  const userName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email || 'User';

  // Welcome page for users with no booking history
  const renderWelcomePage = () => (
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
  );

  return (
    <div className="min-h-screen bg-white">
      <TopBar showSearchBar={true} />
      <main className="bg-white min-h-[calc(100vh-4rem)]">
        <CometChatWrapper
          userId={profile.id}
          userName={userName}
          userAvatar={user.user_metadata?.avatar_url}
          onReady={(hasBookingHistory) => console.log("CometChat ready for user:", profile.id, "Has booking history:", hasBookingHistory)}
          onError={(error) => console.error("CometChat error:", error)}
          renderNoHistory={renderWelcomePage}
        >
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                  <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
                </div>
                <p className="mt-2 text-gray-600">
                  Connect with experts and manage your conversations
                </p>
              </div>

              <div className="p-6">
                <CometChatUI />
              </div>
            </div>
          </div>
        </CometChatWrapper>
      </main>
    </div>
  );
};

export default Messages;