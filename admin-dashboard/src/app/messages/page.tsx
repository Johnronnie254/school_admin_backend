'use client';

import { useState, } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MagnifyingGlassIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { messageService } from '@/services/messageService';
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
}

export default function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MessageFormData>();

  const { data: chatUsers = [], isLoading: isLoadingUsers } = useQuery<ChatUser[]>({
    queryKey: ['chatUsers'],
    queryFn: messageService.getChatUsers,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['messages', selectedUser?.id],
    queryFn: () => selectedUser ? messageService.getMessages(selectedUser.id) : Promise.resolve([]),
    enabled: !!selectedUser,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: MessageFormData) => messageService.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser?.id] });
      reset();
    },
    onError: (error: AxiosError | Error) => {
      console.error('Error sending message:', error);
      if (error instanceof AxiosError && error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const message = error instanceof AxiosError ? error.response?.data?.message : error.message;
        toast.error(message || 'Failed to send message');
      }
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => messageService.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser?.id] });
      toast.success('Message deleted successfully');
    },
    onError: (error: AxiosError | Error) => {
      console.error('Error deleting message:', error);
      if (error instanceof AxiosError && error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const message = error instanceof AxiosError ? error.response?.data?.message : error.message;
        toast.error(message || 'Failed to delete message');
      }
    },
  });

  const onSubmit = (data: MessageFormData) => {
    if (!selectedUser) return;
    console.log('Sending message to:', selectedUser);
    sendMessageMutation.mutate({ ...data, receiver: selectedUser.id });
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
      {/* Left sidebar - User list */}
      <div className="w-80 border-r border-gray-200 bg-white">
        <div className="p-4 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        <div className="overflow-y-auto h-[calc(100vh-12rem)]">
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
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedUser?.id === user.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                      {user.role}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right side - Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-medium text-gray-900">{selectedUser.name}</h2>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === selectedUser.id ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === selectedUser.id
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                      {message.sender !== selectedUser.id && (
                        <button
                          onClick={() => deleteMessageMutation.mutate(message.id)}
                          className="mt-1 text-xs text-red-400 hover:text-red-500"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
                <input
                  type="text"
                  {...register('content', { required: 'Message is required' })}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
} 