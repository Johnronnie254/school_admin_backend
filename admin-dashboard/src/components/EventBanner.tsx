import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  event_type: string;
}

export function EventBanner() {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const { data: events = [], isLoading, error } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        console.log('Fetching events...');
        const response = await apiClient.get('/api/school-events/');
        console.log('Events response:', response.data);
        return response.data.results || [];
      } catch (error) {
        console.error('Error fetching events:', error);
        throw error; // Let React Query handle the error
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    if (events.length === 0) return;

    const interval = setInterval(() => {
      setCurrentEventIndex((prevIndex) => 
        prevIndex === events.length - 1 ? 0 : prevIndex + 1
      );
    }, 40000); // 40 seconds

    return () => clearInterval(interval);
  }, [events.length]);

  // Debug output
  console.log('EventBanner render:', { events, isLoading, error, currentEventIndex });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-lg mb-6">
        <div className="animate-pulse flex items-center justify-center">
          <CalendarIcon className="h-6 w-6 text-white/50" />
          <span className="ml-2">Loading events...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error in EventBanner:', error);
    return (
      <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg mb-6">
        <div className="flex items-center justify-center">
          <CalendarIcon className="h-6 w-6" />
          <span className="ml-2">Failed to load events</span>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    console.log('No events available');
    return null;
  }

  const currentEvent = events[currentEventIndex];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-lg mb-6">
      <div className="flex items-center space-x-4">
        <div className="bg-white/20 rounded-full p-2">
          <CalendarIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{currentEvent.title}</h3>
          <p className="text-sm text-white/80">{currentEvent.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-white/70">
            <span>From: {new Date(currentEvent.start_date).toLocaleDateString()}</span>
            <span>To: {new Date(currentEvent.end_date).toLocaleDateString()}</span>
            <span className="bg-white/20 px-2 py-1 rounded">{currentEvent.event_type}</span>
          </div>
        </div>
        <div className="flex space-x-1">
          {events.map((_, index) => (
            <div 
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentEventIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 