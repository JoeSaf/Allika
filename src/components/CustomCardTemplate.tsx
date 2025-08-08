import React from "react";
import { Card } from "@/components/ui/card";
import { User, QrCode } from "lucide-react";

interface OverlayPositions {
  guestName: { x: number; y: number; width: number; height: number };
  qrCode: { x: number; y: number; size: number };
}

interface CustomCardTemplateProps {
  customCardImage: string;
  guest: any;
  event: any;
  qrCode?: string;
  overlayPositions?: OverlayPositions;
  className?: string;
}

export const CustomCardTemplate: React.FC<CustomCardTemplateProps> = ({
  customCardImage,
  guest,
  event,
  qrCode,
  overlayPositions,
  className = ""
}) => {
  // Default positions if not provided
  const defaultPositions: OverlayPositions = {
    guestName: { x: 50, y: 50, width: 200, height: 30 },
    qrCode: { x: 300, y: 400, size: 64 }
  };

  const positions = overlayPositions || defaultPositions;
  const guestName = guest?.name || "Guest Name";

  return (
    <Card className={`card bg-slate-800 border-slate-700 p-8 max-w-lg w-full shadow-lg ${className}`}>
      <div className="relative w-full">
        {/* Original custom card image */}
        <img 
          src={customCardImage} 
          alt="Custom Invitation" 
          className="w-full h-auto rounded-lg"
        />
        
        {/* Guest name overlay */}
        {guestName && positions.guestName && (
          <div 
            className="absolute bg-white/95 rounded px-3 py-2 text-sm font-semibold shadow-lg border border-gray-200"
            style={{
              left: positions.guestName.x,
              top: positions.guestName.y,
              width: positions.guestName.width,
              height: positions.guestName.height,
              minWidth: 'fit-content'
            }}
          >
            <div className="flex items-center gap-2 text-gray-800">
              <User className="w-3 h-3 text-blue-500" />
              <span>Guest: {guestName}</span>
            </div>
          </div>
        )}
        
        {/* QR code overlay */}
        {qrCode && positions.qrCode && (
          <div 
            className="absolute bg-white/95 rounded-lg p-2 shadow-lg border border-gray-200"
            style={{
              left: positions.qrCode.x,
              top: positions.qrCode.y,
              width: positions.qrCode.size,
              height: positions.qrCode.size
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={qrCode} 
                alt="QR Code" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-1 text-xs text-gray-600 bg-white/90 px-2 py-1 rounded">
                <QrCode className="w-3 h-3" />
                <span>Check-in</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}; 