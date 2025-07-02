// src/Pages/TeamChat.tsx
import React, { useState } from 'react';

interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

const TeamChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      const newMessage: Message = {
        sender: 'You',
        content: input,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages([...messages, newMessage]);
      setInput('');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Team Chat</h2>
      <div className="border rounded-lg h-96 overflow-y-auto p-4 bg-white shadow-sm mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="mb-2">
              <p className="text-sm text-gray-700">
                <strong>{msg.sender}</strong> [{msg.timestamp}]: {msg.content}
              </p>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default TeamChat;
