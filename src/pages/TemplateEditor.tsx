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

// Error Boundary for TemplateEditor
class TemplateEditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("TemplateEditor error boundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
          <Header />
          <div className="bg-slate-800 border-slate-700 p-8 rounded-lg mt-12 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-slate-300 mb-4">An unexpected error occurred in the Template Editor.</p>
            <pre className="text-xs text-red-300 mb-4">{this.state.error?.toString()}</pre>
            <Button onClick={() => window.location.reload()} className="bg-teal-600 hover:bg-teal-700 text-white">Reload Page</Button>
            <Button variant="outline" className="ml-4 border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => window.location.href = "/dashboard"}>Back to Dashboard</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const TemplateEditor = () => {
  // All hooks at the top
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const rsvpRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedTemplate, setSelectedTemplate] = useState("template1");
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invitationData, setInvitationData] = useState({
    coupleName: "", eventDate: "", eventDateWords: "", eventTime: "", venue: "", reception: "", receptionTime: "", theme: "", rsvpContact: "", rsvpContactSecondary: "", additionalInfo: "", invitingFamily: "", invitationImage: null, dateLang: "en",
  });
  const [rsvpData, setRsvpData] = useState({
    title: "James & Patricia Wedding", subtitle: "Saturday 5th July, 2025", location: "St. Peter's Church, Oysterbay", welcomeMessage: "We are excited to celebrate with you! Please let us know if you can join us.", confirmText: "Yes, I'll be there", declineText: "Sorry, can't make it", guestCountEnabled: true, guestCountLabel: "Number of guests", guestCountOptions: ["1 person", "2 people", "3 people", "4+ people"], specialRequestsEnabled: true, specialRequestsLabel: "Special requests or dietary restrictions", specialRequestsPlaceholder: "Let us know if you have any special requirements...", additionalFields: [], submitButtonText: "Submit RSVP", thankYouMessage: "Thank you for your response! We look forward to celebrating with you.", backgroundColor: "#334155", textColor: "#ffffff", buttonColor: "#0d9488", accentColor: "#14b8a6", rsvpContact: "", rsvpContactSecondary: "",
  });
  const [activeTab, setActiveTab] = useState("invitation");
  const [showSendModal, setShowSendModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [rsvpContactError, setRsvpContactError] = useState("");
  const [rsvpContactSecondaryError, setRsvpContactSecondaryError] = useState("");

  useEffect(() => {
    console.log("=== TEMPLATE EDITOR MOUNT ===");
    console.log("[TemplateEditor] useEffect triggered with id:", id);

    if (!id) {
      console.log("[TemplateEditor] No event ID provided, redirecting to dashboard");
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
      console.log("[TemplateEditor] Using event details from navigation state as fallback");
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

  // Auto-save RSVP data when it changes
  useEffect(() => {
    if (currentEvent && !isLoading && !isInitialLoad) {
      const timeoutId = setTimeout(() => {
        saveRsvpDataToStorage();
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [rsvpData, currentEvent, isLoading, isInitialLoad]);

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
        console.log("[TemplateEditor] No event ID provided, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }

      console.log(`[TemplateEditor] Loading event data for ID: ${id}`);

      // Validate UUID format before making the API call
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.log("[TemplateEditor] Invalid UUID format, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }

      const response = await apiService.getEvent(id);

      if (!response.success || !response.data?.event) {
        console.log("[TemplateEditor] Event not found or access denied, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }

      const event = response.data.event;
      console.log("[TemplateEditor] Event loaded successfully:", event);
      console.log("[TemplateEditor] Event title:", event.title);
      console.log("[TemplateEditor] Event date:", event.date);
      console.log("[TemplateEditor] Event venue:", event.venue);
      console.log("[TemplateEditor] Event type:", event.type);

      // Check for pending event data from event creation
      const pendingEventData = localStorage.getItem("alika_pending_event_data");
      console.log("[TemplateEditor] Pending event data found:", pendingEventData);

      if (pendingEventData) {
        try {
          const parsedData = JSON.parse(pendingEventData);
          console.log("[TemplateEditor] Parsed pending data:", parsedData);
          console.log("[TemplateEditor] Comparing event IDs:", parsedData.eventId, "vs", event.id);

          if (parsedData.eventId === event.id) {
            console.log("[TemplateEditor] Found pending event data, using it to pre-fill form");
            const eventDetails = parsedData.eventDetails;
            console.log("[TemplateEditor] Event details to use:", eventDetails);

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
              receptionTime: eventDetails.receptionTime || event.reception_time || "",
              theme: eventDetails.theme || event.theme || "",
              rsvpContact: eventDetails.rsvpContact || event.rsvp_contact || "",
              rsvpContactSecondary: "",
              additionalInfo: eventDetails.description || event.additional_info || "",
              invitingFamily: eventDetails.invitingFamily || event.inviting_family || "",
              invitationImage: null,
              dateLang: eventDetails.dateLang || event.date_lang || "en",
            };

            console.log("[TemplateEditor] Setting invitation data:", newInvitationData);
            setInvitationData(newInvitationData);

            // Set the selected template separately
            setSelectedTemplate("template1");

            // Clear the pending data after using it
            localStorage.removeItem("alika_pending_event_data");
            console.log("[TemplateEditor] Cleared pending event data after using it");
          } else {
            console.log("[TemplateEditor] Event ID mismatch, clearing old pending data and using current event data");
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
              receptionTime: event.reception_time || "",
              theme: event.theme || "",
              rsvpContact: event.rsvp_contact || "",
              rsvpContactSecondary: "",
              additionalInfo: event.additional_info || "",
              invitingFamily: event.inviting_family || "",
              invitationImage: null,
              dateLang: event.date_lang || "en",
            };

            console.log("[TemplateEditor] Setting current event data:", currentEventData);
            setInvitationData(currentEventData);
          }
        } catch (error) {
          console.error("[TemplateEditor] Error parsing pending event data:", error);
          localStorage.removeItem("alika_pending_event_data");
        }
      } else {
        console.log("[TemplateEditor] No pending event data found, loading from event");
        // Load existing invitation data if available
        if (event.couple_name || event.coupleName || event.invitation_id) {
          setInvitationData({
            coupleName: event.coupleName || event.couple_name || event.title || "",
            eventDate: event.eventDate || event.event_date || event.date || "",
            eventDateWords: event.eventDateWords || event.event_date_words || "",
            eventTime: event.eventTime || event.event_time || event.time || "",
            venue: event.venue || "",
            reception: event.reception || event.reception_venue || "",
            receptionTime: event.receptionTime || event.reception_time || "",
            theme: event.theme || "",
            rsvpContact: event.rsvpContact || event.rsvp_contact || "",
            rsvpContactSecondary: event.rsvpContactSecondary || event.rsvp_contact_secondary || "",
            additionalInfo: event.additionalInfo || event.additional_info || "",
            invitingFamily: event.invitingFamily || event.inviting_family || "",
            invitationImage: event.invitationImage || event.invitation_image || null,
            dateLang: event.dateLang || event.date_lang || "en",
          });
        } else {
          // Fallback: Always populate basic event information
          console.log("[TemplateEditor] No existing invitation data, populating basic event info");
          const basicEventData = {
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
            receptionTime: event.reception_time || "",
            theme: event.theme || "",
            rsvpContact: event.rsvp_contact || "",
            rsvpContactSecondary: "",
            additionalInfo: event.additional_info || "",
            invitingFamily: event.inviting_family || "",
            invitationImage: null,
            dateLang: event.date_lang || "en",
          };

          console.log("[TemplateEditor] Setting basic event data:", basicEventData);
          setInvitationData(basicEventData);
        }

        // Load RSVP settings
        if (event.rsvp_id || event.rsvp_title) {
          setRsvpData(prev => ({
            ...prev,
            title: event.rsvp_title || prev.title,
            subtitle: event.rsvp_subtitle || prev.subtitle,
            location: event.rsvp_location || prev.location,
            welcomeMessage: event.welcome_message || prev.welcomeMessage,
            confirmText: event.confirm_text || prev.confirmText,
            declineText: event.decline_text || prev.declineText,
            guestCountEnabled: event.guest_count_enabled !== undefined ? event.guest_count_enabled : prev.guestCountEnabled,
            guestCountLabel: event.guest_count_label || prev.guestCountLabel,
            guestCountOptions: event.guest_count_options ? JSON.parse(event.guest_count_options) : prev.guestCountOptions,
            specialRequestsEnabled: event.special_requests_enabled !== undefined ? event.special_requests_enabled : prev.specialRequestsEnabled,
            specialRequestsLabel: event.special_requests_label || prev.specialRequestsLabel,
            specialRequestsPlaceholder: event.special_requests_placeholder || prev.specialRequestsPlaceholder,
            additionalFields: event.additional_fields ? JSON.parse(event.additional_fields) : prev.additionalFields,
            submitButtonText: event.submit_button_text || prev.submitButtonText,
            thankYouMessage: event.thank_you_message || prev.thankYouMessage,
            backgroundColor: event.background_color || prev.backgroundColor,
            textColor: event.text_color || prev.textColor,
            buttonColor: event.button_color || prev.buttonColor,
            accentColor: event.accent_color || prev.accentColor,
            rsvpContact: event.rsvp_contact || prev.rsvpContact,
            rsvpContactSecondary: event.rsvp_contact_secondary || prev.rsvpContactSecondary,
          }));
        }
      }

      setCurrentEvent(event);
      setIsLoading(false);
      setIsInitialLoad(false);

    } catch (error) {
      console.error("[TemplateEditor] Error loading event data:", error);

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

  const saveRsvpDataToStorage = async () => {
    if (!currentEvent) {
      return;
    }

    try {
      await apiService.updateRsvpSettings(currentEvent.id, rsvpData);
      console.log("Auto-saved RSVP data");
    } catch (error) {
      console.error("Error auto-saving RSVP data:", error);
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
      await saveRsvpDataToStorage();
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
    if (field === "rsvpContact") {
      setRsvpContactError(value && !phoneRegex.test(value) ? "Invalid phone. Use +countrycode and 9 digits." : "");
    }
    if (field === "rsvpContactSecondary") {
      setRsvpContactSecondaryError(value && !phoneRegex.test(value) ? "Invalid phone. Use +countrycode and 9 digits." : "");
    }
  };

  const handleRsvpChange = (field, value) => {
    setRsvpData(prev => ({ ...prev, [field]: value }));
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

  const addGuestCountOption = () => {
    const newOption = `${rsvpData.guestCountOptions.length + 1} people`;
    setRsvpData(prev => ({
      ...prev,
      guestCountOptions: [...prev.guestCountOptions, newOption],
    }));
  };

  const removeGuestCountOption = (index) => {
    setRsvpData(prev => ({
      ...prev,
      guestCountOptions: prev.guestCountOptions.filter((_, i) => i !== index),
    }));
  };

  const updateGuestCountOption = (index, value) => {
    setRsvpData(prev => ({
      ...prev,
      guestCountOptions: prev.guestCountOptions.map((option, i) =>
        i === index ? value : option,
      ),
    }));
  };

  const addAdditionalField = () => {
    const newField = {
      id: `field-${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
    };
    setRsvpData(prev => ({
      ...prev,
      additionalFields: [...prev.additionalFields, newField],
    }));
  };

  const updateAdditionalField = (id, updates) => {
    setRsvpData(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.map(field =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    }));
  };

  const removeAdditionalField = (id) => {
    setRsvpData(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.filter(field => field.id !== id),
    }));
  };

  const handleDownload = async (type = "invitation") => {
    const ref = type === "invitation" ? cardRef : rsvpRef;
    if (ref.current) {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: type === "invitation" ? "#1e293b" : rsvpData.backgroundColor,
      });

      const link = document.createElement("a");
      link.download = `${type}-${invitationData.coupleName.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
      link.href = canvas.toDataURL();
      link.click();
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
    console.log("Sending invitations with data:", { invitationData, rsvpData });
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
          {/* <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="invitation" className="data-[state=active]:bg-teal-600">
              Invitation Design
            </TabsTrigger>
            <TabsTrigger value="rsvp" className="data-[state=active]:bg-teal-600">
              RSVP Page
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value="invitation" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Invitation Form Panel */}
              <div className="space-y-6">
                {/* Template Selection */}
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Choose Template Style</h2>
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
                    {rsvpContactError && <div className="text-red-400 text-xs mt-1">{rsvpContactError}</div>}

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
                    {rsvpContactSecondaryError && <div className="text-red-400 text-xs mt-1">{rsvpContactSecondaryError}</div>}

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

          <TabsContent value="rsvp" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* RSVP Form Editor */}
              <div className="space-y-6">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-6">RSVP Page Settings</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rsvpTitle" className="text-white">Page Title</Label>
                      <Input
                        id="rsvpTitle"
                        value={rsvpData.title}
                        onChange={(e) => handleRsvpChange("title", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rsvpSubtitle" className="text-white">Subtitle</Label>
                      <Input
                        id="rsvpSubtitle"
                        value={rsvpData.subtitle}
                        onChange={(e) => handleRsvpChange("subtitle", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rsvpLocation" className="text-white">Location</Label>
                      <Input
                        id="rsvpLocation"
                        value={rsvpData.location}
                        onChange={(e) => handleRsvpChange("location", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="welcomeMessage" className="text-white">Welcome Message</Label>
                      <Textarea
                        id="welcomeMessage"
                        value={rsvpData.welcomeMessage}
                        onChange={(e) => handleRsvpChange("welcomeMessage", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="confirmText" className="text-white">Confirm Button Text</Label>
                        <Input
                          id="confirmText"
                          value={rsvpData.confirmText}
                          onChange={(e) => handleRsvpChange("confirmText", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="declineText" className="text-white">Decline Button Text</Label>
                        <Input
                          id="declineText"
                          value={rsvpData.declineText}
                          onChange={(e) => handleRsvpChange("declineText", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                    </div>

                    {/* Guest Count Settings */}
                    <div className="border-t border-slate-600 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-white">Guest Count Field</Label>
                        <Switch
                          checked={rsvpData.guestCountEnabled}
                          onCheckedChange={(checked) => handleRsvpChange("guestCountEnabled", checked)}
                        />
                      </div>

                      {rsvpData.guestCountEnabled && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="guestCountLabel" className="text-white">Field Label</Label>
                            <Input
                              id="guestCountLabel"
                              value={rsvpData.guestCountLabel}
                              onChange={(e) => handleRsvpChange("guestCountLabel", e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                            />
                          </div>

                          <div>
                            <Label className="text-white">Options</Label>
                            <div className="space-y-2 mt-2">
                              {rsvpData.guestCountOptions.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateGuestCountOption(index, e.target.value)}
                                    className="bg-slate-700 border-slate-600 text-white flex-1"
                                  />
                                  <Button
                                    onClick={() => removeGuestCountOption(index)}
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 px-3"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                onClick={addGuestCountOption}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Special Requests Settings */}
                    <div className="border-t border-slate-600 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-white">Special Requests Field</Label>
                        <Switch
                          checked={rsvpData.specialRequestsEnabled}
                          onCheckedChange={(checked) => handleRsvpChange("specialRequestsEnabled", checked)}
                        />
                      </div>

                      {rsvpData.specialRequestsEnabled && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="specialRequestsLabel" className="text-white">Field Label</Label>
                            <Input
                              id="specialRequestsLabel"
                              value={rsvpData.specialRequestsLabel}
                              onChange={(e) => handleRsvpChange("specialRequestsLabel", e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="specialRequestsPlaceholder" className="text-white">Placeholder Text</Label>
                            <Input
                              id="specialRequestsPlaceholder"
                              value={rsvpData.specialRequestsPlaceholder}
                              onChange={(e) => handleRsvpChange("specialRequestsPlaceholder", e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Fields */}
                    <div className="border-t border-slate-600 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-white">Additional Fields</Label>
                        <Button
                          onClick={addAdditionalField}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Field
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {rsvpData.additionalFields.map((field) => (
                          <div key={field.id} className="bg-slate-700 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-white">Custom Field</Label>
                              <Button
                                onClick={() => removeAdditionalField(field.id)}
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 px-2"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-white text-sm">Field Label</Label>
                                <Input
                                  value={field.label}
                                  onChange={(e) => updateAdditionalField(field.id, { label: e.target.value })}
                                  className="bg-slate-600 border-slate-500 text-white mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-white text-sm">Field Type</Label>
                                <select
                                  value={field.type}
                                  onChange={(e) => updateAdditionalField(field.id, { type: e.target.value })}
                                  className="w-full bg-slate-600 border border-slate-500 text-white rounded-md p-2 mt-1"
                                >
                                  <option value="text">Text</option>
                                  <option value="textarea">Textarea</option>
                                  <option value="select">Select</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => updateAdditionalField(field.id, { required: checked })}
                                />
                                <Label className="text-white text-sm">Required</Label>
                              </div>
                            </div>

                            {field.type === "select" && (
                              <div className="mt-3">
                                <Label className="text-white text-sm">Options (one per line)</Label>
                                <Textarea
                                  value={field.options?.join("\n") || ""}
                                  onChange={(e) => updateAdditionalField(field.id, {
                                    options: e.target.value.split("\n").filter(opt => opt.trim()),
                                  })}
                                  className="bg-slate-600 border-slate-500 text-white mt-1"
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="submitButtonText" className="text-white">Submit Button Text</Label>
                      <Input
                        id="submitButtonText"
                        value={rsvpData.submitButtonText}
                        onChange={(e) => handleRsvpChange("submitButtonText", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="thankYouMessage" className="text-white">Thank You Message</Label>
                      <Textarea
                        id="thankYouMessage"
                        value={rsvpData.thankYouMessage}
                        onChange={(e) => handleRsvpChange("thankYouMessage", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    {/* Color Settings */}
                    <div className="border-t border-slate-600 pt-4">
                      <h3 className="text-white font-semibold mb-4">Color Theme</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="backgroundColor" className="text-white text-sm">Background Color</Label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="color"
                              id="backgroundColor"
                              value={rsvpData.backgroundColor}
                              onChange={(e) => handleRsvpChange("backgroundColor", e.target.value)}
                              className="w-12 h-10 rounded border border-slate-600"
                            />
                            <Input
                              value={rsvpData.backgroundColor}
                              onChange={(e) => handleRsvpChange("backgroundColor", e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="textColor" className="text-white text-sm">Text Color</Label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="color"
                              id="textColor"
                              value={rsvpData.textColor}
                              onChange={(e) => handleRsvpChange("textColor", e.target.value)}
                              className="w-12 h-10 rounded border border-slate-600"
                            />
                            <Input
                              value={rsvpData.textColor}
                              onChange={(e) => handleRsvpChange("textColor", e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="buttonColor" className="text-white text-sm">Button Color</Label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="color"
                              id="buttonColor"
                              value={rsvpData.buttonColor}
                              onChange={(e) => handleRsvpChange("buttonColor", e.target.value)}
                              className="w-12 h-10 rounded border border-slate-600"
                            />
                            <Input
                              value={rsvpData.buttonColor}
                              onChange={(e) => handleRsvpChange("buttonColor", e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="accentColor" className="text-white text-sm">Accent Color</Label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="color"
                              id="accentColor"
                              value={rsvpData.accentColor}
                              onChange={(e) => handleRsvpChange("accentColor", e.target.value)}
                              className="w-12 h-10 rounded border border-slate-600"
                            />
                            <Input
                              value={rsvpData.accentColor}
                              onChange={(e) => handleRsvpChange("accentColor", e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* RSVP Preview Panel */}
              <div className="sticky top-8">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">RSVP Page Preview</h2>
                    <Button
                      onClick={() => handleDownload("rsvp")}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div
                    ref={rsvpRef}
                    className="rounded-lg p-6 max-h-96 overflow-y-auto"
                    style={{ backgroundColor: rsvpData.backgroundColor, color: rsvpData.textColor }}
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2" style={{ color: rsvpData.textColor }}>
                        {rsvpData.title}
                      </h3>
                      <p className="mb-1" style={{ color: rsvpData.textColor }}>
                        {rsvpData.subtitle}
                      </p>
                      <p className="text-sm opacity-75" style={{ color: rsvpData.textColor }}>
                        {rsvpData.location}
                      </p>
                    </div>

                    <div className="mb-6">
                      <p className="text-center mb-4" style={{ color: rsvpData.textColor }}>
                        {rsvpData.welcomeMessage}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium mb-2" style={{ color: rsvpData.textColor }}>
                          Will you be attending?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors"
                            style={{
                              borderColor: rsvpData.accentColor,
                              color: rsvpData.accentColor,
                              backgroundColor: "transparent",
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {rsvpData.confirmText}
                          </button>
                          <button
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors"
                            style={{
                              borderColor: "#ef4444",
                              color: "#ef4444",
                              backgroundColor: "transparent",
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                            {rsvpData.declineText}
                          </button>
                        </div>
                      </div>

                      {rsvpData.guestCountEnabled && (
                        <div>
                          <label className="block font-medium mb-2" style={{ color: rsvpData.textColor }}>
                            {rsvpData.guestCountLabel}
                          </label>
                          <select
                            className="w-full p-2 rounded-lg border"
                            style={{
                              backgroundColor: rsvpData.backgroundColor,
                              borderColor: rsvpData.accentColor,
                              color: rsvpData.textColor,
                            }}
                          >
                            {rsvpData.guestCountOptions.map((option, index) => (
                              <option key={index} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {rsvpData.additionalFields.map((field) => (
                        <div key={field.id}>
                          <label className="block font-medium mb-2" style={{ color: rsvpData.textColor }}>
                            {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                          </label>
                          {field.type === "text" && (
                            <input
                              type="text"
                              className="w-full p-2 rounded-lg border"
                              style={{
                                backgroundColor: rsvpData.backgroundColor,
                                borderColor: rsvpData.accentColor,
                                color: rsvpData.textColor,
                              }}
                            />
                          )}
                          {field.type === "textarea" && (
                            <textarea
                              className="w-full p-2 rounded-lg border h-20"
                              style={{
                                backgroundColor: rsvpData.backgroundColor,
                                borderColor: rsvpData.accentColor,
                                color: rsvpData.textColor,
                              }}
                            />
                          )}
                          {field.type === "select" && (
                            <select
                              className="w-full p-2 rounded-lg border"
                              style={{
                                backgroundColor: rsvpData.backgroundColor,
                                borderColor: rsvpData.accentColor,
                                color: rsvpData.textColor,
                              }}
                            >
                              <option>Select an option</option>
                              {field.options?.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}

                      {rsvpData.specialRequestsEnabled && (
                        <div>
                          <label className="block font-medium mb-2" style={{ color: rsvpData.textColor }}>
                            {rsvpData.specialRequestsLabel}
                          </label>
                          <textarea
                            className="w-full p-2 rounded-lg border h-20"
                            placeholder={rsvpData.specialRequestsPlaceholder}
                            style={{
                              backgroundColor: rsvpData.backgroundColor,
                              borderColor: rsvpData.accentColor,
                              color: rsvpData.textColor,
                            }}
                          />
                        </div>
                      )}

                      <button
                        className="w-full py-3 rounded-lg font-semibold transition-colors"
                        style={{
                          backgroundColor: rsvpData.buttonColor,
                          color: "#ffffff",
                        }}
                      >
                        {rsvpData.submitButtonText}
                      </button>
                    </div>
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

// Wrap TemplateEditor in error boundary for export
const TemplateEditorWithBoundary = (props) => (
  <TemplateEditorErrorBoundary>
    <TemplateEditor {...props} />
  </TemplateEditorErrorBoundary>
);

export default TemplateEditorWithBoundary;
