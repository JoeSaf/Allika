import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InvitationCardTemplate from "@/components/InvitationCardTemplate";

const PrintInvitationCard = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [invitationData, setInvitationData] = useState(null);

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

  if (loading) {
    return null;
  }
  if (error || !guest || !event) {
    return null;
  }

  const template = invitationData?.selectedTemplate || invitationData?.selected_template || "template1";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        margin: 0,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div data-invitation-card="true">
        <InvitationCardTemplate
          invitationData={invitationData}
          guest={guest}
          event={event}
          qrCode={guest.qr_code_data}
          template={template}
        />
      </div>
    </div>
  );
};

export default PrintInvitationCard;
