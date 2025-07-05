
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Download, Send, QrCode, Save } from 'lucide-react';
import Header from '@/components/Header';
import html2canvas from 'html2canvas';

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [invitationData, setInvitationData] = useState({
    coupleName: 'James & Patricia',
    eventDate: 'Saturday 5th July, 2025',
    eventTime: '11AM',
    venue: 'St. Peter\'s Church, Oysterbay',
    reception: 'Lugalo Golf Club - Kawe',
    receptionTime: '6:00PM',
    theme: 'Movie Stars',
    rsvpContact: '+255786543366',
    additionalInfo: 'Kindly confirm your attendance'
  });

  const handleInputChange = (field: string, value: string) => {
    setInvitationData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownload = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#1e293b'
      });
      
      const link = document.createElement('a');
      link.download = `invitation-${invitationData.coupleName.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleSendInvitations = () => {
    // This would integrate with your backend to send invitations
    console.log('Sending invitations with data:', invitationData);
    navigate('/preview-message');
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
            <h1 className="text-3xl font-bold text-white">Customize Your Invitation</h1>
            <p className="text-slate-300">Fill in your event details to personalize your invitation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Event Details</h2>
              
              <div className="space-y-4">
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
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleDownload}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Preview
              </Button>
              <Button 
                onClick={handleSendInvitations}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invitations
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="sticky top-8">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Live Preview</h2>
              
              <div 
                ref={cardRef}
                className="bg-gradient-to-br from-slate-700 to-slate-800 p-8 rounded-lg text-center border border-slate-600 shadow-2xl"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                }}
              >
                <div className="mb-6">
                  <p className="text-teal-400 text-sm uppercase tracking-wider mb-2">Lights, Camera, Love</p>
                  <p className="text-white text-xs opacity-75 mb-1">THE FAMILY OF</p>
                  <p className="text-white text-xs opacity-75">MR. & MRS. FRANCIS BROWN</p>
                  <p className="text-white text-xs opacity-75 mb-4">CORDIALLY INVITES</p>
                  <h1 className="text-white text-xs uppercase tracking-wide mb-2">COLLINS VICTOR LEMA</h1>
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
                    <p className="text-teal-400 text-xs font-mono">CYNTHIA PONERA {invitationData.rsvpContact}</p>
                    <p className="text-teal-400 text-xs font-mono">CHRISTINA BESSY +255634231181</p>
                  </div>
                  
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-white/90 rounded flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-slate-900" />
                    </div>
                  </div>
                  
                  <p className="text-white text-xs bg-slate-900/50 px-2 py-1 rounded">SINGLE</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
