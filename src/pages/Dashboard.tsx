import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import EventCreationModal from '@/components/EventCreationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { getEvents, deleteEvent, setCurrentEvent } from '@/utils/storage';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isUserLoggedIn, requireLogin } from '@/utils/auth';

const Dashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState(getEvents());
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
      navigate(requireLogin('/dashboard'));
      return;
    }
    setEvents(getEvents());
  }, [navigate]);

  const handleCreateEvent = () => {
    if (!isUserLoggedIn()) {
      navigate(requireLogin('/dashboard'));
      return;
    }
    setShowCreateModal(true);
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    setEvents(getEvents());
  };

  const handleEditEvent = (id: string) => {
    setCurrentEvent(id);
    navigate(`/template/${id}`);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Your Events</h1>
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
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No events yet</h3>
              <p className="text-slate-500 mb-6">Click the button above to create your first event</p>
              <Button 
                onClick={handleCreateEvent}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm mb-4">
                    Type: {event.type}
                    <br />
                    Date: {formatDate(event.date)}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="ml-auto h-8 w-8 p-0 data-[state=open]:bg-muted">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                      <DropdownMenuLabel className="text-slate-400">Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditEvent(event.id)} className="hover:bg-slate-700 focus:bg-slate-700">
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem onClick={() => handleDeleteEvent(event.id)} className="hover:bg-red-700 focus:bg-red-700 text-red-500">
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Add the event creation modal */}
      <EventCreationModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
};

export default Dashboard;
