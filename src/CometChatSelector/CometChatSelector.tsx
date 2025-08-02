import { useEffect, useState } from "react";
import {
  Conversation,
  Group,
  User,
  CometChat,
} from "@cometchat/chat-sdk-javascript";
import {
  CometChatConversations,
  CometChatUIKitLoginListener,
} from "@cometchat/chat-uikit-react";
import "./CometChatSelector.css";

// Define the props for the CometChatSelector component
interface SelectorProps {
  onSelectorItemClicked?: (
    input: User | Group | Conversation,
    type: string
  ) => void;
  onHide?: () => void;
  onNewChatClicked?: () => void;
}

// CometChatSelector component
export const CometChatSelector = (props: SelectorProps) => {
  // Destructure props with a default function for onSelectorItemClicked
  const { onSelectorItemClicked = () => {} } = props;

  // State to store the logged-in user
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>();

  // State to track the currently selected item (it can be a Conversation, User, or Group)
  const [activeItem, setActiveItem] = useState<
    CometChat.Conversation | CometChat.User | CometChat.Group | undefined
  >();

  // useEffect hook to fetch and set the logged-in user
  useEffect(() => {
    const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
    console.log("🔍 CometChatSelector - Logged in user:", loggedInUser?.getUid());
    setLoggedInUser(loggedInUser);
  }, []); // Remove dependency to prevent infinite re-renders

  return (
    <>
      {/* Render chat conversations if a user is logged in */}
      {loggedInUser && (
        <>
          <CometChatConversations
            activeConversation={
              activeItem instanceof CometChat.Conversation
                ? activeItem
                : undefined
            }
            onItemClick={(e) => {
              console.log("🔍 CometChatSelector - Conversation clicked:", e);
              setActiveItem(e); // Update the active item when an item is clicked
              onSelectorItemClicked(e, "updateSelectedItem"); // Notify parent component
            }}
          />
        </>
      )}
    </>
  );
}; 