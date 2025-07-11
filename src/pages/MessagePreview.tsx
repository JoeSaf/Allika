
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import Header from '@/components/Header';
import { getCurrentEvent, updateAnalytics, getEventAnalytics } from '@/utils/storage';

const MessagePreview = () => {
  const navigate = useNavigate();
  const [selectedResponse, setSelectedResponse] = useState<'accept' | 'decline' | null>(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventStats, setEventStats] = useState({
    messagesSent: 0,
    delivered: 0,
    read: 0,
    responded: 0
  });

  useEffect(() => {
    loadEventData();
  }, []);

  const loadEventData = () => {
    const event = getCurrentEvent();
    if (!event) return;
    
    setCurrentEvent(event);
    
    // Update and get analytics
    updateAnalytics(event);
    const analytics = getEventAnalytics(event.id);
    
    if (analytics) {
      setEventStats({
        messagesSent: analytics.messagesSent,
        delivered: analytics.delivered,
        read: analytics.read,
        responded: analytics.responded
      });
    }
  };

  // If no event selected, show empty state
  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Message Preview</h1>
              <p className="text-slate-300">No event selected</p>
            </div>
          </div>

          <Card className="bg-slate-800 border-slate-700 p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-4">No Event Selected</h2>
            <p className="text-slate-300 mb-6">Please select an event from the dashboard to preview messages.</p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Generate WhatsApp message based on event data
  const generateWhatsAppMessage = () => {
    const sampleGuestName = currentEvent.guests.length > 0 ? currentEvent.guests[0].name : 'Guest';
    
    return `🎉 Habari ${sampleGuestName}!

Tafadhali pokea mwaliko wa ${currentEvent.title.toUpperCase()}, Itakayofanyika ${currentEvent.date}, ${currentEvent.venue.toUpperCase()}${currentEvent.time ? `, SAA ${currentEvent.time}` : ''}.

${currentEvent.reception ? `Followed by reception at ${currentEvent.receptionTime || 'TBD'}, ${currentEvent.reception.toUpperCase()}` : ''}

${currentEvent.theme ? `THEME: ${currentEvent.theme.toUpperCase()}` : ''}

Tafadhali bofya chaguo mojawapo hapo chini kuthibitisha ushiriki

Karibu Sana!

RSVP: ${currentEvent.rsvpContact}
Ujumbe huu, umetumwa kwa kupitia Alika`;
  };

  const whatsappMessage = generateWhatsAppMessage();

  const handleResponse = (response: 'accept' | 'decline') => {
    setSelectedResponse(response);
    console.log(`Guest ${response}ed the invitation`);
  };

  const goBackToEditor = () => {
    navigate(`/template/${currentEvent.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={goBackToEditor}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Editor
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Message Preview</h1>
            <p className="text-slate-300">Event: {currentEvent.title}</p>
          </div>
        </div>

        {/* Event Summary Card */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Event Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Event</p>
              <p className="text-white font-semibold">{currentEvent.title}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Date & Time</p>
              <p className="text-white font-semibold">{currentEvent.date}</p>
              {currentEvent.time && <p className="text-slate-300 text-sm">{currentEvent.time}</p>}
            </div>
            <div>
              <p className="text-slate-400 text-sm">Venue</p>
              <p className="text-white font-semibold">{currentEvent.venue}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Theme</p>
              <p className="text-white font-semibold">{currentEvent.theme || 'Not specified'}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* WhatsApp/SMS Preview */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-white">WhatsApp Message Preview</h2>
              </div>
              
              {/* Mock Phone Interface */}
              <div className="bg-slate-700 rounded-3xl p-4 max-w-sm mx-auto">
                <div className="bg-slate-600 rounded-2xl p-1 mb-4">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Alika</p>
                        <p className="text-slate-300 text-xs">Online</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-800 rounded-lg p-3 max-w-xs">
                    {/* Image in WhatsApp message */}
                    {currentEvent.invitationImage && (
                      <div className="mb-3">
                        <img
                          src={currentEvent.invitationImage}
                          alt="Invitation preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-white text-sm whitespace-pre-line leading-relaxed">{whatsappMessage}</p>
                    <p className="text-slate-400 text-xs mt-2">17:38</p>
                  </div>
                  
                  {/* Response Buttons using RSVP data */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResponse('accept')}
                      className={`flex-1 text-xs ${
                        selectedResponse === 'accept' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white`}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {currentEvent.rsvpSettings.confirmText}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResponse('decline')}
                      className={`flex-1 text-xs ${
                        selectedResponse === 'decline' 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-red-500 hover:bg-red-600'
                      } text-white`}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      {currentEvent.rsvpSettings.declineText}
                    </Button>
                  </div>
                  
                  {selectedResponse && (
                    <div className="bg-slate-600 rounded-lg p-3 max-w-xs ml-auto">
                      <p className="text-white text-sm">
                        {selectedResponse === 'accept' 
                          ? currentEvent.rsvpSettings.thankYouMessage 
                          : 'Thank you for letting us know. We\'ll miss you!'}
                      </p>
                      <p className="text-slate-400 text-xs mt-2">17:40 ✓✓</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Message Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{eventStats.messagesSent}</div>
                  <div className="text-slate-300 text-sm">Messages Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{eventStats.delivered}</div>
                  <div className="text-slate-300 text-sm">Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-400">{eventStats.read}</div>
                  <div className="text-slate-300 text-sm">Read</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{eventStats.responded}</div>
                  <div className="text-slate-300 text-sm">Responded</div>
                </div>
              </div>
            </Card>
          </div>

          {/* RSVP Form Preview */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">RSVP Form Preview</h2>
              <p className="text-slate-300 mb-6">This is what guests see when they click the RSVP link</p>
              
              {/* Dynamic RSVP Form using event data */}
              <div 
                className="rounded-lg p-6 max-w-md mx-auto"
                style={{ backgroundColor: currentEvent.rsvpSettings.backgroundColor }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: currentEvent.rsvpSettings.textColor }}>
                    {currentEvent.rsvpSettings.title}
                  </h3>
                  <p style={{ color: currentEvent.rsvpSettings.textColor }}>{currentEvent.rsvpSettings.subtitle}</p>
                  <p className="text-sm opacity-75" style={{ color: currentEvent.rsvpSettings.textColor }}>
                    {currentEvent.venue}
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-center text-sm" style={{ color: currentEvent.rsvpSettings.textColor }}>
                    {currentEvent.rsvpSettings.welcomeMessage}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium mb-2 text-sm" style={{ color: currentEvent.rsvpSettings.textColor }}>
                      Will you be attending?
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center justify-center gap-2"
                        style={{ 
                          borderColor: currentEvent.rsvpSettings.accentColor, 
                          color: currentEvent.rsvpSettings.accentColor,
                          backgroundColor: 'transparent'
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {currentEvent.rsvpSettings.confirmText}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center justify-center gap-2"
                        style={{ 
                          borderColor: '#ef4444', 
                          color: '#ef4444',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                        {currentEvent.rsvpSettings.declineText}
                      </Button>
                    </div>
                  </div>
                  
                  {currentEvent.rsvpSettings.guestCountEnabled && (
                    <div>
                      <label className="block font-medium mb-2 text-sm" style={{ color: currentEvent.rsvpSettings.textColor }}>
                        {currentEvent.rsvpSettings.guestCountLabel}
                      </label>
                      <select 
                        className="w-full p-2 rounded-lg border text-sm"
                        style={{ 
                          backgroundColor: currentEvent.rsvpSettings.backgroundColor,
                          borderColor: currentEvent.rsvpSettings.accentColor,
                          color: currentEvent.rsvpSettings.textColor
                        }}
                      >
                        {currentEvent.rsvpSettings.guestCountOptions.map((option, index) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Render additional custom fields */}
                  {currentEvent.rsvpSettings.additionalFields.map((field) => (
                    <div key={field.id}>
                      <label className="block font-medium mb-2 text-sm" style={{ color: currentEvent.rsvpSettings.textColor }}>
                        {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      {field.type === 'text' && (
                        <input
                          type="text"
                          className="w-full p-2 rounded-lg border text-sm"
                          style={{ 
                            backgroundColor: currentEvent.rsvpSettings.backgroundColor,
                            borderColor: currentEvent.rsvpSettings.accentColor,
                            color: currentEvent.rsvpSettings.textColor
                          }}
                        />
                      )}
                      {field.type === 'textarea' && (
                        <textarea
                          className="w-full p-2 rounded-lg border h-16 text-sm"
                          style={{ 
                            backgroundColor: currentEvent.rsvpSettings.backgroundColor,
                            borderColor: currentEvent.rsvpSettings.accentColor,
                            color: currentEvent.rsvpSettings.textColor
                          }}
                        />
                      )}
                      {field.type === 'select' && (
                        <select
                          className="w-full p-2 rounded-lg border text-sm"
                          style={{ 
                            backgroundColor: currentEvent.rsvpSettings.backgroundColor,
                            borderColor: currentEvent.rsvpSettings.accentColor,
                            color: currentEvent.rsvpSettings.textColor
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
                  
                  {currentEvent.rsvpSettings.specialRequestsEnabled && (
                    <div>
                      <label className="block font-medium mb-2 text-sm" style={{ color: currentEvent.rsvpSettings.textColor }}>
                        {currentEvent.rsvpSettings.specialRequestsLabel}
                      </label>
                      <textarea 
                        className="w-full p-2 rounded-lg border h-16 text-sm"
                        placeholder={currentEvent.rsvpSettings.specialRequestsPlaceholder}
                        style={{ 
                          backgroundColor: currentEvent.rsvpSettings.backgroundColor,
                          borderColor: currentEvent.rsvpSettings.accentColor,
                          color: currentEvent.rsvpSettings.textColor
                        }}
                      />
                    </div>
                  )}
                  
                  <Button 
                    className="w-full py-2 font-semibold text-sm"
                    style={{ 
                      backgroundColor: currentEvent.rsvpSettings.buttonColor,
                      color: '#ffffff'
                    }}
                  >
                    {currentEvent.rsvpSettings.submitButtonText}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate('/view-analytics')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Send to All Guests
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagePreview;
