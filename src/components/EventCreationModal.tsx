import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

interface EventCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Utility to remove undefined values from an object
function cleanPayload(obj: any) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

// Define formData type to include all fields
interface EventFormData {
  name: string;
  type: string;
  description: string;
  venue: string;
  date: string;
  invitingFamily: string;
  reception: string;
  receptionTime: string;
  theme: string;
  rsvpContact: string;
  rsvpContactSecondary: string;
}

const EventCreationModal = ({ open, onOpenChange }: EventCreationModalProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    type: "wedding",
    description: "",
    venue: "",
    date: "",
    invitingFamily: "",
    reception: "",
    receptionTime: "",
    theme: "",
    rsvpContact: "",
    rsvpContactSecondary: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateLang, setDateLang] = useState<"en" | "sw">("en");
  // Accept phone numbers with or without +, and validate length (10-15 digits)
  const phoneRegex = /^\+?\d{10,15}$/;
  const [rsvpContactError, setRsvpContactError] = useState("");
  const [rsvpContactSecondaryError, setRsvpContactSecondaryError] = useState("");

  const eventTypes = [
    { value: "wedding", label: "Wedding" },
    { value: "birthday", label: "Birthday Party" },
    { value: "anniversary", label: "Anniversary" },
    { value: "graduation", label: "Graduation" },
    { value: "corporate", label: "Corporate Event" },
    { value: "conference", label: "Conference" },
    { value: "awards", label: "Awards Ceremony" },
    { value: "festival", label: "Festival" },
    { value: "meeting", label: "Meeting" },
    { value: "seminar", label: "Seminar" },
    { value: "other", label: "Other" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (name === "rsvpContact") {
      setRsvpContactError(
        value && !phoneRegex.test(value)
          ? "Please enter a valid phone number."
          : "",
      );
    }
    if (name === "rsvpContactSecondary") {
      setRsvpContactSecondaryError(
        value && !phoneRegex.test(value)
          ? "Please enter a valid phone number."
          : "",
      );
    }
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "wedding",
      description: "",
      venue: "",
      date: "",
      invitingFamily: "",
      reception: "",
      receptionTime: "",
      theme: "",
      rsvpContact: "",
      rsvpContactSecondary: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Event Name Required",
        description: "Please enter a name for your event.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create event via backend
      const eventPayload = {
        title: formData.name.trim(),
        type: formData.type,
        date: formData.date ? new Date(formData.date).toISOString().slice(0, 10) : "",
        venue: formData.venue || undefined,
        reception: formData.reception || undefined,
        theme: formData.theme || undefined,
        rsvpContact: formData.rsvpContact || undefined,
        additionalInfo: formData.description || undefined,
        invitingFamily: formData.invitingFamily || undefined,
        ...(formData.receptionTime ? { receptionTime: formData.receptionTime.slice(0, 5) } : {}),
      };
      const res = await apiService.createEvent(eventPayload);
      if (!res || !res.data || !res.data.event) {
        throw new Error("Event creation failed");
      }
      const newEvent = res.data.event;

      console.log("Event created successfully:", { eventId: newEvent.id, title: newEvent.title });

      // Store event data in localStorage for event editor to use
      localStorage.setItem("alika_pending_event_data", JSON.stringify({
        eventId: newEvent.id,
        eventDetails: {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          venue: formData.venue,
          date: formData.date,
          invitingFamily: formData.invitingFamily,
          reception: formData.reception,
          receptionTime: formData.receptionTime,
          theme: formData.theme,
          rsvpContact: formData.rsvpContact,
          dateLang: dateLang,
        },
      }));

      toast({
        title: "Event Created!",
        description: `Your ${formData.type} event "${formData.name}" has been created successfully.`,
      });

      // Navigate to dashboard
      navigate("/dashboard", {
        state: {
          newlyCreatedEvent: {
            id: newEvent.id,
            title: newEvent.title,
            type: newEvent.type,
          },
        },
      });

      // Log the final state after navigation
      setTimeout(() => {
        console.log("[EventCreationModal] After navigation - window.location:", window.location.href);
        console.log("[EventCreationModal] After navigation - localStorage:", localStorage.getItem("alika_current_event"));
        resetForm();
        onOpenChange(false);
      }, 200);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error Creating Event",
        description: "There was a problem creating your event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onOpenChange(false);
      toast({
        title: "Event Creation Cancelled",
        description: "You have exited event creation.",
        variant: "default",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Create New Event</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new event.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">Event Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., John & Doe's Wedding"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-slate-300">Event Type *</Label>
            <Select value={formData.type} onValueChange={handleTypeChange} disabled={isSubmitting}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-600">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue" className="text-slate-300">Venue</Label>
            <Input
              id="venue"
              name="venue"
              type="text"
              placeholder="e.g., St. Church"
              value={formData.venue}
              onChange={handleInputChange}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-300">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white"
                disabled={isSubmitting}
              />
              {/* Language selector for date */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Display date in:</span>
                <Select value={dateLang} onValueChange={(val) => setDateLang(val as "en" | "sw")}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-xs">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Friendly date preview */}
              {formData.date && (
                <div className="text-xs text-slate-400 mt-1">
                  {format(
                    new Date(formData.date),
                    "EEEE, d MMMM yyyy",
                    { locale: enUS },
                  )}
                </div>
              )}
            </div>

            {/* Remove the Event Time input from the form UI */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              type="text"
              placeholder="Brief description of your event"
              value={formData.description}
              onChange={handleInputChange}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invitingFamily" className="text-slate-300">Inviting Family</Label>
            <Input
              id="invitingFamily"
              name="invitingFamily"
              type="text"
              placeholder="e.g., MR. & MRS. JOHN DOE"
              value={formData.invitingFamily}
              onChange={handleInputChange}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsvpContact" className="text-slate-300">RSVP Contact (Phone Number)</Label>
            <Input
              id="rsvpContact"
              name="rsvpContact"
              type="tel"
              placeholder="e.g., +255 123 456 789"
              value={formData.rsvpContact}
              onChange={handleInputChange}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isSubmitting}
            />
            {rsvpContactError && <div className="text-red-400 text-xs mt-1">{rsvpContactError}</div>}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventCreationModal;
