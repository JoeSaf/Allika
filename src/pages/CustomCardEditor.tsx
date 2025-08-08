import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { User, QrCode, Users, Save, ArrowLeft, RotateCcw } from "lucide-react";
import { env } from "@/config/environment";

interface OverlayPositions {
  guestName: { x: number; y: number; width: number; height: number };
  qrCode: { x: number; y: number; size: number };
  guestCount: { x: number; y: number; width: number; height: number };
}

export const CustomCardEditor = () => {
  const { eventId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedElement, setSelectedElement] = useState<'guestName' | 'qrCode' | 'guestCount' | null>(null);
  const [positions, setPositions] = useState<OverlayPositions>({
    guestName: { x: 50, y: 50, width: 150, height: 25 },
    qrCode: { x: 300, y: 400, size: 64 },
    guestCount: { x: 50, y: 80, width: 100, height: 20 }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to get the correct image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a relative path starting with /uploads, prepend the API URL
    if (imagePath.startsWith('/uploads/')) {
      return `${env.apiUrl}${imagePath}`;
    }
    
    // Otherwise, assume it's relative to the API
    return `${env.apiUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  };

  // Function to test if image URL is accessible
  const testImageUrl = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Image URL test failed:', error);
      return false;
    }
  };

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const response = await apiService.getEvent(eventId!);
      if (response.success) {
        const event = response.data.event;
        setEvent(event);
        
        console.log("Loaded event:", event);
        console.log("Custom card image URL:", event.custom_card_image_url);
        const fullImageUrl = getImageUrl(event.custom_card_image_url);
        console.log("Full image URL:", fullImageUrl);
        
        // Test if the image URL is accessible
        const isImageAccessible = await testImageUrl(fullImageUrl);
        console.log("Image accessible:", isImageAccessible);
        
        if (!isImageAccessible) {
          toast({
            title: "Warning",
            description: "Custom card image may not be accessible. Please ensure the backend server is running.",
            variant: "destructive",
          });
        }
        
        // Check if this is a custom card event
        if (event.design_method !== 'custom') {
          toast({
            title: "Error",
            description: "This event is not a custom card event",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        
        // Handle custom card overlay data (might be stored as JSON string)
        if (event.custom_card_overlay_data) {
          let overlayData;
          if (typeof event.custom_card_overlay_data === 'string') {
            try {
              overlayData = JSON.parse(event.custom_card_overlay_data);
            } catch (e) {
              console.error("Error parsing custom card overlay data:", e);
            }
          } else {
            overlayData = event.custom_card_overlay_data;
          }
          
          if (overlayData) {
            setPositions(overlayData);
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load event",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error loading event:", error);
      toast({
        title: "Error",
        description: "Failed to load event",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, element: string, handle?: string) => {
    e.preventDefault();
    setSelectedElement(element as any);
    setIsDragging(true);
    setResizeHandle(handle || null);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (resizeHandle) {
      // Handle resizing
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      setPositions(prev => ({
        ...prev,
        [selectedElement]: {
          ...prev[selectedElement],
          width: Math.max(50, prev[selectedElement].width + deltaX),
          height: Math.max(20, prev[selectedElement].height + deltaY)
        }
      }));
    } else {
      // Handle dragging
      setPositions(prev => ({
        ...prev,
        [selectedElement]: {
          ...prev[selectedElement],
          x: Math.max(0, x - (prev[selectedElement].width / 2)),
          y: Math.max(0, y - (prev[selectedElement].height / 2))
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizeHandle(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiService.updateEvent(eventId!, {
        custom_card_overlay_data: positions
      });
      
      if (response.success) {
        toast({
          title: "✅ Positions Saved!",
          description: "Your custom card overlay positions have been saved successfully.",
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error saving positions:", error);
      toast({
        title: "Error",
        description: "Failed to save positions",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPositions = () => {
    setPositions({
      guestName: { x: 50, y: 50, width: 150, height: 25 },
      qrCode: { x: 300, y: 400, size: 64 },
      guestCount: { x: 50, y: 80, width: 100, height: 20 }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Event not found</div>
      </div>
    );
  }

  if (!event.custom_card_image_url) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">No custom card image found for this event</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-white">
                Custom Card Editor - {event.title}
              </h1>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetPositions}
                className="text-slate-300 border-slate-600"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const url = getImageUrl(event.custom_card_image_url);
                  console.log("Testing image URL:", url);
                  const isAccessible = await testImageUrl(url);
                  console.log("Image accessible:", isAccessible);
                  toast({
                    title: isAccessible ? "✅ Image Accessible" : "❌ Image Not Accessible",
                    description: isAccessible ? "Image URL is working correctly" : "Image URL is not accessible. Check if backend server is running.",
                    variant: isAccessible ? "default" : "destructive",
                  });
                }}
                className="text-slate-300 border-slate-600"
              >
                Test Image
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate to event editor for guest management and invitation sending
                  navigate(`/event/${eventId}`, { 
                    state: { 
                      fromCustomCard: true,
                      message: "Navigate to the 'Guests' tab to add guests and send invitations"
                    }
                  });
                }}
                className="text-slate-300 border-slate-600"
              >
                <User className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate to analytics page
                  navigate(`/analytics/${eventId}`, { 
                    state: { 
                      fromCustomCard: true,
                      message: "View event analytics and guest responses"
                    }
                  });
                }}
                className="text-slate-300 border-slate-600"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Manage Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Instructions */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Positioning Guide</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">
                    Click and drag the boxes to position them on your custom card. 
                    Use the resize handles to adjust the size.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded border border-blue-400"></div>
                    <span className="text-sm text-slate-300">Guest Name</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-purple-500 rounded border border-purple-400"></div>
                    <span className="text-sm text-slate-300">Guest Count</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded border border-green-400"></div>
                    <span className="text-sm text-slate-300">QR Code</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <h3 className="text-sm font-medium text-white mb-2">Tips:</h3>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• Drag boxes to move them</li>
                    <li>• Drag corners to resize</li>
                    <li>• Click outside to deselect</li>
                    <li>• Use Reset to start over</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Interactive Image */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Custom Card Preview</h2>
              
              <div 
                ref={containerRef}
                className="relative border-2 border-slate-600 rounded-lg overflow-hidden bg-slate-900 cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {imageLoading && (
                  <div className="flex items-center justify-center h-64 bg-slate-800 text-slate-400">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-2"></div>
                      <p>Loading custom card image...</p>
                    </div>
                  </div>
                )}
                <img 
                  ref={imageRef}
                  src={getImageUrl(event.custom_card_image_url)} 
                  alt="Custom Card" 
                  className={`w-full h-auto object-contain ${imageLoading ? 'hidden' : ''}`}
                  onLoad={() => {
                    console.log("Image loaded successfully:", getImageUrl(event.custom_card_image_url));
                    setImageLoading(false);
                  }}
                  onError={(e) => {
                    console.error("Image failed to load:", getImageUrl(event.custom_card_image_url), e);
                    setImageLoading(false);
                    
                    // Try alternative URL (frontend server)
                    const alternativeUrl = event.custom_card_image_url;
                    console.log("Trying alternative URL:", alternativeUrl);
                    
                    if (imageRef.current) {
                      imageRef.current.src = alternativeUrl;
                    }
                    
                    toast({
                      title: "Image Load Error",
                      description: "Failed to load custom card image from backend. Trying alternative source...",
                      variant: "destructive",
                    });
                  }}
                />
                
                {/* Guest Name Box */}
                <div 
                  className={`absolute bg-white/90 rounded px-2 py-1 text-sm font-semibold border-2 transition-all cursor-move ${
                    selectedElement === 'guestName' ? 'border-blue-500' : 'border-transparent'
                  }`}
                  style={{
                    left: positions.guestName.x,
                    top: positions.guestName.y,
                    width: positions.guestName.width,
                    height: positions.guestName.height
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'guestName')}
                >
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Guest Name
                  </div>
                  {/* Resize handles */}
                  <div 
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded cursor-se-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'guestName', 'resize')}
                  />
                </div>
                
                {/* Guest Count Box */}
                <div 
                  className={`absolute bg-white/90 rounded px-2 py-1 text-sm font-semibold border-2 transition-all cursor-move ${
                    selectedElement === 'guestCount' ? 'border-purple-500' : 'border-transparent'
                  }`}
                  style={{
                    left: positions.guestCount.x,
                    top: positions.guestCount.y,
                    width: positions.guestCount.width,
                    height: positions.guestCount.height
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'guestCount')}
                >
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Count: 2
                  </div>
                  {/* Resize handles */}
                  <div 
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded cursor-se-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'guestCount', 'resize')}
                  />
                </div>
                
                {/* QR Code Box */}
                <div 
                  className={`absolute bg-white/90 rounded-lg p-2 border-2 transition-all cursor-move ${
                    selectedElement === 'qrCode' ? 'border-green-500' : 'border-transparent'
                  }`}
                  style={{
                    left: positions.qrCode.x,
                    top: positions.qrCode.y,
                    width: positions.qrCode.size,
                    height: positions.qrCode.size
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'qrCode')}
                >
                  <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs">
                    <QrCode className="w-4 h-4 text-gray-600" />
                  </div>
                  {/* Resize handles */}
                  <div 
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded cursor-se-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'qrCode', 'resize')}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCardEditor; 