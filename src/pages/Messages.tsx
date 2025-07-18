import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import equiLogo from "@/assets/equi-logo.png";
import { MessageCircle, User, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ExpertSearch from "@/components/ExpertSearch";
import { useState } from "react";
import TopBar from "@/components/TopBar";

const Messages = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  // Placeholder for real conversations
  const CONVERSATIONS: any[] = [];

  // Basic messaging state/logic
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In real app, send message via API
      setMessageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar showSearchBar={true} />
      <main className="flex flex-col items-center bg-white min-h-[calc(100vh-4rem)]">
        {CONVERSATIONS.length === 0 ? (
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
        ) : (
          <div className="w-full flex flex-col items-center justify-center mt-12">
            {/* Placeholder for chat UI, will use selectedConversation, messageInput, etc. */}
            <div className="text-muted-foreground">Chat UI goes here</div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;