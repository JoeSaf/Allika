import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvitationCardTemplate from "@/components/InvitationCardTemplate";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const Rsvp = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [rsvpSettings, setRsvpSettings] = useState(null);
  const [response, setResponse] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    fetchRsvpData(token);
  }, [token]);

  const fetchRsvpData = async (token) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rsvp/${token}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch RSVP info");
      }

      // Check if guest has already responded
      if (data.data.hasResponded && data.data.lastResponse) {
        const lastResponse = data.data.lastResponse;

        // If they accepted the invitation, redirect to invitation card
        if (lastResponse.response === "confirmed") {
          toast({
            title: "Welcome back! 🎉",
            description: "You've already accepted this invitation. Here's your invitation card!",
          });
          setTimeout(() => {
            navigate(`/invitation/${token}`);
          }, 1500);
          return;
        }

        // If they declined, show declined message
        if (lastResponse.response === "declined") {
          setDeclined(true);
          setLoading(false);
          return;
        }
      }

      setGuest(data.data.guest);
      setEvent(data.data.event);
      setRsvpSettings(data.data.rsvpSettings);
      setInvitationData(data.data.invitationData || {});
      setGuestCount(data.data.guest.guestCount || 1);
      setSpecialRequests(data.data.guest.specialRequests || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!response) {
      return;
    }
    setLoading(true);
    setError("");
    // Log the payload for debugging
    const payload = {
      response: response === "accept" ? "confirmed" : "declined",
      guestCount: Number(guestCount) > 0 ? Number(guestCount) : 1,
      specialRequests: specialRequests || "",
    };
    console.log("RSVP POST payload:", payload);
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Validation failed");
        return;
      }
      setSubmitted(true);
      if (response === "accept") {
        setTimeout(() => {
          navigate(`/invitation/${token}`);
        }, 1200);
      } else {
        setDeclined(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (cardRef.current && !downloading) {
      setDownloading(true);
      try {
        const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: "#1e293b" });
        const link = document.createElement("a");
        link.download = `invitation-${guest?.name?.replace(/[^a-zA-Z0-9]/g, "-") || "guest"}.png`;
        link.href = canvas.toDataURL();
        link.click();

        // Show success toast
        toast({
          title: "🎉 Invitation Downloaded!",
          description: "Your invitation is ready! We can't wait to celebrate with you! 🎊",
        });
      } catch (err) {
        console.error("Download failed:", err);
        toast({
          title: "Download Failed",
          description: "Sorry, there was an issue downloading your invitation. Please try again!",
          variant: "destructive",
        });
      } finally {
        setDownloading(false);
      }
    }
  };

  const handleDownloadPDF = async () => {
    // Download the invitation card as a PDF using jsPDF and html2canvas
    const card = document.createElement("div");
    card.style.width = "400px";
    card.style.padding = "32px";
    card.style.background = "#1e293b";
    card.style.color = "#fff";
    card.style.borderRadius = "16px";
    card.style.textAlign = "center";
    card.innerHTML = `
      <h2 style='font-size:24px;font-weight:bold;margin-bottom:8px;'>${event.title}</h2>
      <p style='margin-bottom:4px;'>${event.date} ${event.time ? `at ${event.time}` : ""}</p>
      <p style='margin-bottom:8px;'>${event.venue}</p>
      <p style='margin-bottom:8px;'>Dear ${guest.name},</p>
      <p style='margin-bottom:8px;'>You are cordially invited to our event!</p>
      <p style='margin-bottom:8px;'>Please present this card at the entrance.</p>
    `;
    document.body.appendChild(card);
    const canvas = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: "#1e293b" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [400, 500] });
    pdf.addImage(imgData, "PNG", 0, 0, 400, 300);
    pdf.save(`invitation-${guest?.name?.replace(/[^a-zA-Z0-9]/g, "-") || "guest"}.pdf`);
    document.body.removeChild(card);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading RSVP...</div>
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

  if (!guest || !event || !rsvpSettings) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">RSVP not found.</div>
      </div>
    );
  }

  if (submitted && response === "accept") {
    // Show download option (PNG only)
    const template = invitationData?.selectedTemplate || invitationData?.selected_template || "template1";
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Thank you for confirming!</h2>
          <p className="text-slate-300 mb-4">You can now download your invitation card:</p>
          <div className="flex flex-col gap-4 items-center">
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
              onClick={handleDownloadImage}
              disabled={downloading}
              className="bg-teal-600 hover:bg-teal-700 text-white w-48 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Image...
                </>
              ) : (
                "Download as Image"
              )}
            </Button>
            <Button onClick={() => navigate(`/invitation/${token}`)} className="bg-slate-700 hover:bg-slate-600 text-white w-48">Preview Card</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Thank you for your response!</h2>
          <p className="text-slate-300 mb-4">We're sorry you can't make it.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center flex-1">
        <Card className="bg-slate-800 border-slate-700 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">{rsvpSettings.title || event.title}</h2>
            <p className="text-slate-300 mb-1">{rsvpSettings.subtitle || event.date}</p>
            <p className="text-slate-400 mb-2">{rsvpSettings.location || event.venue}</p>
          </div>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 text-red-400 text-center text-sm">{error}</div>
            )}
            <div className="mb-6 text-center">
              <p className="text-white text-lg font-semibold mb-2">Dear {guest.name},</p>
              <p className="text-slate-200 mb-2">{rsvpSettings.welcomeMessage || "Will you be attending?"}</p>
            </div>
            <div className="mb-6 flex justify-center gap-4">
              <Button
                type="button"
                className={`px-6 py-2 ${response === "accept" ? "bg-green-600" : "bg-green-500"} text-white`}
                onClick={async () => {
                  setResponse("accept");
                  setLoading(true);
                  setError("");
                  try {
                    const payload = {
                      response: "confirmed",
                      guestCount: guest.guestCount || 1,
                      specialRequests: "",
                    };
                    const res = await fetch(`/api/rsvp/${token}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (!data.success) {
                      setError(data.message || "Validation failed");
                      setLoading(false);
                      return;
                    }
                    setSubmitted(true);
                    setTimeout(() => {
                      navigate(`/invitation/${token}`);
                    }, 1200);
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {rsvpSettings.confirmText || "Accept"}
              </Button>
              <Button
                type="button"
                className={`px-6 py-2 ${response === "decline" ? "bg-red-600" : "bg-red-500"} text-white`}
                onClick={async () => {
                  setResponse("decline");
                  setLoading(true);
                  setError("");
                  try {
                    const payload = {
                      response: "declined",
                      guestCount: guest.guestCount || 1,
                      specialRequests: "",
                    };
                    const res = await fetch(`/api/rsvp/${token}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (!data.success) {
                      setError(data.message || "Validation failed");
                      setLoading(false);
                      return;
                    }
                    setDeclined(true);
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {rsvpSettings.declineText || "Decline"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Rsvp;
