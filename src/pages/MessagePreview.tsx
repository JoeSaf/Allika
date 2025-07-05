import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/Header';

const MessagePreview = () => {
  const navigate = useNavigate();
  const [selectedResponse, setSelectedResponse] = useState<'accept' | 'decline' | null>(null);

  const sampleGuest = {
    name: 'Collins Victor Lema',
    phone: '+255786543366',
    eventTitle: 'James & Patricia Wedding',
    eventDate: 'Saturday 5th July, 2025',
    invitationImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop'
  };

  const whatsappMessage = `🎉 Habari ${sampleGuest.name}!

Tafadhali pokea mwaliko wa HARUSI YA ${sampleGuest.eventTitle.toUpperCase()}, Itakayofanyika ${sampleGuest.eventDate}, LUGALO GOLF CLUB - KAWE, SAA 12:00 JIONI.

Tafadhali bofya chaguo mojawapo hapo chini kuthibitisha ushiriki

Karibu Sana!

IMETUMWA NA ENVAITA`;

  const handleResponse = (response: 'accept' | 'decline') => {
    setSelectedResponse(response);
    console.log(`Guest ${response}ed the invitation`);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/template/1')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Editor
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Invitation Message Preview</h1>
            <p className="text-slate-300">See how your guests will receive the invitation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                        <span className="text-white font-bold text-sm">E</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">ENVAITA</p>
                        <p className="text-slate-300 text-xs">Online</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-800 rounded-lg p-3 max-w-xs">
                    {/* Image in WhatsApp message */}
                    {sampleGuest.invitationImage && (
                      <div className="mb-3">
                        <img
                          src={sampleGuest.invitationImage}
                          alt="Invitation preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-white text-sm whitespace-pre-line">{whatsappMessage}</p>
                    <p className="text-slate-400 text-xs mt-2">17:38</p>
                  </div>
                  
                  {/* Response Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResponse('accept')}
                      className={`flex-1 ${
                        selectedResponse === 'accept' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Asante. Nitashiriki
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResponse('decline')}
                      className={`flex-1 ${
                        selectedResponse === 'decline' 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-red-500 hover:bg-red-600'
                      } text-white`}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Asante. Nina Udhuru
                    </Button>
                  </div>
                  
                  {selectedResponse && (
                    <div className="bg-slate-600 rounded-lg p-3 max-w-xs ml-auto">
                      <p className="text-white text-sm">
                        {selectedResponse === 'accept' 
                          ? 'Asante! Tunasubiri kukuona.' 
                          : 'Asante kwa kutujulisha. Tutakukumbuka.'}
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
                  <div className="text-2xl font-bold text-blue-400">250</div>
                  <div className="text-slate-300 text-sm">Messages Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">187</div>
                  <div className="text-slate-300 text-sm">Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-400">142</div>
                  <div className="text-slate-300 text-sm">Read</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">89</div>
                  <div className="text-slate-300 text-sm">Responded</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">RSVP Form Preview</h2>
              <p className="text-slate-300 mb-6">This is what guests see when they click the RSVP link</p>
              
              {/* Mock RSVP Form */}
              <div className="bg-slate-700 rounded-lg p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">James & Patricia Wedding</h3>
                  <p className="text-slate-300">Saturday 5th July, 2025</p>
                  <p className="text-slate-400 text-sm">St. Peter's Church, Oysterbay</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Will you be attending?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Yes, I'll be there
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Sorry, can't make it
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Number of guests
                    </label>
                    <select className="w-full bg-slate-600 border border-slate-500 text-white rounded-lg p-2">
                      <option>1 person</option>
                      <option>2 people</option>
                      <option>3 people</option>
                      <option>4+ people</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Special requests or dietary restrictions
                    </label>
                    <textarea 
                      className="w-full bg-slate-600 border border-slate-500 text-white rounded-lg p-2 h-20"
                      placeholder="Let us know if you have any special requirements..."
                    />
                  </div>
                  
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                    Submit RSVP
                  </Button>
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button 
                onClick={() => navigate('/analytics')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
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
