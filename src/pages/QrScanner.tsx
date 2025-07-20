
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, Users, CheckCircle, X, Search, AlertCircle, CameraOff, Scan, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { checkInGuestQr, getEvent, getGuests } from '@/services/api';
import { isUserLoggedIn } from '@/utils/auth';
import jsQR from 'jsqr';

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  checked_in?: boolean;
  check_in_time?: string;
  rsvp_status?: string;
  guest_count?: number;
  table_number?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  user_id: string;
  description?: string;
  theme?: string;
}

const QrScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedInGuests, setCheckedInGuests] = useState<Guest[]>([]);
  const [pendingGuests, setPendingGuests] = useState<Guest[]>([]);
  const [cameraError, setCameraError] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [scanResult, setScanResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  const { toast } = useToast();

  useEffect(() => {
    if (!eventId) {
      navigate('/dashboard');
      return;
    }
    
    // Check if user is logged in
    if (!isUserLoggedIn()) {
      navigate('/login');
      return;
    }
    
    loadEventData();
    
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [eventId, navigate]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      
      // Get event data
      const eventRes = await getEvent(eventId!);
      if (!eventRes.success) {
        setAccessDenied(true);
        return;
      }
      
      const event = eventRes.data.event;
      setCurrentEvent(event);
      
      // Get current user info to check ownership
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (event.user_id !== currentUser.id) {
        setAccessDenied(true);
        return;
      }
      
      // Get guests data
      const guestsRes = await getGuests(eventId!);
      if (guestsRes.success) {
        const guests = guestsRes.data.guests;
        const checkedIn = guests.filter((guest: Guest) => guest.checked_in);
        const pending = guests.filter((guest: Guest) => !guest.checked_in);
        
        setCheckedInGuests(checkedIn);
        setPendingGuests(pending);
      }
      
    } catch (error) {
      console.error('Error loading event data:', error);
      toast({
        title: "Error",
        description: "Failed to load event data.",
        variant: "destructive"
      });
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setHasPermission(true);
      setCameraError('');
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      return true;
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraError('Camera access denied. Please allow camera access to scan QR codes.');
      setHasPermission(false);
      return false;
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      // QR code found!
      setScanResult(code.data);
      handleQRCodeScanned(code.data);
      return;
    }

    // Continue scanning
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  const handleQRCodeScanned = async (qrData: string) => {
    setIsProcessing(true);
    setIsScanning(false);
    
    try {
      // Parse QR code data
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (error) {
        toast({
          title: "Invalid QR Code",
          description: "The scanned QR code is not valid for this event.",
          variant: "destructive"
        });
        return;
      }

      // Check if it's a valid guest QR code
      if (!parsedData.type || parsedData.type !== 'guest_checkin') {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not a valid guest check-in code.",
          variant: "destructive"
        });
        return;
      }

      // Verify the QR code is for this event
      if (parsedData.eventId !== eventId) {
        toast({
          title: "Wrong Event",
          description: "This QR code is for a different event.",
          variant: "destructive"
        });
        return;
      }

      // Send check-in request to backend
      const response = await checkInGuestQr(qrData);
      
      if (response.success) {
        toast({
          title: "Guest Checked In!",
          description: `${response.data.guest.name} has been successfully checked in.`,
        });
        
        // Refresh guest data
        await loadEventData();
      } else {
        toast({
          title: "Check-in Failed",
          description: response.message || "Failed to check in guest.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast({
        title: "Error",
        description: "Failed to process QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setScanResult('');
    }
  };

  const startScanning = async () => {
    if (!currentEvent) {
      toast({
        title: "No Event Selected",
        description: "Please select an event first.",
        variant: "destructive"
      });
      return;
    }

    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) return;
    }
    
    setIsScanning(true);
    setScanResult('');
    
    // Start scanning loop
    if (videoRef.current && videoRef.current.readyState >= 2) {
      scanQRCode();
    } else {
      // Wait for video to be ready
      videoRef.current?.addEventListener('loadeddata', () => {
        scanQRCode();
      });
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasPermission(false);
    setScanResult('');
  };

  const handleManualCheckIn = async (guestId: string) => {
    if (!currentEvent) return;
    
    setIsProcessing(true);
    try {
      // In a real app, you'd call the API to check in the guest
      const guest = pendingGuests.find(g => g.id === guestId);
      if (guest) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        const updatedPending = pendingGuests.filter(g => g.id !== guestId);
        const updatedCheckedIn = [...checkedInGuests, { ...guest, checked_in: true, check_in_time: new Date().toLocaleTimeString() }];
        
        setPendingGuests(updatedPending);
        setCheckedInGuests(updatedCheckedIn);
        
      toast({
          title: "Guest Checked In",
          description: `${guest.name} has been checked in successfully!`,
      });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in guest.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPendingGuests = pendingGuests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (guest.email && guest.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h3>
              <p className="text-slate-400 mb-4">You don't have permission to access this event's QR scanner.</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-slate-700 hover:bg-slate-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">Event Not Found</h3>
              <p className="text-slate-500">The requested event could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                onClick={() => navigate(`/analytics/${eventId}`)} 
                variant="outline" 
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Analytics
              </Button>
          <h1 className="text-4xl font-bold text-white mb-2">QR Scanner & Check-in</h1>
          <p className="text-slate-300">Event: {currentEvent.title}</p>
              <p className="text-slate-400">{currentEvent.date} • {currentEvent.venue}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {checkedInGuests.length + pendingGuests.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Checked In</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {checkedInGuests.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Pending</CardTitle>
              <QrCode className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">
                {pendingGuests.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Scanner Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
                <Scan className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
            <CardContent>
              <div className="relative">
                {!isScanning && !hasPermission && (
                  <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">Click start to begin scanning QR codes</p>
                      <Button onClick={startScanning} disabled={isProcessing}>
                        <Camera className="w-4 h-4 mr-2" />
                        Start Scanner
                      </Button>
                    </div>
                  </div>
                )}

            {cameraError && (
                  <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <CameraOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <p className="text-red-400 mb-4">{cameraError}</p>
                      <Button onClick={startScanning} variant="outline">
                        Try Again
                      </Button>
                </div>
              </div>
            )}
            
                {isScanning && (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full aspect-video rounded-lg"
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-teal-400 w-64 h-64 rounded-lg relative">
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-teal-400"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-teal-400"></div>
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-teal-400"></div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-teal-400"></div>
                      </div>
                    </div>
                <Button 
                  onClick={stopScanning}
                      className="absolute top-4 right-4"
                      variant="destructive"
                    >
                      <X className="w-4 h-4" />
                </Button>
              </div>
            )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-2"></div>
                      <p className="text-white">Processing...</p>
                    </div>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Guest List */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Guest Management</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPendingGuests.map((guest) => (
                    <div key={guest.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                      <p className="text-white font-medium">{guest.name}</p>
                      {guest.email && <p className="text-slate-400 text-sm">{guest.email}</p>}
                      </div>
                        <Button 
                      onClick={() => handleManualCheckIn(guest.id)}
                      disabled={isProcessing}
                          size="sm" 
                        >
                      Check In
                        </Button>
                    </div>
                  ))}
                {filteredPendingGuests.length === 0 && (
                  <p className="text-slate-400 text-center py-4">No pending guests found</p>
                )}
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Checked In Guests */}
        {checkedInGuests.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Checked In Guests ({checkedInGuests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checkedInGuests.map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{guest.name}</p>
                      {guest.check_in_time && (
                        <p className="text-green-400 text-sm">Checked in at {guest.check_in_time}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      Checked In
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QrScanner;
