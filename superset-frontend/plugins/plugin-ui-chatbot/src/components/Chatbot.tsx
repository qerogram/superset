/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { useState, useRef, useEffect } from 'react';
import { styled } from '@superset-ui/core';

const ChatbotContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
`;

const ChatbotButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 24px;
  
  &:hover {
    background: #40a9ff;
  }
`;

const ChatWindow = styled.div`
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 16px;
  background: #1890ff;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 20px;
  padding: 0;
  width: 24px;
  height: 24px;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Message = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  background: ${({ isUser }) => (isUser ? '#1890ff' : '#f0f0f0')};
  color: ${({ isUser }) => (isUser ? 'white' : '#333')};
  align-self: ${({ isUser }) => (isUser ? 'flex-end' : 'flex-start')};
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Noto Sans KR', sans-serif;
  line-height: 1.5;
`;

const ChatInputContainer = styled.div`
  padding: 16px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  gap: 8px;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Noto Sans KR', sans-serif;
  
  &:focus {
    outline: none;
    border-color: #40a9ff;
  }
`;

const SendButton = styled.button`
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #40a9ff;
  }
  
  &:disabled {
    background: #d9d9d9;
    cursor: not-allowed;
  }
`;

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('superset_chat_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('superset_chat_session_id', sessionId);
  }
  return sessionId;
};

// Get API URL from localStorage or use default
const getApiUrl = (): string => {
  return localStorage.getItem('chatbot_api_url') || 'https://api.4edu.co.kr/query';
};

export default function SimpleChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('superset_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      } catch {
        // Ignore error
      }
    }
    return [
      {
        id: '1',
        text: 'Hello! I am your Superset assistant. How can I help you today?',
        isUser: false,
        timestamp: new Date(),
      },
    ];
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      localStorage.setItem('superset_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');

    // Get conversation history
    const conversationHistory = messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));

    try {
      const apiUrl = getApiUrl();
      
      // Create AbortController for timeout (5 minutes = 300000ms)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        signal: controller.signal, // Add abort signal
        body: JSON.stringify({
          question: messageText,  // Changed from 'message' to 'question'
          session_id: getSessionId(),
          user_id: window.localStorage.getItem('userId') || 'anonymous',
          conversation_history: conversationHistory
        }),
      });

      // Clear timeout if request succeeds
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.answer || 'Sorry, I could not process your request.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorText = 'Sorry, I encountered an error. Please try again.';
      if (error.name === 'AbortError') {
        errorText = 'Request timed out after 5 minutes. The query might be too complex. Please try a simpler question.';
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Check if IME is composing (for Korean, Chinese, Japanese input)
    if (e.nativeEvent.isComposing) {
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ChatbotContainer>
      {isOpen && (
        <ChatWindow>
          <ChatHeader>
            <span>Superset Assistant</span>
            <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
          </ChatHeader>
          <ChatMessages>
            {messages.map(message => (
              <Message key={message.id} isUser={message.isUser}>
                {message.text}
              </Message>
            ))}
            <div ref={messagesEndRef} />
          </ChatMessages>
          <ChatInputContainer>
            <ChatInput
              type="text"
              placeholder="Type2 your message..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <SendButton onClick={handleSend} disabled={!inputValue.trim()}>
              Send
            </SendButton>
          </ChatInputContainer>
        </ChatWindow>
      )}
      <ChatbotButton onClick={() => setIsOpen(!isOpen)}>
        💬
      </ChatbotButton>
    </ChatbotContainer>
  );
}
