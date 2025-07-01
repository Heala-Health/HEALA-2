
import React from 'react';
import { ConversationList } from './chat/ConversationList';
import { ChatWindow } from './chat/ChatWindow';
import { useAgentChat } from './chat/hooks/useAgentChat';

export const AgentChatInterface: React.FC = () => {
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    loading,
    sendMessage
  } = useAgentChat();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onConversationSelect={setSelectedConversation}
        loading={loading}
      />
      <ChatWindow
        selectedConversation={selectedConversation}
        messages={messages}
        onSendMessage={sendMessage}
      />
    </div>
  );
};
