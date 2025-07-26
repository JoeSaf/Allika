import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendInvites, addGuest, addGuestsBulk, getGuests, checkDuplicatePhones } from "@/services/api";
import ExcelJS from "exceljs";

// Updated regex to be more flexible but still require proper format
const phoneRegex = /^\+?\d{10,15}$/;

export default function SendInvitationModal({ open, onClose, eventId, template }) {
  const [tab, setTab] = useState("single");
  const [messageType, setMessageType] = useState<"sms" | "whatsapp" | "email">("whatsapp");
  const [sending, setSending] = useState(false);

  // Single guest
  const [singleName, setSingleName] = useState("");
  const [singlePhone, setSinglePhone] = useState("");
  const [singlePhoneError, setSinglePhoneError] = useState("");
  const [singleGuestCount, setSingleGuestCount] = useState(1);

  // Bulk upload
  const [bulkGuests, setBulkGuests] = useState<Array<{name: string; phone: string; email?: string}>>([]);
  const [fileError, setFileError] = useState("");
  const [bulkPhoneErrors, setBulkPhoneErrors] = useState<string[]>([]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    setFileError("");
    setBulkGuests([]);
    setBulkPhoneErrors([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result;
        if (!result || typeof result === "string") {
          setFileError("Error reading file. Please ensure it's a valid Excel file.");
          return;
        }

        const data = new Uint8Array(result);
        // Use exceljs to parse .xlsx files
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets[0];
        const rows: any[] = [];
        worksheet.eachRow((row) => {
          rows.push(row.values.slice(1)); // remove first undefined
        });
        // Now rows[0] is header, rows[1..] are data
        const guests = [];
        const errors = [];

        for (let i = 1; i < rows.length; i++) { // skip header
          const row = rows[i] as any[];
          const [name, phone, guestCountRaw] = row;
          let guestCount = 1;
          if (guestCountRaw !== undefined && !isNaN(Number(guestCountRaw)) && Number(guestCountRaw) > 0) {
            guestCount = Number(guestCountRaw);
          }
          if (name && phone) {
            const cleanPhone = phone.toString().replace(/[^0-9]/g, "");
            if (cleanPhone.length < 10) {
              errors.push(`Row ${i + 1}: Invalid phone number "${phone}" - too short`);
              continue;
            }
            let formattedPhone = cleanPhone;
            if (!cleanPhone.startsWith("255") && cleanPhone.length === 9) {
              formattedPhone = "255" + cleanPhone;
            } else if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
              formattedPhone = "255" + cleanPhone.substring(1);
            }
            guests.push({ name: name.toString().trim(), phone: ensurePhonePrefix(formattedPhone), guestCount });
          } else if (name || phone) {
            errors.push(`Row ${i + 1}: Missing ${!name ? "name" : "phone number"}`);
          }
        }

        if (errors.length > 0) {
          setFileError(`File contains errors:\n${errors.join("\n")}`);
          return;
        }

        const phoneErrors: string[] = [];
        const validGuests = guests.filter((g, idx) => {
          if (!phoneRegex.test(g.phone)) {
            phoneErrors.push(`Row ${idx + 2}: Invalid phone number "${g.phone}". Please use a valid phone number (10-15 digits).`);
            return false;
          }
          return true;
        });
        setBulkPhoneErrors(phoneErrors);
        setBulkGuests(validGuests);

        // Check for duplicates if we have guests and eventId
        if (validGuests.length > 0 && eventId) {
          const phoneNumbers = validGuests.map(g => g.phone).filter(Boolean);
          if (phoneNumbers.length > 0) {
            try {
              const duplicateCheck = await checkDuplicatePhones(eventId, phoneNumbers);
              if (duplicateCheck.success && duplicateCheck.data.hasDuplicates) {
                const duplicateList = duplicateCheck.data.duplicates.map(d =>
                  `${d.phone} (${d.existingGuest})`,
                ).join("\n");
                setFileError(`Duplicate phone numbers found:\n${duplicateList}\n\nPlease remove duplicates before uploading.`);
                setBulkGuests([]);
                return;
              }
            } catch (error) {
              console.error("Error checking duplicates:", error);
            }
          }
        }
      } catch (error) {
        setFileError("Error reading file. Please ensure it's a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSendSingle = async () => {
    if (!eventId || !singleName || !singlePhone) {
      return;
    }

    // Ensure phone number has + prefix before sending
    const formattedPhone = ensurePhonePrefix(singlePhone);

    setSending(true);
    try {
      // Check for duplicate phone number first
      const duplicateCheck = await checkDuplicatePhones(eventId, [formattedPhone]);
      if (duplicateCheck.success && duplicateCheck.data.hasDuplicates) {
        const duplicate = duplicateCheck.data.duplicates[0];
        alert(`Phone number ${duplicate.phone} is already registered for guest: ${duplicate.existingGuest}`);
        setSending(false);
        return;
      }

      // 1. Add guest
      const addRes = await addGuest(eventId, {
        name: singleName,
        phone: formattedPhone,
        guestCount: singleGuestCount,
      });

      if (!addRes.success) {
        throw new Error(addRes.message || "Failed to add guest");
      }

      // 2. Send invitation
      await sendInvites(eventId, {
        messageType,
        guestIds: [addRes.data.guest.id],
      });

    } catch (err) {
      console.error("Error in handleSendSingle:", err);
      alert(`Error: ${err.message || "Failed to send invitation"}`);
    }
    setSending(false);
    onClose();
  };

  // Send bulk
  const handleSendBulk = async () => {
    if (!eventId) {
      console.error("No event ID provided");
      return;
    }

    setSending(true);
    try {
      console.log("Adding guests in bulk:", bulkGuests);

      // 1. Add guests in bulk
      const addRes = await addGuestsBulk(eventId, bulkGuests);
      console.log("Add guests response:", addRes);

      if (!addRes.success || !addRes.data?.createdGuests) {
        throw new Error(addRes.message || "Failed to add guests");
      }

      const guestIds = addRes.data.createdGuests.map(g => g.id);
      console.log("Guest IDs to send to:", guestIds);

      if (guestIds.length === 0) {
        throw new Error("No guests were successfully added");
      }

      // 2. Send invites
      const sendRes = await sendInvites(eventId, {
        messageType,
        guestIds,
      });

      console.log("Send invites request data:", { eventId, messageType, guestIds });
      console.log("Send invites response:", sendRes);

    } catch (err) {
      console.error("Error in handleSendBulk:", err);
      // Show error to user
      alert(`Error: ${err.message || "Failed to process bulk upload"}`);
    }
    setSending(false);
    onClose();
  };

  const handleSinglePhoneChange = (e) => {
    const value = e.target.value;
    setSinglePhone(value);
    setSinglePhoneError(value && !phoneRegex.test(value) ? "Please enter a valid phone number (10-15 digits, with or without +)" : "");
  };

  // Function to ensure phone number has + prefix
  const ensurePhonePrefix = (phone) => {
    if (!phone) {
      return phone;
    }
    // Remove any existing + and add it back
    const cleanPhone = phone.replace(/^\+/, "");
    return `+${cleanPhone}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Invitations</DialogTitle>
          <DialogDescription>
            Add guests and send invitations via SMS or WhatsApp.
          </DialogDescription>
        </DialogHeader>
        {!eventId && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            No event selected. Please select an event first.
          </div>
        )}
        <div className="flex gap-4 mb-4">
          <Button onClick={() => setTab("single")} variant={tab === "single" ? "default" : "outline"}>Add Single</Button>
          <Button onClick={() => setTab("bulk")} variant={tab === "bulk" ? "default" : "outline"}>Bulk Upload</Button>
        </div>

        {tab === "single" && (
          <div className="space-y-4">
            {/* Message type selector */}
            <div className="flex gap-2 mb-2">
              <Button variant={messageType === "sms" ? "default" : "outline"} onClick={() => setMessageType("sms")}>SMS</Button>
              <Button variant={messageType === "whatsapp" ? "default" : "outline"} onClick={() => setMessageType("whatsapp")}>WhatsApp</Button>
            </div>
            <Input placeholder="Guest Name" value={singleName} onChange={e => setSingleName(e.target.value)} />
            <Input placeholder="Phone Number (e.g., 255123456789 or +255123456789)" value={singlePhone} onChange={handleSinglePhoneChange} />
            <div>
              <label className="block text-sm text-slate-400 mb-1">Number of Guests Allowed</label>
              <select
                className="w-full p-2 rounded-lg border text-sm bg-slate-700 text-white"
                value={singleGuestCount}
                onChange={e => setSingleGuestCount(Number(e.target.value))}
              >
                <option value={1}>Single</option>
                <option value={2}>Double</option>
                <option value={3}>Triple</option>
                <option value={4}>4 Guests</option>
                <option value={5}>5 Guests</option>
              </select>
            </div>
            {singlePhoneError && <div className="text-red-400 text-xs mt-1">{singlePhoneError}</div>}
            <Button onClick={handleSendSingle} disabled={sending || !singleName || !singlePhone || !eventId || singlePhoneError}>
              {sending ? "Sending..." : "Add Guest & Send Invitation"}
            </Button>
          </div>
        )}

        {tab === "bulk" && (
          <div className="space-y-4">
            {/* Message type selector */}
            <div className="flex gap-2 mb-2">
              <Button variant={messageType === "sms" ? "default" : "outline"} onClick={() => setMessageType("sms")}>SMS</Button>
              <Button variant={messageType === "whatsapp" ? "default" : "outline"} onClick={() => setMessageType("whatsapp")}>WhatsApp</Button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📋 Excel File Format Instructions:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Column A:</strong> Guest Names (e.g., "John Doe", "Jane Smith")</p>
                <p><strong>Column B:</strong> Phone Numbers (e.g., "255123456789", "+255123456789")</p>
                <p><strong>Column C:</strong> Number of Guests (e.g., 1, 2, 3)</p>
                <p><strong>Note:</strong> Phone numbers will automatically have "+" prefix added. Use 10-15 digits.</p>
              </div>
            </div>

            <Input type="file" accept=".xlsx,.csv" onChange={handleFile} />
            <div className="text-xs text-slate-400">Upload a .xlsx or .csv file with names in Column A, phone numbers in Column B, and guest counts in Column C.</div>
            {fileError && <div className="text-red-500">{fileError}</div>}
            {bulkPhoneErrors.length > 0 && (
              <div className="text-red-400 text-xs mt-1 whitespace-pre-line">{bulkPhoneErrors.join("\n")}</div>
            )}
            {bulkGuests.length > 0 && (
              <div>
                <div className="mb-2 text-sm text-slate-400">Preview ({bulkGuests.length} guests):</div>
                <div className="max-h-40 overflow-y-auto border rounded bg-slate-800 p-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left">Name</th>
                        <th className="text-left">Phone</th>
                        <th className="text-left">Guest Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkGuests.map((g, i) => (
                        <tr key={i}>
                          <td>{g.name}</td>
                          <td>{g.phone}</td>
                          <td>{g.guestCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button onClick={handleSendBulk} disabled={sending || bulkGuests.length === 0 || !eventId || bulkPhoneErrors.length > 0}>
                  {sending ? "Sending..." : "Add All Guests & Send Invitations"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
