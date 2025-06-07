'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MagnifyingGlassIcon, PaperAirplaneIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { messageService } from '@/services/messageService';
import { authService } from '@/services/auth.service';
import { User } from '@/types';
import { AxiosError } from 'axios';

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
}

interface MessageFormData {
  content: string;
  receiver: string;
  receiver_email: string;
  receiver_role: string;
}

export default function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MessageFormData>();

  // ✅ Chat users with auto-refresh
  const { data: chatUsers = [], isLoading: isLoadingUsers } = useQuery<ChatUser[]>({
    queryKey: ['chatUsers'],
    queryFn: messageService.getChatUsers,
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // ✅ Messages with smart polling - more frequent when chat is active
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['messages', selectedUser?.id],
    queryFn: () => selectedUser ? messageService.getMessages(selectedUser.id) : Promise.resolve([]),
    enabled: !!selectedUser,
    refetchInterval: selectedUser && isWindowFocused ? 3000 : 10000, // 3s when active, 10s when not
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    // ✅ Use placeholderData instead of keepPreviousData
    placeholderData: [],
  });

  // ✅ Window focus tracking for smart polling
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // ✅ Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Get current user info
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        console.log('📱 Current user loaded:', user);
      } catch (error) {
        console.error('❌ Failed to get current user:', error);
      }
    };
    getUserInfo();
  }, []);

  // ✅ Optimistic message sending
  const sendMessageMutation = useMutation({
    mutationFn: (data: MessageFormData) => messageService.sendMessage(data),
    onMutate: async (newMessage) => {
      if (!selectedUser || !currentUser) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', selectedUser.id] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', selectedUser.id]);

      // Optimistically update the cache
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`, // Temporary ID
        sender: currentUser.id,
        receiver: selectedUser.id,
        content: newMessage.content,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(['messages', selectedUser.id], (old = []) => [
        ...old,
        optimisticMessage,
      ]);

      return { previousMessages };
    },
    onSuccess: (newMessage, _variables, _context) => {
      // Replace the optimistic message with the real one
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser?.id] });
      reset();
      console.log('✅ Message sent successfully:', newMessage);
    },
    onError: (error: AxiosError | Error, _variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', selectedUser?.id], context.previousMessages);
      }
      
      console.error('❌ Error sending message:', error);
      if (error instanceof AxiosError && error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const message = error instanceof AxiosError ? 
          error.response?.data?.error || error.response?.data?.message : 
          error.message;
        toast.error(message || 'Failed to send message');
      }
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => messageService.deleteMessage(messageId),
    onMutate: async (messageId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', selectedUser?.id] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', selectedUser?.id]);

      // Optimistically remove the message
      queryClient.setQueryData<Message[]>(['messages', selectedUser?.id], (old = []) =>
        old.filter(msg => msg.id !== messageId)
      );

      return { previousMessages };
    },
    onSuccess: () => {
      toast.success('Message deleted successfully');
    },
    onError: (error: AxiosError | Error, _variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', selectedUser?.id], context.previousMessages);
      }
      
      console.error('❌ Error deleting message:', error);
      if (error instanceof AxiosError && error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const message = error instanceof AxiosError ? 
          error.response?.data?.error || error.response?.data?.message : 
          error.message;
        toast.error(message || 'Failed to delete message');
      }
    },
  });

  const onSubmit = (data: MessageFormData) => {
    if (!selectedUser) return;
    console.log('📤 Sending message to:', selectedUser);
    console.log('📤 From current user:', currentUser?.id);
    
    sendMessageMutation.mutate({ 
      ...data, 
      receiver: selectedUser.id,
      receiver_email: selectedUser.email,
      receiver_role: selectedUser.role 
    });
  };

  // ✅ Force refresh function
  const refreshMessages = () => {
    if (selectedUser) {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser.id] });
    }
    queryClient.invalidateQueries({ queryKey: ['chatUsers'] });
  };

  // Get unique roles from users
  const availableRoles = Array.from(new Set(chatUsers.map(user => user.role)));

  // Toggle role selection
  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const filteredUsers = chatUsers.filter(user => {
    // Filter by search query
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by selected roles (if any are selected)
    const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(user.role);
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Messages List - Hidden on mobile when chat is open */}
      <div className={`${selectedUser ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-gray-200 bg-white`}>
        <div className="p-4 space-y-4">
          {/* ✅ Added refresh button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button
              onClick={refreshMessages}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          {/* Role filter toggles */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Filter by role:</p>
            <div className="flex flex-wrap gap-2">
              {availableRoles.map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                    selectedRoles.includes(role)
                      ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ Real-time indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isWindowFocused ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>{isWindowFocused ? 'Live updates active' : 'Updates paused'}</span>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-16rem)]">
          {isLoadingUsers ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser?.id === user.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{user.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'teacher' 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-purple-600 bg-purple-100'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chat Area - Full width on mobile */}
      <div className={`${selectedUser ? 'block' : 'hidden md:block'} flex-1 flex flex-col bg-gray-50`}>
        {selectedUser ? (
          <>
            {/* Chat header with back button on mobile */}
            <div className="border-b border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeftIcon className="h-6 w-6 text-gray-500" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{selectedUser.name}</h2>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                
                {/* ✅ Chat-specific refresh and status */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Auto-refresh: 3s</span>
                  </div>
                  <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['messages', selectedUser.id] })}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="Refresh chat"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Start a conversation with {selectedUser.name}!</p>
                </div>
              ) : (
                <>
                  {messages.map((message: Message) => {
                    // ✅ FIXED: Proper message identification logic
                    const isMyMessage = currentUser && message.sender === currentUser.id;
                    const isOptimistic = message.id.startsWith('temp-');
                    
                    console.log(`📨 Message ${message.id}:`, {
                      sender: message.sender,
                      currentUserId: currentUser?.id,
                      selectedUserId: selectedUser.id,
                      isMyMessage,
                      isOptimistic
                    });

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isMyMessage ? 'justify-end' : 'justify-start'
                        } animate-fade-in`}
                      >
                        <div className={`flex items-end gap-2 max-w-[70%] ${
                          isMyMessage ? 'flex-row-reverse' : 'flex-row'
                        }`}>
                          {/* Avatar for other person's messages */}
                          {!isMyMessage && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-medium">
                                {selectedUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                              isMyMessage
                                ? `${isOptimistic ? 'bg-blue-400 opacity-70' : 'bg-blue-600'} text-white rounded-br-md`
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                            <div className={`flex items-center justify-between mt-2 ${
                              isMyMessage ? 'flex-row-reverse' : 'flex-row'
                            }`}>
                              <p className={`text-xs ${
                                isMyMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {isOptimistic ? 'Sending...' : new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {isMyMessage && !isOptimistic && (
                                <button
                                  onClick={() => deleteMessageMutation.mutate(message.id)}
                                  className="ml-2 text-blue-200 hover:text-red-300 transition-colors"
                                  title="Delete message"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* ✅ Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 bg-white p-4">
              <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3 items-end">
                <div className="flex-1">
                  <input
                    type="text"
                    {...register('content', { required: 'Message is required' })}
                    placeholder={`Type a message to ${selectedUser.name}...`}
                    className="w-full rounded-full border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    disabled={sendMessageMutation.isPending}
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  ) : (
                    <PaperAirplaneIcon className="h-5 w-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <MagnifyingGlassIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Conversation</h3>
              <p className="text-sm text-gray-500">Select a user from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 