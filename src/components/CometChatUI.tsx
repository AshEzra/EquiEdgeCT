import { useState, useEffect, ReactNode } from 'react';

interface CometChatUIProps {
  children?: ReactNode;
}

const CometChatUI = ({ children }: CometChatUIProps) => {
  const [CometChatComponents, setCometChatComponents] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCometChatUI = async () => {
      try {
        // Dynamically import CometChat UI components
        const { CometChatUIKit } = await import("@cometchat/chat-uikit-react");
        setCometChatComponents({ CometChatUIKit });
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load CometChat UI components:", err);
        setError("Failed to load chat interface");
        setIsLoading(false);
      }
    };

    loadCometChatUI();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading chat interface...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!CometChatComponents) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Chat interface not available</p>
      </div>
    );
  }

  // Render the CometChat UI components
  return (
    <div className="h-full">
      {/* Example: You can render specific CometChat components here */}
      {/* <CometChatComponents.CometChatUIKit /> */}
      
      {/* For now, show a placeholder */}
      <div className="text-center py-8">
        <p className="text-gray-600">CometChat UI components loaded successfully!</p>
        <p className="text-sm text-gray-500 mt-2">
          Ready to implement specific chat features
        </p>
      </div>
      
      {children}
    </div>
  );
};

export default CometChatUI; 