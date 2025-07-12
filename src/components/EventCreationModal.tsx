
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormItem, FormLabel, FormControl } from '@/components/ui/form';
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
    description: ''
  });

  const eventTypes = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'birthday', label: 'Birthday Party' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'graduation', label: 'Graduation' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'awards', label: 'Awards Ceremony' },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Event Name Required",
        description: "Please enter a name for your event.",
        variant: "destructive"
      });
      return;
    }

    // Create new event with proper naming
    const newEvent = createDefaultEvent(formData.type);
    newEvent.title = formData.name.trim();
    newEvent.additionalInfo = formData.description;
    
    // Customize RSVP settings based on event type
    switch (formData.type) {
      case 'wedding':
        newEvent.rsvpSettings.title = 'Wedding Invitation';
        newEvent.rsvpSettings.subtitle = 'Join us in celebration of our special day';
        newEvent.rsvpSettings.welcomeMessage = 'We would be honored by your presence at our wedding';
        break;
      case 'birthday':
        newEvent.rsvpSettings.title = 'Birthday Party';
        newEvent.rsvpSettings.subtitle = 'Come celebrate with us!';
        newEvent.rsvpSettings.welcomeMessage = 'Join us for an amazing birthday celebration';
        break;
      case 'anniversary':
        newEvent.rsvpSettings.title = 'Anniversary Celebration';
        newEvent.rsvpSettings.subtitle = 'Celebrating years of love and happiness';
        newEvent.rsvpSettings.welcomeMessage = 'Join us as we celebrate this special milestone';
        break;
      case 'graduation':
        newEvent.rsvpSettings.title = 'Graduation Ceremony';
        newEvent.rsvpSettings.subtitle = 'Celebrating academic achievement';
        newEvent.rsvpSettings.welcomeMessage = 'Join us in celebrating this academic milestone';
        break;
      case 'corporate':
        newEvent.rsvpSettings.title = 'Corporate Event';
        newEvent.rsvpSettings.subtitle = 'Professional gathering';
        newEvent.rsvpSettings.welcomeMessage = 'You are invited to our corporate event';
        newEvent.rsvpSettings.guestCountEnabled = false;
        break;
      case 'awards':
        newEvent.rsvpSettings.title = 'Awards Ceremony';
        newEvent.rsvpSettings.subtitle = 'An evening of recognition and celebration';
        newEvent.rsvpSettings.welcomeMessage = 'You are cordially invited to our awards ceremony';
        newEvent.rsvpSettings.guestCountEnabled = false;
        newEvent.rsvpSettings.specialRequestsEnabled = false;
        break;
      default:
        newEvent.rsvpSettings.title = formData.name;
        newEvent.rsvpSettings.subtitle = 'Join us for this special event';
        newEvent.rsvpSettings.welcomeMessage = 'We would be delighted to have you join us';
    }
    
    // Save the event and set it as current
    saveEvent(newEvent);
    setCurrentEvent(newEvent.id);
    
    // Store event data in JSON format
    const eventData = {
      ...newEvent,
      createdBy: JSON.parse(localStorage.getItem('alika_user') || '{}'),
      creationTimestamp: new Date().toISOString()
    };
    
    console.log('Event created:', JSON.stringify(eventData, null, 2));
    
    toast({
      title: "Event Created!",
      description: `Your ${formData.type} event "${formData.name}" has been created successfully.`,
    });
    
    // Close modal and navigate to template editor
    onOpenChange(false);
    navigate(`/template/${newEvent.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormItem>
            <FormLabel className="text-slate-300">Event Name</FormLabel>
            <FormControl>
              <Input
                name="name"
                type="text"
                placeholder="e.g., Sarah & John's Wedding"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                required
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel className="text-slate-300">Event Type</FormLabel>
            <FormControl>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel className="text-slate-300">Description (Optional)</FormLabel>
            <FormControl>
              <Input
                name="description"
                type="text"
                placeholder="Brief description of your event"
                value={formData.description}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </FormControl>
          </FormItem>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventCreationModal;
