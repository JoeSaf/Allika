import React from 'react';
import { Card } from './ui/card';
import { QrCode } from 'lucide-react';

interface InvitationCardTemplateProps {
  invitationData: any;
  guest?: any;
  event?: any;
  qrCode?: string;
  template?: string;
  className?: string;
}

export const InvitationCardTemplate: React.FC<InvitationCardTemplateProps> = ({
  invitationData,
  guest,
  event,
  qrCode,
  template = 'template1',
  className = '',
}) => {
  // Fallbacks for data
  const coupleName = invitationData?.coupleName || invitationData?.couple_name || event?.title || '';
  const eventDate = invitationData?.eventDate || invitationData?.event_date || event?.date || '';
  const eventTime = invitationData?.eventTime || invitationData?.event_time || event?.time || '';
  const venue = invitationData?.venue || event?.venue || '';
  const reception = invitationData?.reception || event?.reception || '';
  const receptionTime = invitationData?.receptionTime || invitationData?.reception_time || event?.receptionTime || '';
  const theme = invitationData?.theme || event?.theme || '';
  const rsvpContact = invitationData?.rsvpContact || event?.rsvpContact || '';
  const rsvpContactSecondary = invitationData?.rsvpContactSecondary || event?.rsvpContactSecondary || '';
  const additionalInfo = invitationData?.additionalInfo || invitationData?.additional_info || '';
  const invitingFamily = invitationData?.invitingFamily || invitationData?.inviting_family || '';
  const guestName = guest?.name || 'Guest Name';
  const invitationImage = invitationData?.invitationImage || invitationData?.invitation_image || '';
  const eventDateWords = invitationData?.eventDateWords || invitationData?.event_date_words || '';
  const dateLang = invitationData?.dateLang || event?.dateLang || 'en';

  // Format time in words
  const formatTimeInWords = (timeString: string, language: string) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return timeString;
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      if (language === 'sw') {
        // Swahili time format
        const hour = date.getHours();
        const minute = date.getMinutes();
        
        // Swahili time words
        const swahiliHours = [
          'saa sita', 'saa moja', 'saa mbili', 'saa tatu', 'saa nne', 'saa tano',
          'saa sita', 'saa saba', 'saa nane', 'saa tisa', 'saa kumi', 'saa kumi na moja',
          'saa sita', 'saa moja', 'saa mbili', 'saa tatu', 'saa nne', 'saa tano',
          'saa sita', 'saa saba', 'saa nane', 'saa tisa', 'saa kumi', 'saa kumi na moja'
        ];
        
        const swahiliMinutes = [
          'saa kamili', 'dakika tano', 'dakika kumi', 'dakika kumi na tano', 'dakika ishirini',
          'dakika ishirini na tano', 'dakika thelathini', 'dakika thelathini na tano',
          'dakika arobaini', 'dakika arobaini na tano', 'dakika hamsini', 'dakika hamsini na tano'
        ];
        
        let timeInWords = swahiliHours[hour];
        
        if (minute > 0) {
          if (minute <= 30) {
            timeInWords += ` na ${swahiliMinutes[Math.floor(minute / 5)]}`;
          } else {
            const remainingMinutes = 60 - minute;
            const nextHour = (hour + 1) % 24;
            timeInWords = swahiliHours[nextHour] + ` kasoro ${swahiliMinutes[Math.floor(remainingMinutes / 5)]}`;
          }
        }
        
        return timeInWords;
      } else {
        // English time format
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.error('Error formatting time in words:', error);
      return timeString;
    }
  };

  const eventTimeInWords = formatTimeInWords(eventTime, dateLang);
  const receptionTimeInWords = formatTimeInWords(receptionTime, dateLang);

  // Template 1: Classic Portrait
  const renderTemplate1 = () => (
    <Card className={`bg-slate-800 border-slate-700 p-8 max-w-lg w-full shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{coupleName}</h2>
        <p className="text-slate-300 mb-1">{eventDateWords || eventDate} {eventTimeInWords && `at ${eventTimeInWords}`}</p>
        <p className="text-slate-400 mb-2">{venue}</p>
        {theme && <p className="text-teal-400 mb-2">Theme: {theme}</p>}
      </div>
      <div className="mb-6 text-center">
        <p className="text-white text-lg font-semibold mb-2">Dear {guestName},</p>
        <p className="text-slate-200 mb-2">You are cordially invited to our event!</p>
        {invitationImage && (
          <img src={invitationImage} alt="Invitation" className="mx-auto mb-4 rounded-lg max-h-48" />
        )}
      </div>
      
      {/* QR Code Section */}
      <div className="mb-6 text-center border-t border-slate-600 pt-6">
        <div className="bg-white rounded-lg p-4 inline-block">
          {qrCode ? (
            <img src={qrCode} alt="Check-in QR Code" className="w-32 h-32" />
          ) : (
            <div className="w-32 h-32 bg-slate-200 rounded flex items-center justify-center">
              <QrCode className="w-16 h-16 text-slate-400" />
            </div>
          )}
        </div>
        <p className="text-slate-300 mt-3 font-medium">Check-in QR Code</p>
        <p className="text-slate-400 text-sm mt-1">Present this code at the entrance</p>
      </div>
      
      {rsvpContact && (
        <div className="text-center text-xs text-slate-400 mt-2">
          <p>RSVP: {rsvpContact}</p>
          {rsvpContactSecondary && <p>Secondary: {rsvpContactSecondary}</p>}
        </div>
      )}
      {additionalInfo && <div className="text-center text-xs text-slate-400 mt-2">{additionalInfo}</div>}
    </Card>
  );

  // Template 2: Modern Landscape
  const renderTemplate2 = () => (
    <Card className={`bg-slate-700 border-slate-600 p-8 max-w-2xl w-full shadow-lg flex flex-row items-center ${className}`}>
      <div className="flex-1 pr-8">
        <h2 className="text-3xl font-bold text-white mb-2">{coupleName}</h2>
        <p className="text-slate-300 mb-1">{eventDateWords || eventDate} {eventTimeInWords && `at ${eventTimeInWords}`}</p>
        <p className="text-slate-400 mb-2">{venue}</p>
        {theme && <p className="text-teal-400 mb-2">Theme: {theme}</p>}
        <p className="text-white text-lg font-semibold mb-2 mt-4">Dear {guestName},</p>
        <p className="text-slate-200 mb-2">You are cordially invited to our event!</p>
        {rsvpContact && (
          <div className="text-slate-400 text-sm mt-2">
            <p>RSVP: {rsvpContact}</p>
            {rsvpContactSecondary && <p>Secondary: {rsvpContactSecondary}</p>}
          </div>
        )}
      </div>
      <div className="flex flex-col items-center">
        {invitationImage && (
          <img src={invitationImage} alt="Invitation" className="mb-4 rounded-lg max-h-48" />
        )}
        
        {/* QR Code Section */}
        <div className="text-center">
          <div className="bg-white rounded-lg p-3 inline-block mb-2">
            {qrCode ? (
              <img src={qrCode} alt="Check-in QR Code" className="w-28 h-28" />
            ) : (
              <div className="w-28 h-28 bg-slate-200 rounded flex items-center justify-center">
                <QrCode className="w-14 h-14 text-slate-400" />
              </div>
            )}
          </div>
          <p className="text-slate-300 text-sm font-medium">Check-in QR Code</p>
          <p className="text-slate-400 text-xs">Present at entrance</p>
        </div>
      </div>
    </Card>
  );

  // Template 3: Artistic Layout
  const renderTemplate3 = () => (
    <Card className={`bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-slate-600 shadow-2xl relative overflow-hidden min-h-[600px] ${className}`}>
      <div className="absolute inset-0">
        <div className="absolute top-4 right-4 w-32 h-32 bg-teal-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
      </div>
      <div className="relative z-10 p-8">
        <div className="mb-8 text-center">
          <p className="text-teal-400 text-sm uppercase tracking-wider mb-2">You're Invited</p>
          <h1 className="text-white text-4xl font-bold mb-2">{coupleName}</h1>
          <p className="text-white text-xl">{eventDateWords || eventDate}</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            {invitationImage ? (
              <img src={invitationImage} alt="Invitation" className="w-full h-40 object-cover rounded-lg shadow-lg" />
            ) : (
              <div className="w-full h-40 bg-slate-600 rounded-lg flex items-center justify-center" />
            )}
            
            {/* QR Code Section */}
            <div className="mt-4 text-center">
              <div className="bg-white/95 rounded-lg p-3 inline-block">
                {qrCode ? (
                  <img src={qrCode} alt="Check-in QR Code" className="w-20 h-20" />
                ) : (
                  <div className="w-20 h-20 bg-slate-200 rounded flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-slate-400" />
                  </div>
                )}
              </div>
              <p className="text-white text-xs mt-2 font-medium">Check-in QR Code</p>
            </div>
          </div>
          <div className="col-span-2">
            <div className="bg-black/20 rounded-lg p-6 backdrop-blur-sm">
              <div className="mb-6">
                <p className="text-white text-sm mb-2">CEREMONY</p>
                <p className="text-white font-semibold">{eventTimeInWords || eventTime}</p>
                <p className="text-white text-sm">{venue}</p>
              </div>
              <div className="mb-6">
                <p className="text-white text-sm mb-2">RECEPTION</p>
                <p className="text-white font-semibold">{receptionTimeInWords || receptionTime}</p>
                <p className="text-white text-sm">{reception}</p>
              </div>
              <div className="mb-6">
                <p className="text-white text-sm mb-2">THEME</p>
                <p className="text-teal-400 font-semibold">{theme}</p>
              </div>
              <div className="border-t border-white/20 pt-4">
                <p className="text-white text-sm mb-1">RSVP</p>
                <p className="text-teal-400 font-mono">{rsvpContact}</p>
                {rsvpContactSecondary && (
                  <p className="text-teal-400 font-mono text-sm mt-1">{rsvpContactSecondary}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-white text-sm opacity-75">Guest: {guestName}</p>
          {additionalInfo && <p className="text-white text-xs opacity-50 mt-2">{additionalInfo}</p>}
        </div>
      </div>
    </Card>
  );

  switch (template) {
    case 'template2':
      return renderTemplate2();
    case 'template3':
      return renderTemplate3();
    case 'template1':
    default:
      return renderTemplate1();
  }
};

export default InvitationCardTemplate; 