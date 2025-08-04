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
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-xl shadow-soft mb-8 animate-pulse border border-blue-400/20">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-soft">
            <CalendarIcon className="h-6 w-6 text-white/70" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-white/20 rounded w-32"></div>
            <div className="h-3 bg-white/10 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error in EventBanner:', error);
    return (
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6 rounded-xl shadow-soft mb-8 animate-fade-in border border-red-400/20">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-soft">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <span className="font-semibold">Failed to load events</span>
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
    <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-soft mb-8 relative overflow-hidden animate-fade-in border border-blue-400/20 backdrop-blur-sm">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl w-fit shadow-soft border border-white/10">
            <CalendarIcon className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl sm:text-2xl mb-2 text-balance text-white">{currentEvent.title}</h3>
            <p className="text-sm sm:text-base text-white/90 mb-3 leading-relaxed text-pretty">{currentEvent.description}</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-white/80">{/* Rest continues as before */}
              <div className="flex items-center space-x-1">
                <span className="font-semibold">From:</span>
                <span>{new Date(currentEvent.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-semibold">To:</span>
                <span>{new Date(currentEvent.end_date).toLocaleDateString()}</span>
              </div>
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-semibold border border-white/10 shadow-soft">
                {currentEvent.event_type}
              </div>
            </div>
          </div>
          
          {events.length > 1 && (
            <div className="flex space-x-2 justify-center sm:justify-start">
              {events.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentEventIndex(index)}
                  className={`h-3 w-3 rounded-full transition-all duration-300 shadow-soft ${
                    index === currentEventIndex 
                      ? 'bg-white shadow-soft scale-110 border border-white/20' 
                      : 'bg-white/40 hover:bg-white/60 border border-white/10'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 