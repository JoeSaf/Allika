import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import Header from '@/components/Header';
import InvitationCardTemplate from '@/components/InvitationCardTemplate';

const InvitationCard = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [invitationData, setInvitationData] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetchInvitationData(token);
  }, [token]);

  const fetchInvitationData = async (token) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/rsvp/${token}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch invitation');
      setGuest(data.data.guest);
      setEvent(data.data.event);
      setInvitationData(data.data.invitationData || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#1e293b',
      });
      const link = document.createElement('a');
      link.download = `invitation-${guest?.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'guest'}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Header />
        <div className="text-white text-xl">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Header />
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!guest || !event) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Header />
        <div className="text-white text-xl">Invitation not found.</div>
      </div>
    );
  }

  // Determine template
    const template = invitationData?.selectedTemplate || invitationData?.selected_template || 'template1';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center pt-12">
      <Header />
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <div ref={cardRef}>
          <InvitationCardTemplate
            invitationData={invitationData}
            guest={guest}
            event={event}
            qrCode={guest.qr_code_data}
            template={template}
          />
        </div>
        <Button onClick={handleDownload} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white">Download Invitation</Button>
        <Button onClick={() => navigate('/')} className="mt-8 bg-slate-700 hover:bg-slate-600 text-white">Back to Home</Button>
      </div>
    </div>
  );
};

export default InvitationCard; 