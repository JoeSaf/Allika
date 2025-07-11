import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import EventCreationModal from '@/components/EventCreationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Calendar, MapPin, Users } from 'lucide-react';
import { getEvents, deleteEvent, setCurrentEvent, Event } from '@/utils/storage';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isUserLoggedIn, requireLogin } from '@/utils/auth';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Dashboard mounted, checking auth...');
    
    // Check if user is logged in
    if (!isUserLoggedIn()) {
      console.log('User not logged in, redirecting...');
      navigate(requireLogin('/dashboard'));
      return;
    }

    console.log('User is logged in, loading events...');
    loadEvents();
  }, [navigate]);

  const loadEvents = () => {
    try {
      console.log('Loading events from storage...');
      const storedEvents = getEvents();
      console.log('Loaded events:', storedEvents);
      setEvents(storedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error Loading Events",
        description: "There was a problem loading your events. Please try refreshing the page.",
        variant: "destructive"
      });
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = () => {
    if (!isUserLoggedIn()) {
      navigate(requireLogin('/dashboard'));
      return;
    }
    setShowCreateModal(true);
  };

  const handleDeleteEvent = (id: string) => {
    try {
      deleteEvent(id);
      loadEvents(); // Reload events after deletion
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "There was a problem deleting the event.",
        variant: "destructive"
      });
    }
  };

  const handleEditEvent = (id: string) => {
    try {
      setCurrentEvent(id);
      navigate(`/template/${id}`);
    } catch (error) {
      console.error('Error setting current event:', error);
      toast({
        title: "Error",
        description: "There was a problem opening the event editor.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      // Handle different date formats
      if (!dateString) return 'No date set';
      
      // If it's already a formatted string, return as is
      if (dateString.includes(',') || dateString.includes('th') || dateString.includes('st') || dateString.includes('nd') || dateString.includes('rd')) {
        return dateString;
      }
      
      // Try to parse as ISO date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString || 'Invalid Date';
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    // Reload events after modal closes (in case an event was created)
    loadEvents();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Loading your events...</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Your Events</h1>
            <p className="text-slate-300">Manage and track your events</p>
          </div>
          <Button 
            onClick={handleCreateEvent}
            className="bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        </div>

        {events.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No events yet</h3>
              <p className="text-slate-500 mb-6">Create your first event to get started with Alika</p>
              <Button 
                onClick={handleCreateEvent}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">{event.title}</CardTitle>
                      <div className="flex items-center text-slate-400 text-sm mb-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(event.date)}
                      </div>
                      {event.venue && (
                        <div className="flex items-center text-slate-400 text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.venue}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                        <DropdownMenuLabel className="text-slate-400">Actions</DropdownMenuLabel>
                        <DropdownMenuItem 
                          onClick={() => handleEditEvent(event.id)} 
                          className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                        >
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/preview-message')} 
                          className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                        >
                          Preview Messages
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/view-analytics')} 
                          className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                        >
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteEvent(event.id)} 
                          className="hover:bg-red-700 focus:bg-red-700 text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white capitalize">{event.type}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Time:</span>
                        <span className="text-white">{event.time}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Guests:</span>
                      <div className="flex items-center text-white">
                        <Users className="w-4 h-4 mr-1" />
                        {event.guests?.length || 0}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'active' ? 'bg-green-600 text-green-100' :
                        event.status === 'completed' ? 'bg-blue-600 text-blue-100' :
                        'bg-yellow-600 text-yellow-100'
                      }`}>
                        {event.status || 'draft'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <Button 
                      onClick={() => handleEditEvent(event.id)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Continue Editing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <EventCreationModal 
        open={showCreateModal} 
        onOpenChange={handleModalClose}
      />
    </div>
  );
};

export default Dashboard;