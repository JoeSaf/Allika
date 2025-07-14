import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import { sendInvites } from "@/services/api";

export default function SendInvitationModal({ open, onClose, eventId, template }) {
  const [tab, setTab] = useState("single");
  // Single send state
  const [singleName, setSingleName] = useState("");
  const [singlePhone, setSinglePhone] = useState("");
  // Bulk send state
  const [bulkGuests, setBulkGuests] = useState([]);
  const [fileError, setFileError] = useState("");
  const [sending, setSending] = useState(false);

  // Handle file upload and parse
  const handleFile = (e) => {
    setFileError("");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      // Expect header: Name, Phone
      const guests = [];
      for (let i = 1; i < rows.length; i++) {
        const [name, phone] = rows[i];
        if (name && phone) guests.push({ name, phone });
      }
      if (guests.length === 0) setFileError("No valid guests found in file.");
      setBulkGuests(guests);
    };
    reader.readAsArrayBuffer(file);
  };

  // Send single
  const handleSendSingle = async () => {
    setSending(true);
    await sendInvites(eventId, {
      messageType: "sms",
      guestIds: [],
      customMessage: `Hi ${singleName}, you are invited!`,
      singleGuest: { name: singleName, phone: singlePhone }
    });
    setSending(false);
    onClose();
  };

  // Send bulk
  const handleSendBulk = async () => {
    setSending(true);
    await sendInvites(eventId, {
      messageType: "sms",
      guestIds: [],
      customMessage: "You are invited!",
      bulkGuests
    });
    setSending(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invitations</DialogTitle>
          <DialogDescription>
            Send invitations to a single guest or upload a file for bulk sending.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 mb-4">
          <Button onClick={() => setTab("single")} variant={tab === "single" ? "default" : "outline"}>Single Send</Button>
          <Button onClick={() => setTab("bulk")} variant={tab === "bulk" ? "default" : "outline"}>Bulk Send</Button>
        </div>
        {tab === "single" && (
          <div className="space-y-4">
            <Input placeholder="Guest Name" value={singleName} onChange={e => setSingleName(e.target.value)} />
            <Input placeholder="Phone Number" value={singlePhone} onChange={e => setSinglePhone(e.target.value)} />
            <Button onClick={handleSendSingle} disabled={sending || !singleName || !singlePhone}>
              {sending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        )}
        {tab === "bulk" && (
          <div className="space-y-4">
            <Input type="file" accept=".xlsx,.csv" onChange={handleFile} />
            {fileError && <div className="text-red-500">{fileError}</div>}
            {bulkGuests.length > 0 && (
              <div>
                <div className="mb-2 text-sm text-slate-400">Preview ({bulkGuests.length} guests):</div>
                <div className="max-h-40 overflow-y-auto border rounded bg-slate-800 p-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left">Name</th>
                        <th className="text-left">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkGuests.map((g, i) => (
                        <tr key={i}>
                          <td>{g.name}</td>
                          <td>{g.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button onClick={handleSendBulk} disabled={sending || bulkGuests.length === 0}>
                  {sending ? "Sending..." : "Send All Invitations"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 