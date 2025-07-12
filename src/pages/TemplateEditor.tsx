import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Upload } from 'lucide-react';
import Header from '@/components/Header';
import { createEvent, getEvent, updateEvent, deleteEvent, uploadImage } from '@/utils/storage';
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { ColorPicker } from "@/components/ui/color-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState({
    id: id || '',
    title: '',
    date: '',
    time: '',
    venue: '',
    theme: '',
    reception: '',
    receptionTime: '',
    rsvpContact: '',
    guests: [],
    invitationImage: null,
    rsvpSettings: {
      title: 'RSVP',
      subtitle: 'Please RSVP',
      welcomeMessage: 'We are excited to celebrate with you!',
      confirmText: 'Confirm',
      declineText: 'Decline',
      thankYouMessage: 'Thank you for your RSVP!',
      guestCountEnabled: false,
      guestCountLabel: 'Number of Guests',
      guestCountOptions: ['1', '2', '3', '4', '5+'],
      specialRequestsEnabled: false,
      specialRequestsLabel: 'Special Requests',
      specialRequestsPlaceholder: 'Enter any special requests here...',
      additionalFields: [],
      backgroundColor: '#f0f0f0',
      textColor: '#333333',
      accentColor: '#007bff',
      buttonColor: '#007bff',
      rsvpContact: '',
      submitButtonText: 'Submit RSVP'
    }
  });
  const [isNewEvent, setIsNewEvent] = useState(!id);
  const [imagePreview, setImagePreview] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  useEffect(() => {
    if (id) {
      const data = getEvent(id);
      if (data) {
        setEventData(data);
        setImagePreview(data.invitationImage);
      }
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleRSVPSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventData(prev => ({
      ...prev,
      rsvpSettings: {
        ...prev.rsvpSettings,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImageUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setEventData(prev => ({ ...prev, invitationImage: imageUrl }));
      setImagePreview(imageUrl);
      toast({
        title: "Upload Successful!",
        description: "Your image has been uploaded.",
      })
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your upload.",
      })
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleAddField = () => {
    setEventData(prev => ({
      ...prev,
      rsvpSettings: {
        ...prev.rsvpSettings,
        additionalFields: [...prev.rsvpSettings.additionalFields, { id: Date.now(), label: '', type: 'text', required: false, options: [] }]
      }
    }));
  };

  const handleFieldChange = (id, field, value) => {
    setEventData(prev => ({
      ...prev,
      rsvpSettings: {
        ...prev.rsvpSettings,
        additionalFields: prev.rsvpSettings.additionalFields.map(item =>
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const handleRemoveField = (id) => {
    setEventData(prev => ({
      ...prev,
      rsvpSettings: {
        ...prev.rsvpSettings,
        additionalFields: prev.rsvpSettings.additionalFields.filter(item => item.id !== id)
      }
    }));
  };

  const handleSave = () => {
    if (isNewEvent) {
      const newEventId = createEvent(eventData);
      navigate(`/template/${newEventId}`);
      toast({
        title: "Event Created!",
        description: "You have successfully created a new event.",
      })
    } else {
      updateEvent(eventData);
      toast({
        title: "Event Updated!",
        description: "You have successfully updated this event.",
      })
    }
  };

  const handleDelete = () => {
    deleteEvent(id);
    navigate('/dashboard');
    toast({
      title: "Event Deleted!",
      description: "You have successfully deleted this event.",
    })
  };

  const goToPreview = () => {
    updateEvent(eventData);
    navigate('/preview-message');
  };

  const RSVPFormSchema = z.object({
    title: z.string().min(2, {
      message: "Title must be at least 2 characters.",
    }),
  })

  const form = useForm<z.infer<typeof RSVPFormSchema>>({
    resolver: zodResolver(RSVPFormSchema),
    defaultValues: {
      title: eventData.rsvpSettings.title,
    },
    mode: "onChange",
  })

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-24 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{isNewEvent ? 'Create Event' : 'Edit Event'}</h1>
            <p className="text-slate-300">Customize your event details and RSVP settings.</p>
          </div>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>

        <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Event Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                Event Title
              </label>
              <Input
                type="text"
                name="title"
                value={eventData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                  Date
                </label>
                <Input
                  type="date"
                  name="date"
                  value={eventData.date}
                  onChange={handleInputChange}
                  className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                  Time
                </label>
                <Input
                  type="time"
                  name="time"
                  value={eventData.time}
                  onChange={handleInputChange}
                  className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                Venue
              </label>
              <Input
                type="text"
                name="venue"
                value={eventData.venue}
                onChange={handleInputChange}
                placeholder="Enter venue"
                className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                Theme (Optional)
              </label>
              <Input
                type="text"
                name="theme"
                value={eventData.theme}
                onChange={handleInputChange}
                placeholder="Enter theme"
                className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                Reception Venue (Optional)
              </label>
              <Input
                type="text"
                name="reception"
                value={eventData.reception}
                onChange={handleInputChange}
                placeholder="Enter reception venue"
                className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                Reception Time (Optional)
              </label>
              <Input
                type="text"
                name="receptionTime"
                value={eventData.receptionTime}
                onChange={handleInputChange}
                placeholder="Enter reception time"
                className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                RSVP Contact
              </label>
              <Input
                type="text"
                name="rsvpContact"
                value={eventData.rsvpContact}
                onChange={handleInputChange}
                placeholder="Enter RSVP contact"
                className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-300 mb-2 italic">Invitation Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500 file:bg-slate-600 file:border-0 file:text-white file:font-medium file:cursor-pointer"
              />
              {isImageUploading && <p className="text-slate-400 mt-2">Uploading image...</p>}
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Invitation Preview"
                    className="max-w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">RSVP Settings</h2>
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-slate-300 mb-2 italic">RSVP Form Title</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                        placeholder="Type RSVP title"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleRSVPSettingsChange({ target: { name: 'title', value: e.target.value } });
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      This is the title that will be displayed on the RSVP form.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                  RSVP Subtitle
                </label>
                <Input
                  type="text"
                  name="subtitle"
                  value={eventData.rsvpSettings.subtitle}
                  onChange={(e) => handleRSVPSettingsChange({ target: { name: 'subtitle', value: e.target.value } })}
                  placeholder="Enter RSVP subtitle"
                  className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                  Welcome Message
                </label>
                <Textarea
                  name="welcomeMessage"
                  value={eventData.rsvpSettings.welcomeMessage}
                  onChange={(e) => handleRSVPSettingsChange({ target: { name: 'welcomeMessage', value: e.target.value } })}
                  placeholder="Enter welcome message"
                  className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                    Confirm Text
                  </label>
                  <Input
                    type="text"
                    name="confirmText"
                    value={eventData.rsvpSettings.confirmText}
                    onChange={(e) => handleRSVPSettingsChange({ target: { name: 'confirmText', value: e.target.value } })}
                    placeholder="Enter confirm text"
                    className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                    Decline Text
                  </label>
                  <Input
                    type="text"
                    name="declineText"
                    value={eventData.rsvpSettings.declineText}
                    onChange={(e) => handleRSVPSettingsChange({ target: { name: 'declineText', value: e.target.value } })}
                    placeholder="Enter decline text"
                    className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                  Thank You Message
                </label>
                <Textarea
                  name="thankYouMessage"
                  value={eventData.rsvpSettings.thankYouMessage}
                  onChange={(e) => handleRSVPSettingsChange({ target: { name: 'thankYouMessage', value: e.target.value } })}
                  placeholder="Enter thank you message"
                  className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="guestCountEnabled" className="block text-sm font-medium text-slate-300 italic">
                  Enable Guest Count
                </label>
                <Switch
                  id="guestCountEnabled"
                  name="guestCountEnabled"
                  checked={eventData.rsvpSettings.guestCountEnabled}
                  onCheckedChange={(checked) => handleRSVPSettingsChange({ target: { name: 'guestCountEnabled', type: 'checkbox', checked } })}
                />
              </div>

              {eventData.rsvpSettings.guestCountEnabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                    Guest Count Label
                  </label>
                  <Input
                    type="text"
                    name="guestCountLabel"
                    value={eventData.rsvpSettings.guestCountLabel}
                    onChange={(e) => handleRSVPSettingsChange({ target: { name: 'guestCountLabel', value: e.target.value } })}
                    placeholder="Enter guest count label"
                    className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                  />

                  <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                    Guest Count Options
                  </label>
                  <Select onValueChange={(value) => handleRSVPSettingsChange({ target: { name: 'guestCountOptions', value: value } })}>
                    <SelectTrigger className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500 w-full">
                      <SelectValue placeholder="Select guest count options" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500">
                      {['1', '2', '3', '4', '5+'].map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label htmlFor="specialRequestsEnabled" className="block text-sm font-medium text-slate-300 italic">
                  Enable Special Requests
                </label>
                <Switch
                  id="specialRequestsEnabled"
                  name="specialRequestsEnabled"
                  checked={eventData.rsvpSettings.specialRequestsEnabled}
                  onCheckedChange={(checked) => handleRSVPSettingsChange({ target: { name: 'specialRequestsEnabled', type: 'checkbox', checked } })}
                />
              </div>

              {eventData.rsvpSettings.specialRequestsEnabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                    Special Requests Label
                  </label>
                  <Input
                    type="text"
                    name="specialRequestsLabel"
                    value={eventData.rsvpSettings.specialRequestsLabel}
                    onChange={(e) => handleRSVPSettingsChange({ target: { name: 'specialRequestsLabel', value: e.target.value } })}
                    placeholder="Enter special requests label"
                    className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                  />

                  <label className="block text-sm font-medium text-slate-300 mb-2 italic">
                    Special Requests Placeholder
                  </label>
                  <Input
                    type="text"
                    name="specialRequestsPlaceholder"
                    value={eventData.rsvpSettings.specialRequestsPlaceholder}
                    onChange={(e) => handleRSVPSettingsChange({ target: { name: 'specialRequestsPlaceholder', value: e.target.value } })}
                    placeholder="Enter special requests placeholder"
                    className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                  />
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Additional Fields</h3>
                {eventData.rsvpSettings.additionalFields.map((field) => (
                  <div key={field.id} className="mb-4 p-4 border rounded-md border-slate-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 italic">Label</label>
                        <Input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                          placeholder="Enter label"
                          className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 italic">Type</label>
                        <Select onValueChange={(value) => handleFieldChange(field.id, 'type', value)}>
                          <SelectTrigger className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500 w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500">
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 italic">Options (comma-separated)</label>
                        <Input
                          type="text"
                          placeholder="Enter options (comma-separated)"
                          className="bg-slate-700 text-white border-slate-600 focus-visible:ring-slate-500"
                          onChange={(e) => handleFieldChange(field.id, 'options', e.target.value.split(','))}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <label htmlFor={`required-${field.id}`} className="block text-sm font-medium text-slate-300 italic">Required</label>
                      <Checkbox
                        id={`required-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) => handleFieldChange(field.id, 'required', checked)}
                      />
                      <Button variant="destructive" size="sm" onClick={() => handleRemoveField(field.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button onClick={handleAddField} variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Form Styling</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 italic">Background Color</label>
                    <ColorPicker
                      color={eventData.rsvpSettings.backgroundColor}
                      onColorChange={(color) => handleRSVPSettingsChange({ target: { name: 'backgroundColor', value: color } })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 italic">Text Color</label>
                    <ColorPicker
                      color={eventData.rsvpSettings.textColor}
                      onColorChange={(color) => handleRSVPSettingsChange({ target: { name: 'textColor', value: color } })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 italic">Accent Color</label>
                    <ColorPicker
                      color={eventData.rsvpSettings.accentColor}
                      onColorChange={(color) => handleRSVPSettingsChange({ target: { name: 'accentColor', value: color } })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 italic">Button Color</label>
                    <ColorPicker
                      color={eventData.rsvpSettings.buttonColor}
                      onColorChange={(color) => handleRSVPSettingsChange({ target: { name: 'buttonColor', value: color } })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </Card>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={handleSave}>Save Changes</Button>
          <div className="flex gap-4">
            <Button onClick={goToPreview}>Preview Message</Button>
            {!isNewEvent && (
              <AlertDialog>
                <AlertDialogTrigger variant="destructive">Delete Event</AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your event
                      and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
