'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  PaperAirplaneIcon, 
  TrashIcon,
  UserCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { messageService, type Message, type MessageFormData, type ChatUser } from '@/services/messageService';

export default function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MessageFormData>();

  // Fetch chat users
  const { data: chatUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['chatUsers'],
    queryFn: messageService.getChatUsers
  });

  // Filter users based on search term
  const filteredUsers = chatUsers.filter((user: ChatUser) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch chat history with selected user
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedUser?.id],
    queryFn: () => selectedUser ? messageService.getChatHistory(selectedUser.id) : Promise.resolve([]),
    enabled: !!selectedUser
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: messageService.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser?.id] });
      reset();
      scrollToBottom();
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to send message');
      }
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: messageService.deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser?.id] });
      toast.success('Message deleted successfully');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to delete message');
      }
    }
  });

  const onSubmit = (data: MessageFormData) => {
    if (!selectedUser) return;
    
    sendMessageMutation.mutate({
      receiver: selectedUser.id,
      content: data.content
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessageMutation.mutate(id);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Users List */}
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Messages</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((user: ChatUser) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-4 flex items-center gap-3 border-b border-gray-100 transition-colors ${
                selectedUser?.id === user.id
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <UserCircleIcon className="h-12 w-12 text-gray-400" />
                <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  Math.random() > 0.5 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500 truncate">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3">
              <div className="relative">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">{selectedUser.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === selectedUser.id ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        message.sender === selectedUser.id
                          ? 'bg-white shadow-sm'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <p className="break-words">{message.content}</p>
                        {message.sender !== selectedUser.id && (
                          <button
                            onClick={() => handleDelete(message.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-200"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          message.sender === selectedUser.id
                            ? 'text-gray-400'
                            : 'text-blue-100'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-4 bg-white border-t border-gray-100"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('content', { required: 'Message is required' })}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <UserCircleIcon className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Choose a user from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
} 