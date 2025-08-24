// frontend/components/ChatInterface.js
'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatInterface({ storyId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! You can ask me anything about this story." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null); // To auto-scroll to the latest message

  // Effect to scroll down when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/chat/${storyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) {
        throw new Error('The persona could not respond.');
      }

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage = { role: 'assistant', content: "I'm sorry, I seem to have lost my train of thought." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Ask About This Story</h2>
      <div className="bg-gray-50 p-4 rounded-lg h-80 flex flex-col">
        {/* Message History */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-2xl max-w-xs md:max-w-md break-words ${msg.role === 'user' ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-500">
                    Thinking...
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleChatSubmit} className="mt-4 flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-violet-600 text-white px-4 py-2 rounded-r-lg hover:bg-violet-700 disabled:bg-gray-400"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}