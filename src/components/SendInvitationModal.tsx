import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import { sendInvites, addGuest, addGuestsBulk, getGuests, checkDuplicatePhones } from "@/services/api";

const phoneRegex = /^\+\d{1,3}\d{9}$/;

export default function SendInvitationModal({ open, onClose, eventId, template }) {
  const [tab, setTab] = useState("single");
  const [messageType, setMessageType] = useState<"sms" | "whatsapp" | "email">("whatsapp");
  const [sending, setSending] = useState(false);
  
  // Single guest
  const [singleName, setSingleName] = useState("");
  const [singlePhone, setSinglePhone] = useState("");
  const [singlePhoneError, setSinglePhoneError] = useState('');
  
  // Bulk upload
  const [bulkGuests, setBulkGuests] = useState<Array<{name: string; phone: string; email?: string}>>([]);
  const [fileError, setFileError] = useState("");
  const [bulkPhoneErrors, setBulkPhoneErrors] = useState<string[]>([]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError("");
    setBulkGuests([]);
    setBulkPhoneErrors([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result;
        if (!result || typeof result === 'string') {
          setFileError("Error reading file. Please ensure it's a valid Excel file.");
          return;
        }
        
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const guests = [];
        const errors = [];
        
        // Skip header row, process from row 1
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as any[];
          const [name, phone] = row;
          if (name && phone) {
            const cleanPhone = phone.toString().replace(/[^0-9]/g, '');
            if (cleanPhone.length < 10) {
              errors.push(`Row ${i + 1}: Invalid phone number "${phone}" - too short`);
              continue;
            }
            let formattedPhone = cleanPhone;
            if (!cleanPhone.startsWith('255') && cleanPhone.length === 9) {
              formattedPhone = '255' + cleanPhone;
            } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
              formattedPhone = '255' + cleanPhone.substring(1);
            }
            guests.push({ name: name.toString().trim(), phone: formattedPhone.startsWith('+') ? formattedPhone : '+' + formattedPhone });
          } else if (name || phone) {
            errors.push(`Row ${i + 1}: Missing ${!name ? 'name' : 'phone number'}`);
          }
        }
        
        if (errors.length > 0) {
          setFileError(`File contains errors:\n${errors.join('\n')}`);
          return;
        }
        
        const phoneErrors: string[] = [];
        const validGuests = guests.filter((g, idx) => {
          if (!phoneRegex.test(g.phone)) {
            phoneErrors.push(`Row ${idx + 2}: Invalid phone number "${g.phone}". Use +countrycode and 9 digits.`);
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
                  `${d.phone} (${d.existingGuest})`
                ).join('\n');
                setFileError(`Duplicate phone numbers found:\n${duplicateList}\n\nPlease remove duplicates before uploading.`);
                setBulkGuests([]);
                return;
              }
            } catch (error) {
              console.error('Error checking duplicates:', error);
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
    if (!eventId || !singleName || !singlePhone) return;
    
    setSending(true);
    try {
      // Check for duplicate phone number first
      const duplicateCheck = await checkDuplicatePhones(eventId, [singlePhone]);
      if (duplicateCheck.success && duplicateCheck.data.hasDuplicates) {
        const duplicate = duplicateCheck.data.duplicates[0];
        alert(`Phone number ${duplicate.phone} is already registered for guest: ${duplicate.existingGuest}`);
        setSending(false);
        return;
      }
      
      // 1. Add guest
      const addRes = await addGuest(eventId, {
        name: singleName,
        phone: singlePhone
      });
      
      if (!addRes.success) {
        throw new Error(addRes.message || 'Failed to add guest');
      }
      
      // 2. Send invitation
      await sendInvites(eventId, {
        messageType,
        guestIds: [addRes.data.guest.id]
      });
      
    } catch (err) {
      console.error('Error in handleSendSingle:', err);
      alert(`Error: ${err.message || 'Failed to send invitation'}`);
    }
    setSending(false);
    onClose();
  };

  // Send bulk
  const handleSendBulk = async () => {
    if (!eventId) {
      console.error('No event ID provided');
      return;
    }
    
    setSending(true);
    try {
      console.log('Adding guests in bulk:', bulkGuests);
      
      // 1. Add guests in bulk
      const addRes = await addGuestsBulk(eventId, bulkGuests);
      console.log('Add guests response:', addRes);
      
      if (!addRes.success || !addRes.data?.createdGuests) {
        throw new Error(addRes.message || 'Failed to add guests');
      }
      
      const guestIds = addRes.data.createdGuests.map(g => g.id);
      console.log('Guest IDs to send to:', guestIds);
      
      if (guestIds.length === 0) {
        throw new Error('No guests were successfully added');
      }
      
      // 2. Send invites
      const sendRes = await sendInvites(eventId, {
        messageType,
        guestIds
      });
      
      console.log('Send invites request data:', { eventId, messageType, guestIds });
      console.log('Send invites response:', sendRes);
      
    } catch (err) {
      console.error('Error in handleSendBulk:', err);
      // Show error to user
      alert(`Error: ${err.message || 'Failed to process bulk upload'}`);
    }
    setSending(false);
    onClose();
  };

  const handleSinglePhoneChange = (e) => {
    const value = e.target.value;
    setSinglePhone(value);
    setSinglePhoneError(value && !phoneRegex.test(value) ? 'Invalid phone. Use +countrycode and 9 digits.' : '');
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
            <Input placeholder="Phone Number" value={singlePhone} onChange={handleSinglePhoneChange} />
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
                <p><strong>Column B:</strong> Phone Numbers (e.g., "255123456789", "255987654321")</p>
                <p><strong>Note:</strong> Phone numbers should be in international format without dashes or spaces</p>
              </div>
            </div>
            
            <Input type="file" accept=".xlsx,.csv" onChange={handleFile} />
            <div className="text-xs text-slate-400">Upload a .xlsx or .csv file with names in Column A and phone numbers in Column B.</div>
            {fileError && <div className="text-red-500">{fileError}</div>}
            {bulkPhoneErrors.length > 0 && (
              <div className="text-red-400 text-xs mt-1 whitespace-pre-line">{bulkPhoneErrors.join('\n')}</div>
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