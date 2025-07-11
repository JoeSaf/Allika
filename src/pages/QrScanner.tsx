
import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, Users, CheckCircle, X, Search, AlertCircle, CameraOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const QrScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedInGuests, setCheckedInGuests] = useState([]);
  const [pendingGuests, setPendingGuests] = useState([]);
  const [cameraError, setCameraError] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load guests from localStorage
    const savedGuests = JSON.parse(localStorage.getItem('guests') || '[]');
    const checkedIn = savedGuests.filter(guest => guest.checkedIn);
    const pending = savedGuests.filter(guest => !guest.checkedIn);
    
    setCheckedInGuests(checkedIn);
    setPendingGuests(pending.length > 0 ? pending : [
      { id: 1, name: "Emma Davis", email: "emma@email.com", table: "Table 2" },
      { id: 2, name: "Tom Brown", email: "tom@email.com", table: "Table 8" },
      { id: 3, name: "Lisa Anderson", email: "lisa@email.com", table: "Table 1" },
      { id: 4, name: "David Miller", email: "david@email.com", table: "Table 4" },
    ]);

    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      setHasPermission(true);
      setCameraError('');
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      return true;
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraError('Camera access denied. Please allow camera access to scan QR codes.');
      setHasPermission(false);
      return false;
    }
  };

  const startScanning = async () => {
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) return;
    }
    
    setIsScanning(true);
    
    // In a real implementation, you would use a QR code scanning library here
    // For demo purposes, we'll simulate scanning after 3 seconds
    setTimeout(() => {
      simulateQRScan();
    }, 3000);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasPermission(false);
  };

  const simulateQRScan = () => {
    // Simulate finding a guest from QR code
    if (pendingGuests.length > 0) {
      const randomGuest = pendingGuests[Math.floor(Math.random() * pendingGuests.length)];
      checkInGuest(randomGuest.id);
      
      toast({
        title: "Guest Checked In!",
        description: `${randomGuest.name} has been successfully checked in.`,
      });
    } else {
      toast({
        title: "No Pending Guests",
        description: "All guests have already been checked in.",
        variant: "destructive"
      });
    }
    
    setIsScanning(false);
    stopScanning();
  };

  const checkInGuest = (guestId: number) => {
    const guest = pendingGuests.find(g => g.id === guestId);
    if (!guest) return;

    const updatedGuest = {
      ...guest,
      checkedIn: true,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newCheckedInGuests = [...checkedInGuests, updatedGuest];
    const newPendingGuests = pendingGuests.filter(g => g.id !== guestId);

    setCheckedInGuests(newCheckedInGuests);
    setPendingGuests(newPendingGuests);

    // Save to localStorage
    const allGuests = [...newCheckedInGuests, ...newPendingGuests];
    localStorage.setItem('guests', JSON.stringify(allGuests));

    toast({
      title: "Guest Checked In",
      description: `${guest.name} has been checked in successfully!`,
    });
  };

  const filteredPendingGuests = pendingGuests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">QR Scanner & Check-in</h1>
          <p className="text-slate-300">Scan QR codes or manually check in guests</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-teal-400" />
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
              <div className="text-2xl font-bold text-white">{checkedInGuests.length}</div>
              <p className="text-xs text-slate-400">
                {checkedInGuests.length + pendingGuests.length > 0 
                  ? Math.round((checkedInGuests.length / (checkedInGuests.length + pendingGuests.length)) * 100)
                  : 0}% attendance
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Pending</CardTitle>
              <Users className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingGuests.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* QR Scanner Section */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {cameraError && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Camera Error</span>
                </div>
                <p className="text-red-300 text-sm">{cameraError}</p>
              </div>
            )}
            
            {isScanning ? (
              <div className="py-8">
                <div className="w-64 h-64 mx-auto bg-slate-700 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                  {hasPermission ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <CameraOff className="w-16 h-16 text-slate-400 mb-2" />
                      <p className="text-slate-400 text-sm">No camera access</p>
                    </div>
                  )}
                </div>
                <p className="text-slate-300 mb-4">
                  {hasPermission ? 'Point camera at QR code to scan...' : 'Requesting camera permission...'}
                </p>
                <Button 
                  onClick={stopScanning}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop Scanning
                </Button>
              </div>
            ) : (
              <div className="py-8">
                <QrCode className="w-16 h-16 mx-auto text-teal-400 mb-4" />
                <p className="text-slate-300 mb-4">
                  Click the button below to start scanning QR codes from guest invitations
                </p>
                <Button 
                  onClick={startScanning}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera Scanner
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checked In Guests */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Checked In Guests ({checkedInGuests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkedInGuests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No guests checked in yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkedInGuests.map((guest) => (
                    <div key={guest.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{guest.name}</p>
                        <p className="text-sm text-slate-300">{guest.email}</p>
                        <p className="text-xs text-slate-400">{guest.table}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-600 mb-1">
                          Checked In
                        </Badge>
                        <p className="text-xs text-slate-400">{guest.checkInTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Guests */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-400" />
                Pending Guests ({pendingGuests.length})
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredPendingGuests.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {searchQuery ? 'No guests found matching your search' : 'All guests have been checked in!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPendingGuests.map((guest) => (
                    <div key={guest.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{guest.name}</p>
                        <p className="text-sm text-slate-300">{guest.email}</p>
                        <p className="text-xs text-slate-400">{guest.table}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => checkInGuest(guest.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
