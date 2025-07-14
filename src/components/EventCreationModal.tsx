import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { createDefaultEvent, saveEvent, setCurrentEvent } from '@/utils/storage';
import { toast } from '@/hooks/use-toast';

interface EventCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventCreationModal = ({ open, onOpenChange }: EventCreationModalProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'wedding',
    description: '',
    venue: '',
    date: '',
    time: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventTypes = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'birthday', label: 'Birthday Party' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'graduation', label: 'Graduation' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'conference', label: 'Conference' },
    { value: 'awards', label: 'Awards Ceremony' },
    { value: 'festival', label: 'Festival' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'wedding',
      description: '',
      venue: '',
      date: '',
      time: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Event Name Required",
        description: "Please enter a name for your event.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new event with proper data
      const newEvent = createDefaultEvent(formData.type);
      newEvent.title = formData.name.trim();
      newEvent.additionalInfo = formData.description;
      newEvent.venue = formData.venue;
      newEvent.date = formData.date;
      newEvent.time = formData.time;
      
      // Customize RSVP settings based on event type
      switch (formData.type) {
        case 'wedding':
          newEvent.rsvpSettings.title = `${formData.name} - Wedding Invitation`;
          newEvent.rsvpSettings.subtitle = 'Join us in celebration of our special day';
          newEvent.rsvpSettings.welcomeMessage = 'We would be honored by your presence at our wedding';
          break;
        case 'birthday':
          newEvent.rsvpSettings.title = `${formData.name} - Birthday Party`;
          newEvent.rsvpSettings.subtitle = 'Come celebrate with us!';
          newEvent.rsvpSettings.welcomeMessage = 'Join us for an amazing birthday celebration';
          break;
        case 'anniversary':
          newEvent.rsvpSettings.title = `${formData.name} - Anniversary Celebration`;
          newEvent.rsvpSettings.subtitle = 'Celebrating years of love and happiness';
          newEvent.rsvpSettings.welcomeMessage = 'Join us as we celebrate this special milestone';
          break;
        case 'graduation':
          newEvent.rsvpSettings.title = `${formData.name} - Graduation Ceremony`;
          newEvent.rsvpSettings.subtitle = 'Celebrating academic achievement';
          newEvent.rsvpSettings.welcomeMessage = 'Join us in celebrating this academic milestone';
          break;
        case 'corporate':
        case 'conference':
        case 'meeting':
        case 'seminar':
          newEvent.rsvpSettings.title = formData.name;
          newEvent.rsvpSettings.subtitle = 'Professional gathering';
          newEvent.rsvpSettings.welcomeMessage = `You are invited to ${formData.name}`;
          newEvent.rsvpSettings.guestCountEnabled = false;
          break;
        case 'awards':
          newEvent.rsvpSettings.title = `${formData.name} - Awards Ceremony`;
          newEvent.rsvpSettings.subtitle = 'An evening of recognition and celebration';
          newEvent.rsvpSettings.welcomeMessage = 'You are cordially invited to our awards ceremony';
          newEvent.rsvpSettings.guestCountEnabled = false;
          newEvent.rsvpSettings.specialRequestsEnabled = false;
          break;
        case 'festival':
          newEvent.rsvpSettings.title = `${formData.name} - Festival`;
          newEvent.rsvpSettings.subtitle = 'Join us for a celebration';
          newEvent.rsvpSettings.welcomeMessage = 'Come and enjoy the festivities with us';
          break;
        default:
          newEvent.rsvpSettings.title = formData.name;
          newEvent.rsvpSettings.subtitle = 'Join us for this special event';
          newEvent.rsvpSettings.welcomeMessage = 'We would be delighted to have you join us';
      }
      
      // Set location in RSVP settings
      if (formData.venue) {
        newEvent.rsvpSettings.location = formData.venue;
      }
      
      // Save the event and set it as current
      console.log('Saving new event:', newEvent);
      saveEvent(newEvent);
      setCurrentEvent(newEvent.id);
      
      toast({
        title: "Event Created!",
        description: `Your ${formData.type} event "${formData.name}" has been created successfully.`,
      });
      
      // Reset form and close modal
      resetForm();
      onOpenChange(false);
      
      // Small delay to ensure state updates
      setTimeout(() => {
        navigate(`/template/${newEvent.id}`);
      }, 100);
      
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error Creating Event",
        description: "There was a problem creating your event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
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
              placeholder="e.g., Sarah & John's Wedding"
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
              placeholder="e.g., St. Peter's Church"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-slate-300">Time</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white"
                disabled={isSubmitting}
              />
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventCreationModal;