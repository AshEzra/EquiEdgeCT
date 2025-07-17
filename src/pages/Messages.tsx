import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Send, Paperclip, Mic, Search } from "lucide-react";

// Mock conversation data
const CONVERSATIONS = [
  {
    id: 1,
    expertId: 'bruno-diniz',
    expertName: 'Bruno Diniz Das Neves',
    status: 'active',
    lastMessage: "He's jumping great! My only advice is to get him into the ring when it's open in...",
    timestamp: '1:30PM',
    unreadCount: 2,
    planType: '1 Week Coaching',
    timeRemaining: '4 days remaining'
  },
  {
    id: 2,
    expertId: 'tammy-provost',
    expertName: 'Tammy Provost',
    status: 'offline',
    lastMessage: 'Voice call',
    timestamp: '1/1/2025',
    unreadCount: 0,
    planType: '30min Session',
    timeRemaining: null
  },
  {
    id: 3,
    expertId: 'laura-kraut',
    expertName: 'Laura Kraut',
    status: 'expired',
    lastMessage: 'Thank you!! Truly appreciate your help!',
    timestamp: '12/4/2024',
    unreadCount: 0,
    planType: '1 Week Coaching',
    timeRemaining: null
  }
];

const MESSAGES = [
  {
    id: 1,
    sender: 'expert',
    content: "He's definitely more focused when I get him quiet. I didn't ride him much in the AM before my class and he was sort of all over the place even in the warmup ring. My friend was standing outside the ring and he supposedly stared at her as I was... basically going to stick to the routine of riding him hard the mornings that he shows and taking my time warming up and I probably should've worked him harder yesterday rather than basically giving him a day off thinking he might be tired from showing two days in a row and I had worked him for hours each time before I showed those days",
    timestamp: 'Today at 1:30PM',
    edited: true
  },
  {
    id: 2,
    sender: 'user',
    content: "I am IMPRESSED!",
    timestamp: 'Today at 1:30PM'
  }
];

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const selectedConv = CONVERSATIONS.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In real app, send message via API
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/experts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              EquiEdge
            </Button>
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Sort by: <span className="text-foreground">Latest First</span>
          </p>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {CONVERSATIONS.filter(conv => 
            conv.expertName.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                selectedConversation === conversation.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {conversation.expertName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  {conversation.status === 'active' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-card"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground truncate">
                      {conversation.expertName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {conversation.timestamp}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {conversation.lastMessage}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={conversation.status === 'expired' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {conversation.status === 'expired' ? 'Expired' : conversation.planType}
                    </Badge>
                    {conversation.timeRemaining && (
                      <span className="text-xs text-muted-foreground">
                        {conversation.timeRemaining}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Find Expert Button */}
        <div className="p-4 border-t border-border">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">E</span>
              </div>
            </div>
            <p className="text-sm text-foreground font-medium mb-1">Your messages</p>
            <p className="text-xs text-muted-foreground">Directly interact with your experts here!</p>
          </div>
          <Button 
            onClick={() => navigate('/experts')}
            className="w-full"
          >
            Find an expert
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-card border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {selectedConv.expertName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedConv.expertName}</h2>
                    <span className="text-sm text-success">Online now</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">📞</Button>
                  <Button variant="ghost" size="sm">ℹ️</Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {MESSAGES.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">{message.timestamp}</span>
                      {message.edited && (
                        <span className="text-xs opacity-70">Edited</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="bg-card border-t border-border p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Send message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button variant="ghost" size="sm">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;