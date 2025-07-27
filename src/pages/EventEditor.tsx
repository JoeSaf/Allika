import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Download, Send, QrCode, Save, Upload, X, Plus, Minus, CheckCircle, XCircle, BarChart3, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import html2canvas from "html2canvas";
import { toast } from "@/hooks/use-toast";

import { apiService } from "@/services/api";
import InvitationCardTemplate from "@/components/InvitationCardTemplate";
import SendInvitationModal from "@/components/SendInvitationModal";

type ErrorBoundaryState = { hasError: boolean; error: any };

// Error Boundary for EventEditor
class EventEditorErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("EventEditor error boundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
          <Header />
          <div className="bg-slate-800 border-slate-700 p-8 rounded-lg mt-12 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-slate-300 mb-4">An unexpected error occurred in the Event Editor.</p>
            <pre className="text-xs text-red-300 mb-4">{this.state.error?.toString()}</pre>
            <Button onClick={() => window.location.reload()} className="bg-teal-600 hover:bg-teal-700 text-white">Reload Page</Button>
            <Button variant="outline" className="ml-4 border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => window.location.href = "/dashboard"}>Back to Dashboard</Button>
          </div>
        </div>
      );
    }
    return (this.props as any).children;
  }
}

const EventEditor = () => {
  // All hooks at the top
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedTemplate, setSelectedTemplate] = useState("template1");
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invitationData, setInvitationData] = useState({
    coupleName: "", eventDate: "", eventDateWords: "", eventTime: "", venue: "", reception: "", receptionTime: "", theme: "", rsvpContact: "", rsvpContactSecondary: "", additionalInfo: "", invitingFamily: "", invitationImage: null, dateLang: "en",
  });
  const [activeTab, setActiveTab] = useState("invitation");
  const [showSendModal, setShowSendModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    console.log("=== EVENT EDITOR MOUNT ===");
    console.log("[EventEditor] useEffect triggered with id:", id);

    if (!id) {
      console.log("[EventEditor] No event ID provided, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }

    setIsLoading(true);
    setIsInitialLoad(true);
    loadEventData();
  }, [id, navigate]);

  // Fallback: If we have event details in location state, use them temporarily
  useEffect(() => {
    const location = window.location as any;
    const state = location.state;
    if (state?.eventDetails && !currentEvent && !isLoading) {
      console.log("[EventEditor] Using event details from navigation state as fallback");
      const eventDetails = state.eventDetails;
      setInvitationData(prev => ({
        ...prev,
        coupleName: eventDetails.name || "",
        eventDate: eventDetails.date || "",
        eventTime: eventDetails.receptionTime || "",
        venue: eventDetails.venue || "",
        reception: eventDetails.reception || "",
        receptionTime: eventDetails.receptionTime || "",
        theme: eventDetails.theme || "",
        rsvpContact: eventDetails.rsvpContact || "",
        dateLang: eventDetails.dateLang || "en",
      }));
    }
  }, [currentEvent, isLoading]);

  // Auto-save invitation data when it changes
  useEffect(() => {
    if (currentEvent && !isLoading && !isInitialLoad) {
      const timeoutId = setTimeout(() => {
        saveInvitationDataToStorage();
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [invitationData, currentEvent, isLoading, isInitialLoad]);

  // Generate eventDateWords when eventDate or dateLang changes
  useEffect(() => {
    if (invitationData.eventDate && invitationData.dateLang) {
      const eventDateWords = getEventDateWords();
      if (eventDateWords !== invitationData.eventDateWords) {
        setInvitationData(prev => ({ ...prev, eventDateWords }));
      }
    }
  }, [invitationData.eventDate, invitationData.dateLang]);

  // Simplified loadEventData function
  const loadEventData = async () => {
    try {
      if (!id) {
        console.log("[EventEditor] No event ID provided, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }

      console.log(`[EventEditor] Loading event data for ID: ${id}`);

      // Validate UUID format before making the API call
      const isValidUUID = (uuid) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
      if (!isValidUUID(id)) {
        console.log("[EventEditor] Invalid UUID format, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }

      const response = await apiService.getEvent(id);

      if (!response.success || !response.data?.event) {
        console.log("[EventEditor] Event not found or access denied, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }

      const event = response.data.event;
      console.log("[EventEditor] Event loaded successfully:", event);
      console.log("[EventEditor] Event title:", event.title);
      console.log("[EventEditor] Event date:", event.date);
      console.log("[EventEditor] Event venue:", event.venue);
      console.log("[EventEditor] Event type:", event.type);

      // Check for pending event data from event creation
      const pendingEventData = localStorage.getItem("alika_pending_event_data");
      console.log("[EventEditor] Pending event data found:", pendingEventData);

      if (pendingEventData) {
        try {
          const parsedData = JSON.parse(pendingEventData);
          console.log("[EventEditor] Parsed pending data:", parsedData);
          console.log("[EventEditor] Comparing event IDs:", parsedData.eventId, "vs", event.id);

          if (parsedData.eventId === event.id) {
            console.log("[EventEditor] Found pending event data, using it to pre-fill form");
            const eventDetails = parsedData.eventDetails;
            console.log("[EventEditor] Event details to use:", eventDetails);

            // Pre-fill invitation data with event creation details
            const newInvitationData = {
              coupleName: eventDetails.name || event.title || "",
              eventDate: eventDetails.date || event.date || "",
              eventDateWords: eventDetails.date ? new Date(eventDetails.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "",
              eventTime: eventDetails.time || event.time || "",
              venue: eventDetails.venue || event.venue || "",
              reception: eventDetails.reception || event.reception || "",
              receptionTime: eventDetails.receptionTime || event.receptionTime || "",
              theme: eventDetails.theme || event.theme || "",
              rsvpContact: eventDetails.rsvpContact || event.rsvpContact || "",
              rsvpContactSecondary: "",
              additionalInfo: eventDetails.description || event.additionalInfo || "",
              invitingFamily: eventDetails.invitingFamily || event.invitingFamily || "",
              invitationImage: null,
              dateLang: eventDetails.dateLang || "en",
            };

            console.log("[EventEditor] Setting invitation data:", newInvitationData);
            setInvitationData(newInvitationData);

            // Set the selected template separately
            setSelectedTemplate("template1");

            // Clear the pending data after using it
            localStorage.removeItem("alika_pending_event_data");
            console.log("[EventEditor] Cleared pending event data after using it");
          } else {
            console.log("[EventEditor] Event ID mismatch, clearing old pending data and using current event data");
            // Clear old pending data that doesn't match current event
            localStorage.removeItem("alika_pending_event_data");

            // Use current event data to populate the template
            const currentEventData = {
              coupleName: event.title || "",
              eventDate: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
              eventDateWords: event.date ? new Date(event.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "",
              eventTime: event.time || "",
              venue: event.venue || "",
              reception: event.reception || "",
              receptionTime: event.receptionTime || "",
              theme: event.theme || "",
              rsvpContact: event.rsvpContact || "",
              rsvpContactSecondary: "",
              additionalInfo: event.additionalInfo || "",
              invitingFamily: event.invitingFamily || "",
              invitationImage: null,
              dateLang: "en",
            };

            console.log("[EventEditor] Setting current event data:", currentEventData);
            setInvitationData(currentEventData);
          }
        } catch (error) {
          console.error("[EventEditor] Error parsing pending event data:", error);
          localStorage.removeItem("alika_pending_event_data");
        }
      } else {
        console.log("[EventEditor] No pending event data found, loading from event");
        // Load existing invitation data if available
        setInvitationData({
          coupleName: event.title || "",
          eventDate: event.date || "",
          eventDateWords: event.date ? new Date(event.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }) : "",
          eventTime: event.time || "",
          venue: event.venue || "",
          reception: event.reception || "",
          receptionTime: event.receptionTime || "",
          theme: event.theme || "",
          rsvpContact: event.rsvpContact || "",
          rsvpContactSecondary: "",
          additionalInfo: event.additionalInfo || "",
          invitingFamily: event.invitingFamily || "",
          invitationImage: null,
          dateLang: "en",
        });
      }

      setCurrentEvent(event);
      setIsLoading(false);
      setIsInitialLoad(false);

    } catch (error) {
      console.error("[EventEditor] Error loading event data:", error);

      // Simple error handling - just redirect to dashboard
      toast({
        title: "Error",
        description: "Failed to load event data. Redirecting to your dashboard.",
        variant: "destructive",
      });
      navigate("/dashboard", { replace: true });
    }
  };

  const getEventDateWords = () => {
    if (!invitationData.eventDate) {
      return "";
    }
    const dateLang = invitationData.dateLang || "en";
    const dateLocale = dateLang === "sw" ? "sw-TZ" : "en-US";
    return new Date(invitationData.eventDate).toLocaleDateString(
      dateLocale,
      { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    );
  };

  const saveInvitationDataToStorage = async () => {
    if (!currentEvent) {
      return;
    }

    try {
      const eventDateWords = getEventDateWords();
      await apiService.updateInvitationData(currentEvent.id, {
        ...invitationData,
        eventDateWords,
        dateLang: invitationData.dateLang || "en",
        selectedTemplate, // Save the selected template
      });
      console.log("Auto-saved invitation data");
    } catch (error) {
      console.error("Error auto-saving invitation data:", error);
    }
  };

  const templates = {
    template1: {
      name: "Classic Portrait",
      description: "Traditional vertical layout with centered content",
    },
    template2: {
      name: "Modern Landscape",
      description: "Horizontal layout with image and text side by side",
    },
    template3: {
      name: "Artistic Layout",
      description: "Creative asymmetric design with dynamic positioning",
    },
  };

  const handleInputChange = (field, value) => {
    setInvitationData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result;
        setInvitationData(prev => ({ ...prev, invitationImage: imageData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setInvitationData(prev => ({ ...prev, invitationImage: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (type = "invitation") => {
    const ref = cardRef;
    if (ref.current) {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#1e293b",
      });

      const link = document.createElement("a");
      link.download = `${type}-${invitationData.coupleName.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleManualSave = async () => {
    if (!currentEvent) {
      return;
    }
    try {
      const eventDateWords = getEventDateWords();
      await apiService.updateInvitationData(currentEvent.id, {
        ...invitationData,
        eventDateWords,
        dateLang: invitationData.dateLang || "en",
        selectedTemplate, // Save the selected template
      });
      // Set event status to active
      await apiService.updateEvent(currentEvent.id, { status: "active" });
      toast({
        title: "Saved Successfully",
        description: "Your event details have been saved and the event is now active.",
      });
    } catch (error) {
      toast({
        title: "Save Error",
        description: "There was a problem saving your event details.",
        variant: "destructive",
      });
    }
  };

  const handleSendInvitations = () => {
    // Check if event is active
    if (currentEvent?.status !== "active") {
      toast({
        title: "Event Not Active",
        description: "Please save your changes first to activate the event before sending invitations.",
        variant: "destructive",
      });
      return;
    }
    // Save data before navigating
    handleManualSave();
    console.log("Sending invitations with data:", { invitationData });
    navigate("/preview-message");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Loading event...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <Card className="bg-slate-800 border-slate-700">
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-slate-400 mb-2">Event Not Found</h3>
              <p className="text-slate-500 mb-6">The event you're trying to edit doesn't exist.</p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Helper to get today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);
  // Helper to get current time in HH:MM
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  // Determine language for date preview
  const dateLang = invitationData.dateLang || "en";
  const dateLocale = dateLang === "sw" ? "sw-TZ" : "en-US";

  return (
    <div className="min-h-screen bg-slate-900 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 z-50 pointer-events-none">
          <Loader2 className="animate-spin text-teal-400 w-10 h-10" />
        </div>
      )}

      <Header />

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Customize Your Event</h1>
            <p className="text-slate-300">Event: {currentEvent.title}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 bg-slate-800 border-slate-700">
            <TabsTrigger value="invitation" className="data-[state=active]:bg-teal-600">
              Invitation Design
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitation" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Invitation Form Panel */}
              <div className="space-y-6">
                {/* Template Selection */}
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Choose Event Style</h2>
                  <div className="space-y-4">
                    {Object.entries(templates).map(([key, template]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTemplate === key
                            ? "border-teal-500 bg-teal-500/10"
                            : "border-slate-600 hover:border-slate-500"
                        }`}
                        onClick={() => setSelectedTemplate(key)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedTemplate === key
                              ? "border-teal-500 bg-teal-500"
                              : "border-slate-400"
                          }`} />
                          <div>
                            <h3 className="text-white font-semibold">{template.name}</h3>
                            <p className="text-slate-400 text-sm">{template.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Event Details</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invitingFamily" className="text-white">Inviting Family</Label>
                      <Input
                        id="invitingFamily"
                        value={invitationData.invitingFamily}
                        onChange={(e) => handleInputChange("invitingFamily", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                        placeholder="e.g., MR. & MRS. JOHN DOE"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="eventDate" className="text-white">Event Date</Label>
                        <Input
                          id="eventDate"
                          type="date"
                          value={invitationData.eventDate ? invitationData.eventDate.slice(0, 10) : ""}
                          min={todayStr}
                          onChange={e => handleInputChange("eventDate", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                        {/* Localized date preview */}
                        {invitationData.eventDate && (
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(invitationData.eventDate).toLocaleDateString(
                              dateLocale,
                              { weekday: "long", year: "numeric", month: "long", day: "numeric" },
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eventTime" className="text-white">Event Time</Label>
                        <Input
                          id="eventTime"
                          type="time"
                          value={invitationData.eventTime || ""}
                          min={invitationData.eventDate && invitationData.eventDate.slice(0, 10) === todayStr ? currentTimeStr : undefined}
                          onChange={e => handleInputChange("eventTime", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dateLang" className="text-white">Date Language</Label>
                      <select
                        id="dateLang"
                        value={invitationData.dateLang || "en"}
                        onChange={e => handleInputChange("dateLang", e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2 mt-2"
                      >
                        <option value="en">English</option>
                        <option value="sw">Swahili</option>
                      </select>
                      <p className="text-xs text-slate-400 mt-1">
                        Choose the language for displaying the date on your invitation
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="venue" className="text-white"> Venue</Label>
                      <Input
                        id="venue"
                        value={invitationData.venue}
                        onChange={(e) => handleInputChange("venue", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reception" className="text-white">Reception Venue</Label>
                        <Input
                          id="reception"
                          value={invitationData.reception}
                          onChange={(e) => handleInputChange("reception", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="receptionTime" className="text-white">Reception Time</Label>
                        <Input
                          id="receptionTime"
                          type="time"
                          value={invitationData.receptionTime}
                          onChange={(e) => handleInputChange("receptionTime", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="theme" className="text-white">Theme</Label>
                      <Input
                        id="theme"
                        value={invitationData.theme}
                        onChange={(e) => handleInputChange("theme", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rsvpContact" className="text-white">RSVP Contact (Phone Number)</Label>
                      <Input
                        id="rsvpContact"
                        type="tel"
                        value={invitationData.rsvpContact}
                        onChange={(e) => handleInputChange("rsvpContact", e.target.value)}
                        placeholder="+255 123 456 789"
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rsvpContactSecondary" className="text-white">Secondary RSVP Contact (Phone Number)</Label>
                      <Input
                        id="rsvpContactSecondary"
                        type="tel"
                        value={invitationData.rsvpContactSecondary}
                        onChange={(e) => handleInputChange("rsvpContactSecondary", e.target.value)}
                        placeholder="+255 123 456 789"
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="additionalInfo" className="text-white">Additional Information</Label>
                      <Textarea
                        id="additionalInfo"
                        value={invitationData.additionalInfo}
                        onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    {/* Image Upload Section */}
                    <div>
                      <Label className="text-white">Invitation Image</Label>
                      <div className="mt-2">
                        {!invitationData.invitationImage ? (
                          <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-300 mb-2">Upload an image for your invitation</p>
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Choose Image
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={invitationData.invitationImage}
                              alt="Invitation"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              onClick={removeImage}
                              size="sm"
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Invitation Preview Panel */}
              <div className="sticky top-8">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Preview: {templates[selectedTemplate].name}</h2>
                    <Button
                      onClick={() => handleDownload("invitation")}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div ref={cardRef}>
                    <InvitationCardTemplate
                      invitationData={invitationData}
                      template={selectedTemplate}
                      // No guest/event/qrCode in editor preview
                    />
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={handleManualSave}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </Button>

          <Button
            onClick={() => setShowSendModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
          Send Invitation
          </Button>

          <Button
            onClick={() => navigate(`/analytics/${currentEvent?.id}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-5 h-5" />
            Manage Guests & Analytics
          </Button>

          <Button
            onClick={() => navigate("/preview-message")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Preview Messages
          </Button>
        </div>
      </div>

      {currentEvent && (
        <SendInvitationModal
          open={showSendModal}
          onClose={() => setShowSendModal(false)}
          eventId={currentEvent.id}
          template={currentEvent}
        />
      )}

    </div>
  );
};

// Wrap EventEditor in error boundary for export
const EventEditorWithBoundary = (props) => (
  <EventEditorErrorBoundary>
    <EventEditor {...props} />
  </EventEditorErrorBoundary>
);

export default EventEditorWithBoundary;
