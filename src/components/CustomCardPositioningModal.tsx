import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Move, QrCode, User, RotateCcw } from "lucide-react";

interface OverlayPositions {
  guestName: { x: number; y: number; width: number; height: number };
  qrCode: { x: number; y: number; size: number };
  guestCount: { x: number; y: number; width: number; height: number };
}

interface CustomCardPositioningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customCardImage: string;
  onPositionsSet: (positions: OverlayPositions) => void;
}

export const CustomCardPositioningModal: React.FC<CustomCardPositioningModalProps> = ({
  open,
  onOpenChange,
  customCardImage,
  onPositionsSet
}) => {
  const [selectedElement, setSelectedElement] = useState<'guestName' | 'qrCode' | 'guestCount' | null>(null);
  const [positions, setPositions] = useState<OverlayPositions>({
    guestName: { x: 50, y: 50, width: 150, height: 25 },
    qrCode: { x: 300, y: 400, size: 64 },
    guestCount: { x: 50, y: 80, width: 100, height: 20 }
  });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
    }
  }, [customCardImage]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedElement) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPositions(prev => ({
      ...prev,
      [selectedElement]: {
        ...prev[selectedElement],
        x: Math.round(x),
        y: Math.round(y)
      }
    }));
  };

  const handlePositionChange = (element: 'guestName' | 'qrCode', field: string, value: number) => {
    setPositions(prev => ({
      ...prev,
      [element]: {
        ...prev[element],
        [field]: value
      }
    }));
  };

  const resetPositions = () => {
    setPositions({
      guestName: { x: 50, y: 50, width: 150, height: 25 },
      qrCode: { x: 300, y: 400, size: 64 },
      guestCount: { x: 50, y: 80, width: 100, height: 20 }
    });
  };

  const handleSave = () => {
    onPositionsSet(positions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Position Guest Information</DialogTitle>
          <DialogDescription className="text-slate-300">
            Click on the image to position the guest name and QR code. You can also use the controls below for precise positioning.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Position Selection Controls */}
          <div className="flex gap-3 flex-wrap">
            <Button 
              variant={selectedElement === 'guestName' ? 'default' : 'outline'}
              onClick={() => setSelectedElement('guestName')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Guest Name
            </Button>
            <Button 
              variant={selectedElement === 'guestCount' ? 'default' : 'outline'}
              onClick={() => setSelectedElement('guestCount')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Guest Count
            </Button>
            <Button 
              variant={selectedElement === 'qrCode' ? 'default' : 'outline'}
              onClick={() => setSelectedElement('qrCode')}
              className="flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </Button>
            <Button 
              variant="outline"
              onClick={resetPositions}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
          
          {/* Interactive Image Container */}
          <div className="relative border-2 border-slate-600 rounded-lg overflow-hidden bg-slate-900">
            <div 
              className="relative cursor-crosshair"
              onClick={handleImageClick}
            >
              {customCardImage ? (
                <img 
                  ref={imageRef}
                  src={customCardImage} 
                  alt="Custom Card" 
                  className="w-full h-auto max-h-[500px] object-contain"
                  onError={(e) => {
                    console.error('Failed to load image:', customCardImage);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', customCardImage);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                      <User className="w-8 h-8" />
                    </div>
                    <p>No image available</p>
                    <p className="text-sm text-slate-500">Image URL: {customCardImage || 'undefined'}</p>
                  </div>
                </div>
              )}
              
              {/* Guest Name Preview */}
              <div 
                className={`absolute bg-white/90 rounded px-2 py-1 text-sm font-semibold border-2 transition-all ${
                  selectedElement === 'guestName' ? 'border-blue-500' : 'border-transparent'
                }`}
                style={{
                  left: positions.guestName.x,
                  top: positions.guestName.y,
                  width: positions.guestName.width,
                  height: positions.guestName.height
                }}
              >
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Guest Name Preview
                </div>
              </div>
              
              {/* Guest Count Preview */}
              <div 
                className={`absolute bg-white/90 rounded px-2 py-1 text-sm font-semibold border-2 transition-all ${
                  selectedElement === 'guestCount' ? 'border-purple-500' : 'border-transparent'
                }`}
                style={{
                  left: positions.guestCount.x,
                  top: positions.guestCount.y,
                  width: positions.guestCount.width,
                  height: positions.guestCount.height
                }}
              >
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Count: 2
                </div>
              </div>
              
              {/* QR Code Preview */}
              <div 
                className={`absolute bg-white/90 rounded-lg p-2 border-2 transition-all ${
                  selectedElement === 'qrCode' ? 'border-green-500' : 'border-transparent'
                }`}
                style={{
                  left: positions.qrCode.x,
                  top: positions.qrCode.y,
                  width: positions.qrCode.size,
                  height: positions.qrCode.size
                }}
              >
                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs">
                  <QrCode className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Simple Instructions */}
          <div className="text-center space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-300 text-sm mb-3">
                Click on the image to position the elements. The system will automatically size them appropriately.
              </p>
              <div className="flex justify-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded border border-blue-400"></div>
                  <span>Guest Name</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded border border-purple-400"></div>
                  <span>Guest Count</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded border border-green-400"></div>
                  <span>QR Code</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
              Save Positions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 