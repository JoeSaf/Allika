import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import EventCreationModal from "@/components/EventCreationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, Calendar, MapPin, Users, Scan, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isUserLoggedIn, requireLogin, getCurrentUser } from "@/utils/auth";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import Footer from "@/components/Footer";

// Import Event type from API service and extend it with backend properties
import type { Event as ApiEvent } from "@/services/api";

type Event = ApiEvent & {
  guest_count: number;
  checked_in_count: number;
  created_at: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyCreatedEvent, setNewlyCreatedEvent] = useState<any>(null);

  useEffect(() => {
    console.log("Dashboard mounted, checking auth...");

    // Check if user is logged in
    const userLoggedIn = isUserLoggedIn();
    const currentUser = getCurrentUser();

    console.log("User logged in:", userLoggedIn);
    console.log("Current user:", currentUser);

    if (!userLoggedIn) {
      console.log("User not logged in, redirecting to login...");
      navigate(requireLogin("/dashboard"));
      return;
    }

    // Check for newly created event from navigation state
    if (location.state?.newlyCreatedEvent) {
      setNewlyCreatedEvent(location.state.newlyCreatedEvent);
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }

    // Clear any old pending event data that might be stale
    const pendingEventData = localStorage.getItem("alika_pending_event_data");
    if (pendingEventData) {
      try {
        const parsedData = JSON.parse(pendingEventData);
        const pendingEventId = parsedData.eventId;
        console.log("[Dashboard] Found pending event data for event:", pendingEventId);
      } catch (error) {
        console.error("[Dashboard] Error parsing pending event data:", error);
        localStorage.removeItem("alika_pending_event_data");
      }
    }

    console.log("User is logged in, loading events...");
    loadEvents();
  }, [navigate, location.state]);

  const loadEvents = async () => {
    try {
      console.log("Loading events from API...");
      const response = await apiService.getEvents();
      if (response.success && response.data?.events) {
        console.log("Loaded events:", response.data.events);
        setEvents(response.data.events as Event[]);
      } else {
        console.log("No events found or API error");
        setEvents([]);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error Loading Events",
        description: "There was a problem loading your events. Please try refreshing the page.",
        variant: "destructive",
      });
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add error boundary
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      console.error("Global error caught:", event.error);
    });
  }

  const handleCreateEvent = () => {
    if (!isUserLoggedIn()) {
      navigate(requireLogin("/dashboard"));
      return;
    }
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await apiService.deleteEvent(id);
      await loadEvents(); // Reload events after deletion
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "There was a problem deleting the event.",
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = (id: string) => {
    try {
      // Check for pending event data and preserve it
      const pendingEventData = localStorage.getItem("alika_pending_event_data");
      if (pendingEventData) {
        const parsedData = JSON.parse(pendingEventData);
        if (parsedData.eventId === id) {
          console.log("[Dashboard] Found pending event data for event:", id);
          // Keep the pending data for event editor to use
          console.log("[Dashboard] Preserving pending event data for event editor");
        }
      }

      console.log("[Dashboard] Navigating to event editor with event ID:", id);
      navigate(`/event/${id}`);
    } catch (error) {
      console.error("Error navigating to event editor:", error);
      toast({
        title: "Error",
        description: "There was a problem opening the event editor.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      // Handle different date formats
      if (!dateString) {
        return "No date set";
      }

      // If it's already a formatted string, return as is
      if (dateString.includes(",") || dateString.includes("th") || dateString.includes("st") || dateString.includes("nd") || dateString.includes("rd")) {
        return dateString;
      }

      // Try to parse as ISO date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }

      return format(date, "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString || "Invalid Date";
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    // Only reload events, do not navigate to event editor here
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

  // Add a simple fallback in case of rendering errors
  try {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Header />

        <div className="container mx-auto px-4 py-8 pt-24 flex-1">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Your Events</h1>
              <p className="text-slate-300">Manage and track your events</p>
            </div>

            {newlyCreatedEvent && (
              <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <div>
                    <p className="text-green-400 font-medium">Event Created Successfully!</p>
                    <p className="text-green-300 text-sm">"{newlyCreatedEvent.title}" has been created. Click "Continue Editing" to customize it.</p>
                  </div>
                </div>
              </div>
            )}
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
                            onClick={() => navigate("/preview-message")}
                            className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                          >
                            Preview Messages
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/analytics/${event.id}`)}
                            className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                          >
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/qr-scanner/${event.id}`)}
                            className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                          >
                            <Scan className="w-4 h-4 mr-2" />
                            QR Scanner
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
                          {event.guest_count || 0}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === "active" ? "bg-green-600 text-green-100" :
                            event.status === "completed" ? "bg-blue-600 text-blue-100" :
                              "bg-yellow-600 text-yellow-100"
                        }`}>
                          {event.status || "draft"}
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

        <Footer />

        <EventCreationModal
          open={showCreateModal}
          onOpenChange={handleModalClose}
        />
      </div>
    );
  } catch (error) {
    console.error("Dashboard rendering error:", error);
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24 flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-white text-xl mb-4">Something went wrong</div>
              <Button
                onClick={() => window.location.reload()}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Dashboard;
