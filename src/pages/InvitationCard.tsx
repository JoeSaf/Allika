import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import InvitationCardTemplate from "@/components/InvitationCardTemplate";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const InvitationCard = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [invitationData, setInvitationData] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    fetchInvitationData(token);
  }, [token]);

  const fetchInvitationData = async (token) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rsvp/${token}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch invitation");
      }
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
    if (!token || downloading) {
      return;
    }

    setDownloading(true);
    try {
      // Use Puppeteer to screenshot the print route
      const response = await fetch(`/api/invitation/${token}/image?print=1`);
      if (!response.ok) {
        throw new Error("Failed to fetch invitation image");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invitation-${guest?.name?.replace(/[^a-zA-Z0-9]/g, "-") || "guest"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success toast
      toast({
        title: "🎉 Invitation Downloaded!",
        description: "Your invitation is ready! We can't wait to celebrate with you! 🎊",
      });
    } catch (err) {
      toast({
        title: "Download Failed",
        description: "Sorry, there was an issue downloading your invitation. Please try again!",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!guest || !event) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Invitation not found.</div>
      </div>
    );
  }

  const template = invitationData?.selectedTemplate || invitationData?.selected_template || "template1";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center flex-1">
        <div ref={cardRef}>
          <InvitationCardTemplate
            invitationData={invitationData}
            guest={guest}
            event={event}
            qrCode={guest.qr_code_data}
            template={template}
          />
        </div>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="mt-6 bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Image...
            </>
          ) : (
            "Download Invitation"
          )}
        </Button>
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm mb-3">Want to create your own beautiful invitations?</p>
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Create Your Event with Alika
          </Button>
          <p className="text-slate-500 text-xs mt-2">Professional invitations • RSVP management • QR check-ins </p>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default InvitationCard;
