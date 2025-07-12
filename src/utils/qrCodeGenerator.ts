
import QRCode from 'qrcode';
import { Guest, Event } from './storage';

export interface QRCodeData {
  guestName: string;
  phoneNumber: string;
  eventName: string;
  eventId: string;
  guestId: string;
  eventDate: string;
  venue: string;
}

export const generateQRCodeData = (guest: Guest, event: Event): QRCodeData => {
  return {
    guestName: guest.name,
    phoneNumber: guest.phone || '',
    eventName: event.title,
    eventId: event.id,
    guestId: guest.id,
    eventDate: event.date,
    venue: event.venue
  };
};

export const generateQRCodeString = async (qrData: QRCodeData): Promise<string> => {
  const dataString = JSON.stringify(qrData);
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(dataString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const parseQRCodeData = (qrString: string): QRCodeData | null => {
  try {
    const parsed = JSON.parse(qrString);
    
    // Validate the parsed data has required fields
    if (parsed.guestName && parsed.eventName && parsed.guestId && parsed.eventId) {
      return parsed as QRCodeData;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
};

export const generateBulkQRCodes = async (guests: Guest[], event: Event): Promise<Array<{guest: Guest, qrCode: string}>> => {
  const qrCodes = [];
  
  for (const guest of guests) {
    try {
      const qrData = generateQRCodeData(guest, event);
      const qrCodeString = await generateQRCodeString(qrData);
      qrCodes.push({ guest, qrCode: qrCodeString });
    } catch (error) {
      console.error(`Failed to generate QR code for guest ${guest.name}:`, error);
    }
  }
  
  return qrCodes;
};
