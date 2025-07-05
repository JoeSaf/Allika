
import { useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, Users, CheckCircle, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const QrScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [checkedInGuests] = useState([
    { id: 1, name: "John Smith", email: "john@email.com", checkInTime: "2:30 PM", table: "Table 5" },
    { id: 2, name: "Sarah Johnson", email: "sarah@email.com", checkInTime: "2:15 PM", table: "Table 3" },
    { id: 3, name: "Mike Wilson", email: "mike@email.com", checkInTime: "2:45 PM", table: "Table 7" },
  ]);

  const [pendingGuests] = useState([
    { id: 4, name: "Emma Davis", email: "emma@email.com", table: "Table 2" },
    { id: 5, name: "Tom Brown", email: "tom@email.com", table: "Table 8" },
    { id: 6, name: "Lisa Anderson", email: "lisa@email.com", table: "Table 1" },
    { id: 7, name: "David Miller", email: "david@email.com", table: "Table 4" },
  ]);

  const handleStartScanning = () => {
    setIsScanning(true);
    // In a real app, this would start the camera and QR scanning
    setTimeout(() => {
      setIsScanning(false);
      // Simulate successful scan
      alert("Guest checked in successfully!");
    }, 3000);
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
                {Math.round((checkedInGuests.length / (checkedInGuests.length + pendingGuests.length)) * 100)}% attendance
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
            {isScanning ? (
              <div className="py-8">
                <div className="w-64 h-64 mx-auto bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-16 h-16 text-slate-400 animate-pulse" />
                </div>
                <p className="text-slate-300 mb-4">Scanning for QR code...</p>
                <Button 
                  onClick={() => setIsScanning(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  Cancel Scan
                </Button>
              </div>
            ) : (
              <div className="py-8">
                <QrCode className="w-16 h-16 mx-auto text-teal-400 mb-4" />
                <p className="text-slate-300 mb-4">
                  Click the button below to start scanning QR codes from guest invitations
                </p>
                <Button 
                  onClick={handleStartScanning}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scanning
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
                Checked In Guests
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Pending Guests */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-400" />
                Pending Guests
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
                        onClick={() => alert(`${guest.name} checked in manually!`)}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
