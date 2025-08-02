import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, Mail, ArrowLeft } from "lucide-react";
import TopBar from "@/components/TopBar";
import CometChatWrapper from "@/components/CometChatWrapper";
import { CometChatSelector } from "@/CometChatSelector/CometChatSelector";
import {
  CometChatMessageComposer,
  CometChatMessageHeader,
  CometChatMessageList,
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useIsMobile } from "@/hooks/use-mobile";
import '@cometchat/chat-uikit-react/css-variables.css';
import '@/styles/cometchat-input.css';

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading, isError } = useUserProfile();
  const isMobile = useIsMobile();
  
  // State to track the currently selected user
  const [selectedUser, setSelectedUser] = useState<CometChat.User | undefined>(undefined);

  // State to track the currently selected group
  const [selectedGroup, setSelectedGroup] = useState<CometChat.Group | undefined>(undefined);

  // Mobile state to track if we're viewing conversation list or chat
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

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

  // Main messages interface for users with booking history
  const renderMessagesInterface = () => {
    // Mobile layout - single panel design
    if (isMobile) {
      return (
        <div className="h-[calc(100vh-4rem)]">
          {/* Mobile Conversation List View */}
          {mobileView === 'list' && (
            <div className="h-full bg-white">
              <CometChatSelector
                key={`selector-${profile?.id || 'unknown'}`}
                onSelectorItemClicked={(activeItem) => {
                  let item = activeItem;

                  // If the selected item is a conversation, extract the user/group from it
                  if (activeItem instanceof CometChat.Conversation) {
                    item = activeItem.getConversationWith();
                  }

                  console.log("🔍 Messages - Selected item:", item);
                  console.log("🔍 Messages - Item type:", item?.constructor?.name);
                  console.log("🔍 Messages - Item UID:", (item as any)?.getUid?.());

                  // Determine if the selected item is a User or a Group and update the state accordingly
                  if (item instanceof CometChat.User) {
                    setSelectedUser(item as CometChat.User);
                    setSelectedGroup(undefined);
                    setMobileView('chat');
                    console.log("✅ Messages - User selected:", item.getUid());
                  } else if (item instanceof CometChat.Group) {
                    setSelectedUser(undefined);
                    setSelectedGroup(item as CometChat.Group);
                    setMobileView('chat');
                    console.log("✅ Messages - Group selected:", item.getGuid());
                  } else {
                    setSelectedUser(undefined);
                    setSelectedGroup(undefined);
                    console.log("❌ Messages - Invalid selection");
                  }
                }}
              />
            </div>
          )}

          {/* Mobile Chat View */}
          {mobileView === 'chat' && (selectedUser || selectedGroup) && (
            <div className="h-full bg-gray-50 flex flex-col">
              {/* Mobile Header with back button */}
              <div className="flex items-center p-4 bg-white border-b border-gray-200">
                <button
                  onClick={() => {
                    setMobileView('list');
                    setSelectedUser(undefined);
                    setSelectedGroup(undefined);
                  }}
                  className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedUser?.getName() || selectedGroup?.getName() || 'Chat'}
                  </h2>
                </div>
              </div>
              
              {/* Message list */}
              <CometChatMessageList user={selectedUser} group={selectedGroup} />
              
              {/* Message input composer */}
              <div className="flex-shrink-0 p-4 bg-gray-50">
                <CometChatMessageComposer user={selectedUser} group={selectedGroup} />
              </div>
            </div>
          )}

          {/* Mobile Placeholder when no conversation selected */}
          {mobileView === 'chat' && !selectedUser && !selectedGroup && (
            <div className="h-full bg-gray-50 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="w-20 h-20 border-2 border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Your messages</h2>
                <p className="text-gray-600 mb-6">Directly interact with your experts here!</p>
                <button
                  onClick={() => navigate('/experts')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Find an expert
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Desktop layout - dual panel design
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - CometChat Conversation List */}
        <div className="w-1/3 bg-white border-r border-gray-200">
          <CometChatSelector
            key={`selector-${profile?.id || 'unknown'}`}
            onSelectorItemClicked={(activeItem) => {
              let item = activeItem;

              // If the selected item is a conversation, extract the user/group from it
              if (activeItem instanceof CometChat.Conversation) {
                item = activeItem.getConversationWith();
              }

              console.log("🔍 Messages - Selected item:", item);
              console.log("🔍 Messages - Item type:", item?.constructor?.name);
              console.log("🔍 Messages - Item UID:", (item as any)?.getUid?.());

              // Determine if the selected item is a User or a Group and update the state accordingly
              if (item instanceof CometChat.User) {
                setSelectedUser(item as CometChat.User);
                setSelectedGroup(undefined); // Ensure no group is selected
                console.log("✅ Messages - User selected:", item.getUid());
              } else if (item instanceof CometChat.Group) {
                setSelectedUser(undefined); // Ensure no user is selected
                setSelectedGroup(item as CometChat.Group);
                console.log("✅ Messages - Group selected:", item.getGuid());
              } else {
                setSelectedUser(undefined);
                setSelectedGroup(undefined); // Reset if selection is invalid
                console.log("❌ Messages - Invalid selection");
              }
            }}
          />
        </div>

        {/* Right Panel - Chat Interface or Placeholder */}
        {selectedUser || selectedGroup ? (
          <div className="flex-1 bg-gray-50 flex flex-col h-full">
            {/* Header displaying user/group details */}
            <CometChatMessageHeader user={selectedUser} group={selectedGroup} />
            
            {/* List of messages for the selected user/group - takes remaining space */}
            <CometChatMessageList user={selectedUser} group={selectedGroup} />
            
            {/* Message input composer - stays at bottom */}
            <div className="flex-shrink-0 p-4 bg-gray-50">
              <CometChatMessageComposer user={selectedUser} group={selectedGroup} />
            </div>
          </div>
        ) : (
          // Default message when no conversation is selected
          <div className="flex-1 bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 border-2 border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your messages</h2>
              <p className="text-gray-600 mb-6">Directly interact with your experts here!</p>
              <button
                onClick={() => navigate('/experts')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Find an expert
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar showSearchBar={true} />
      <main className="bg-white min-h-[calc(100vh-4rem)]">
        <CometChatWrapper
          userId={profile.id}
          userName={userName}
          userAvatar={user.user_metadata?.avatar_url}
          onReady={(hasBookingHistory) => {
            console.log("CometChat ready for user:", profile.id, "Has booking history:", hasBookingHistory);
          }}
          onError={(error) => console.error("CometChat error:", error)}
          renderNoHistory={renderWelcomePage}
        >
          {renderMessagesInterface()}
        </CometChatWrapper>
      </main>
    </div>
  );
};

export default Messages;