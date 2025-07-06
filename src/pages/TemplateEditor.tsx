import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Download, Send, QrCode, Save, Upload, X, Plus, Minus, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import html2canvas from 'html2canvas';

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const rsvpRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [invitationData, setInvitationData] = useState({
    coupleName: 'James & Patricia',
    eventDate: 'Saturday 5th July, 2025',
    eventTime: '11AM',
    venue: 'St. Peter\'s Church, Oysterbay',
    reception: 'Lugalo Golf Club - Kawe',
    receptionTime: '6:00PM',
    theme: 'Movie Stars',
    rsvpContact: '+255786543366',
    additionalInfo: 'Kindly confirm your attendance',
    invitingFamily: 'MR. & MRS. FRANCIS BROWN',
    guestName: 'COLLINS VICTOR LEMA',
    invitationImage: null as string | null
  });

  const [rsvpData, setRsvpData] = useState({
    title: 'James & Patricia Wedding',
    subtitle: 'Saturday 5th July, 2025',
    location: 'St. Peter\'s Church, Oysterbay',
    welcomeMessage: 'We are excited to celebrate with you! Please let us know if you can join us.',
    confirmText: 'Yes, I\'ll be there',
    declineText: 'Sorry, can\'t make it',
    guestCountEnabled: true,
    guestCountLabel: 'Number of guests',
    guestCountOptions: ['1 person', '2 people', '3 people', '4+ people'],
    specialRequestsEnabled: true,
    specialRequestsLabel: 'Special requests or dietary restrictions',
    specialRequestsPlaceholder: 'Let us know if you have any special requirements...',
    additionalFields: [] as Array<{
      id: string;
      label: string;
      type: 'text' | 'textarea' | 'select';
      required: boolean;
      options?: string[];
    }>,
    submitButtonText: 'Submit RSVP',
    thankYouMessage: 'Thank you for your response! We look forward to celebrating with you.',
    backgroundColor: '#334155', // slate-700
    textColor: '#ffffff',
    buttonColor: '#0d9488', // teal-600
    accentColor: '#14b8a6' // teal-500
  });

  const [activeTab, setActiveTab] = useState('invitation');

  const handleInputChange = (field: string, value: string) => {
    setInvitationData(prev => ({ ...prev, [field]: value }));
  };

  const handleRsvpChange = (field: string, value: any) => {
    setRsvpData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInvitationData(prev => ({ ...prev, invitationImage: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setInvitationData(prev => ({ ...prev, invitationImage: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addGuestCountOption = () => {
    const newOption = `${rsvpData.guestCountOptions.length + 1} people`;
    setRsvpData(prev => ({
      ...prev,
      guestCountOptions: [...prev.guestCountOptions, newOption]
    }));
  };

  const removeGuestCountOption = (index: number) => {
    setRsvpData(prev => ({
      ...prev,
      guestCountOptions: prev.guestCountOptions.filter((_, i) => i !== index)
    }));
  };

  const updateGuestCountOption = (index: number, value: string) => {
    setRsvpData(prev => ({
      ...prev,
      guestCountOptions: prev.guestCountOptions.map((option, i) => 
        i === index ? value : option
      )
    }));
  };

  const addAdditionalField = () => {
    const newField = {
      id: `field-${Date.now()}`,
      label: 'New Field',
      type: 'text' as const,
      required: false
    };
    setRsvpData(prev => ({
      ...prev,
      additionalFields: [...prev.additionalFields, newField]
    }));
  };

  const updateAdditionalField = (id: string, updates: Partial<typeof rsvpData.additionalFields[0]>) => {
    setRsvpData(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    }));
  };

  const removeAdditionalField = (id: string) => {
    setRsvpData(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.filter(field => field.id !== id)
    }));
  };

  const handleDownload = async (type: 'invitation' | 'rsvp' = 'invitation') => {
    const ref = type === 'invitation' ? cardRef : rsvpRef;
    if (ref.current) {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: type === 'invitation' ? '#1e293b' : rsvpData.backgroundColor
      });
      
      const link = document.createElement('a');
      link.download = `${type}-${invitationData.coupleName.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleSendInvitations = () => {
    console.log('Sending invitations with data:', { invitationData, rsvpData });
    navigate('/preview-message', { 
      state: { 
        templateData: { 
          invitationData, 
          rsvpData 
        } 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/templates')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Customize Your Event</h1>
            <p className="text-slate-300">Design your invitation and RSVP page</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="invitation" className="data-[state=active]:bg-teal-600">
              Invitation Design
            </TabsTrigger>
            <TabsTrigger value="rsvp" className="data-[state=active]:bg-teal-600">
              RSVP Page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitation" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Invitation Form Panel */}
              <div className="space-y-6">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Event Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invitingFamily" className="text-white">Inviting Family</Label>
                      <Input
                        id="invitingFamily"
                        value={invitationData.invitingFamily}
                        onChange={(e) => handleInputChange('invitingFamily', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                        placeholder="e.g., MR. & MRS. FRANCIS BROWN"
                      />
                    </div>

                    <div>
                      <Label htmlFor="guestName" className="text-white">Guest Name</Label>
                      <Input
                        id="guestName"
                        value={invitationData.guestName}
                        onChange={(e) => handleInputChange('guestName', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                        placeholder="e.g., COLLINS VICTOR LEMA"
                      />
                    </div>

                    <div>
                      <Label htmlFor="coupleName" className="text-white">Couple Name / Event Title</Label>
                      <Input
                        id="coupleName"
                        value={invitationData.coupleName}
                        onChange={(e) => handleInputChange('coupleName', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="eventDate" className="text-white">Event Date</Label>
                        <Input
                          id="eventDate"
                          value={invitationData.eventDate}
                          onChange={(e) => handleInputChange('eventDate', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="eventTime" className="text-white">Event Time</Label>
                        <Input
                          id="eventTime"
                          value={invitationData.eventTime}
                          onChange={(e) => handleInputChange('eventTime', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="venue" className="text-white">Ceremony Venue</Label>
                      <Input
                        id="venue"
                        value={invitationData.venue}
                        onChange={(e) => handleInputChange('venue', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reception" className="text-white">Reception Venue</Label>
                        <Input
                          id="reception"
                          value={invitationData.reception}
                          onChange={(e) => handleInputChange('reception', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="receptionTime" className="text-white">Reception Time</Label>
                        <Input
                          id="receptionTime"
                          value={invitationData.receptionTime}
                          onChange={(e) => handleInputChange('receptionTime', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="theme" className="text-white">Theme</Label>
                      <Input
                        id="theme"
                        value={invitationData.theme}
                        onChange={(e) => handleInputChange('theme', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rsvpContact" className="text-white">RSVP Contact</Label>
                      <Input
                        id="rsvpContact"
                        value={invitationData.rsvpContact}
                        onChange={(e) => handleInputChange('rsvpContact', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="additionalInfo" className="text-white">Additional Information</Label>
                      <Textarea
                        id="additionalInfo"
                        value={invitationData.additionalInfo}
                        onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
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
                    <h2 className="text-xl font-bold text-white">Invitation Preview</h2>
                    <Button
                      onClick={() => handleDownload('invitation')}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div 
                    ref={cardRef}
                    className="bg-gradient-to-br from-slate-700 to-slate-800 p-8 rounded-lg text-center border border-slate-600 shadow-2xl relative overflow-hidden"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                    }}
                  >
                    {/* Background Image */}
                    {invitationData.invitationImage && (
                      <div className="absolute inset-0 opacity-20">
                        <img
                          src={invitationData.invitationImage}
                          alt="Background"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    <div className="relative z-10">
                      <div className="mb-6">
                        <p className="text-teal-400 text-sm uppercase tracking-wider mb-2">Lights, Camera, Love</p>
                        <p className="text-white text-xs opacity-75 mb-1">THE FAMILY OF</p>
                        <p className="text-white text-xs opacity-75 mb-4">{invitationData.invitingFamily}</p>
                        <p className="text-white text-xs opacity-75 mb-4">CORDIALLY INVITES</p>
                        <h1 className="text-white text-xs uppercase tracking-wide mb-2">{invitationData.guestName}</h1>
                      </div>
                      
                      <div className="mb-6">
                        <p className="text-white text-xs mb-1">TO THE WEDDING CEREMONY</p>
                        <p className="text-white text-xs mb-1">OF THEIR BELOVED CHILDREN</p>
                        
                        <div className="my-6">
                          <h2 className="text-white text-2xl font-script mb-2">{invitationData.coupleName}</h2>
                        </div>
                        
                        <p className="text-white text-xs mb-1">AS THEY EXCHANGE THEIR VOWS</p>
                        <p className="text-white text-xs mb-1">ON {invitationData.eventDate.toUpperCase()}</p>
                        <p className="text-white text-xs mb-1">{invitationData.eventTime}, {invitationData.venue.toUpperCase()}</p>
                        <p className="text-white text-xs mb-1">FOLLOWED BY RECEPTION</p>
                        <p className="text-white text-xs mb-6">AT {invitationData.receptionTime}, {invitationData.reception.toUpperCase()}</p>
                        
                        <p className="text-white text-xs mb-4">THEME: {invitationData.theme.toUpperCase()}</p>
                        
                        <div className="border-t border-white/20 pt-4 mb-4">
                          <p className="text-white text-xs mb-2">RSVP:</p>
                          <p className="text-teal-400 text-xs font-mono">{invitationData.rsvpContact}</p>
                        </div>
                        
                        <div className="flex justify-center mb-4">
                          <div className="w-16 h-16 bg-white/90 rounded flex items-center justify-center">
                            <QrCode className="w-12 h-12 text-slate-900" />
                          </div>
                        </div>
                        
                        <p className="text-white text-xs bg-slate-900/50 px-2 py-1 rounded">SINGLE</p>
                      </div>
                    </div>
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
                        onChange={(e) => handleRsvpChange('title', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rsvpSubtitle" className="text-white">Subtitle</Label>
                      <Input
                        id="rsvpSubtitle"
                        value={rsvpData.subtitle}
                        onChange={(e) => handleRsvpChange('subtitle', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rsvpLocation" className="text-white">Location</Label>
                      <Input
                        id="rsvpLocation"
                        value={rsvpData.location}
                        onChange={(e) => handleRsvpChange('location', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="welcomeMessage" className="text-white">Welcome Message</Label>
                      <Textarea
                        id="welcomeMessage"
                        value={rsvpData.welcomeMessage}
                        onChange={(e) => handleRsvpChange('welcomeMessage', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="confirmText" className="text-white">Confirm Button Text</Label>
                        <Input
                          id="confirmText"
                          value={rsvpData.confirmText}
                          onChange={(e) => handleRsvpChange('confirmText', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="declineText" className="text-white">Decline Button Text</Label>
                        <Input
                          id="declineText"
                          value={rsvpData.declineText}
                          onChange={(e) => handleRsvpChange('declineText', e.target.value)}
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
                          onCheckedChange={(checked) => handleRsvpChange('guestCountEnabled', checked)}
                        />
                      </div>
                      
                      {rsvpData.guestCountEnabled && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="guestCountLabel" className="text-white">Field Label</Label>
                            <Input
                              id="guestCountLabel"
                              value={rsvpData.guestCountLabel}
                              onChange={(e) => handleRsvpChange('guestCountLabel', e.target.value)}
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
                          onCheckedChange={(checked) => handleRsvpChange('specialRequestsEnabled', checked)}
                        />
                      </div>
                      
                      {rsvpData.specialRequestsEnabled && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="specialRequestsLabel" className="text-white">Field Label</Label>
                            <Input
                              id="specialRequestsLabel"
                              value={rsvpData.specialRequestsLabel}
                              onChange={(e) => handleRsvpChange('specialRequestsLabel', e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="specialRequestsPlaceholder" className="text-white">Placeholder Text</Label>
                            <Input
                              id="specialRequestsPlaceholder"
                              value={rsvpData.specialRequestsPlaceholder}
                              onChange={(e) => handleRsvpChange('specialRequestsPlaceholder', e.target.value)}
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
                                  onChange={(e) => updateAdditionalField(field.id, { type: e.target.value as any })}
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

                            {field.type === 'select' && (
                              <div className="mt-3">
                                <Label className="text-white text-sm">Options (one per line)</Label>
                                <Textarea
                                  value={field.options?.join('\n') || ''}
                                  onChange={(e) => updateAdditionalField(field.id, { 
                                    options: e.target.value.split('\n').filter(opt => opt.trim()) 
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
                        onChange={(e) => handleRsvpChange('submitButtonText', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="thankYouMessage" className="text-white">Thank You Message</Label>
                      <Textarea
                        id="thankYouMessage"
                        value={rsvpData.thankYouMessage}
                        onChange={(e) => handleRsvpChange('thankYouMessage', e.target.value)}
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
                              onChange={(e) => handleRsvpChange('backgroundColor', e.target.value)}
                              className="w-12 h-10 rounded border border-slate-600"
                            />
                            <Input
                              value={rsvpData.backgroundColor}
                              onChange={(e) => handleRsvpChange('backgroundColor', e.target.value)}
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
                              onChange={(e) => handleRsvpChange('textColor', e.target.value)}
                              className="w-12 h-10 rounded border border-slate-600"
                            />
                            <Input
                              value={rsvpData.textColor}
                              onChange={(e) => handleRsvpChange('textColor', e.target.value)}
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
                              onChange={(e) => handleRsvpChange('buttonColor', e.target.value)}
                              className="w-12 h-10 rounded border border-slate-600"
                            />
                            <Input
                              value={rsvpData.buttonColor}
                              onChange={(e) => handleRsvpChange('buttonColor', e.target.value)}
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
                              onChange={(e) => handleRsvpChange('accentColor', e.target.value)}
                              className="w-12 h-10 rounded border border-slate-600"
                            />
                            <Input
                              value={rsvpData.accentColor}
                              onChange={(e) => handleRsvpChange('accentColor', e.target.value)}
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
                      onClick={() => handleDownload('rsvp')}
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
                              backgroundColor: 'transparent'
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {rsvpData.confirmText}
                          </button>
                          <button 
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors"
                            style={{ 
                              borderColor: '#ef4444', 
                              color: '#ef4444',
                              backgroundColor: 'transparent'
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
                              color: rsvpData.textColor
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
                            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          {field.type === 'text' && (
                            <input
                              type="text"
                              className="w-full p-2 rounded-lg border"
                              style={{ 
                                backgroundColor: rsvpData.backgroundColor,
                                borderColor: rsvpData.accentColor,
                                color: rsvpData.textColor
                              }}
                            />
                          )}
                          {field.type === 'textarea' && (
                            <textarea
                              className="w-full p-2 rounded-lg border h-20"
                              style={{ 
                                backgroundColor: rsvpData.backgroundColor,
                                borderColor: rsvpData.accentColor,
                                color: rsvpData.textColor
                              }}
                            />
                          )}
                          {field.type === 'select' && (
                            <select
                              className="w-full p-2 rounded-lg border"
                              style={{ 
                                backgroundColor: rsvpData.backgroundColor,
                                borderColor: rsvpData.accentColor,
                                color: rsvpData.textColor
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
                              color: rsvpData.textColor
                            }}
                          />
                        </div>
                      )}
                      
                      <button 
                        className="w-full py-3 rounded-lg font-semibold transition-colors"
                        style={{ 
                          backgroundColor: rsvpData.buttonColor,
                          color: '#ffffff'
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
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            onClick={() => handleDownload(activeTab as 'invitation' | 'rsvp')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download {activeTab === 'invitation' ? 'Invitation' : 'RSVP Page'}
          </Button>
          <Button 
            onClick={handleSendInvitations}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Invitations
          </Button>
          <Button 
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;