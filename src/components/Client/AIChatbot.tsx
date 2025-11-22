import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { getChatbotRecommendation } from '../../services/orderMomentumService';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  products?: Product[];
  timestamp: Date;
}

export const AIChatbot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 Bonjour! Je suis votre assistant intelligent. Comment puis-je vous aider à trouver les meilleurs produits aujourd\'hui?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await getChatbotRecommendation(inputText, user.id);

      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.message,
          isBot: true,
          products: response.products,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      setIsTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const quickSuggestions = [
    '🍺 Quelle bière est populaire?',
    '💰 Produits pas chers',
    '⭐ Recommandations',
    '🔥 Tendances du moment'
  ];

  return (
    <>
      {/* Floating chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white z-40"
          >
            <MessageCircle className="h-8 w-8" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">Assistant IA</h3>
                    <div className="flex items-center gap-1 text-xs">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      <span>En ligne</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.isBot 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : 'bg-gradient-to-br from-orange-500 to-orange-600'
                    }`}>
                      {message.isBot ? (
                        <Bot className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className={`rounded-2xl p-3 ${
                        message.isBot 
                          ? 'bg-white text-gray-900' 
                          : 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      </div>

                      {/* Product recommendations */}
                      {message.products && message.products.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.products.map((product) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white p-3 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {product.imageUrl && (
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name}
                                    className="h-12 w-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm text-gray-900">{product.name}</h4>
                                  <p className="text-xs text-gray-600">{product.brand}</p>
                                  <p className="text-sm font-bold text-orange-600 mt-1">
                                    {product.cratePrice.toLocaleString()} FCFA
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl p-3">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="h-2 w-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="h-2 w-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          className="h-2 w-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 bg-white border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Suggestions rapides:</p>
                <div className="flex flex-wrap gap-2">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputText(suggestion);
                        setTimeout(() => handleSend(), 100);
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Posez votre question..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
