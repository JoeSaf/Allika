
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  Clock, 
  Mail, 
  Phone, 
  Plus, 
  Search, 
  Scan,
  ArrowLeft
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { 
  getEvent, 
  getEventAnalytics, 
  getGuests, 
  addGuest, 
  addGuestsBulk, 
  sendInvites
} from '@/services/api';
import SendInvitationModal from '@/components/SendInvitationModal';

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
  description?: string;
  theme?: string;
  rsvp_enabled?: boolean;
  time?: string; // Added time field
}

const ViewAnalytics = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showSendInvitationModal, setShowSendInvitationModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  


  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      
      const [eventRes, guestsRes, analyticsRes] = await Promise.all([
        getEvent(eventId!),
        getGuests(eventId!),
        getEventAnalytics(eventId!)
      ]);

      if (eventRes.success) setEvent(eventRes.data.event);
      if (guestsRes.success) setGuests(guestsRes.data.guests);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      
    } catch (error) {
      console.error('Error loading event data:', error);
      toast({
        title: "Error",
        description: "Failed to load event data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  const handleManualCheckIn = async (guestId: string) => {
    setIsProcessing(true);
    try {
      // In a real app, you'd call the API to check in the guest
      const guest = guests.find(g => g.id === guestId);
      if (guest) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        const updatedGuests = guests.map(g => 
          g.id === guestId 
            ? { ...g, checked_in: true, check_in_time: new Date().toLocaleTimeString() }
            : g
        );
        setGuests(updatedGuests);
        
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

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (guest.email && guest.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (guest.phone && guest.phone.includes(searchQuery))
  );

  const checkedInGuests = guests.filter(g => g.checked_in);
  const pendingGuests = guests.filter(g => !g.checked_in);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Event not found.</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-900">
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center gap-4 mb-8 justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Event Analytics</h1>
                <p className="text-slate-300">Event: {event.title}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate(`/qr-scanner/${eventId}`)} className="bg-teal-600 hover:bg-teal-700 text-white">
                <Scan className="w-4 h-4 mr-2" />
                QR Scanner
              </Button>
              <Button onClick={() => setShowAddGuestModal(true)} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Guest
              </Button>
              <Button onClick={() => setShowSendInvitationModal(true)} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Mail className="w-4 h-4 mr-2" />
                Send Invitations
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{guests.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Checked In</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{checkedInGuests.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{pendingGuests.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                {guests.length > 0 ? Math.round((checkedInGuests.length / guests.length) * 100) : 0}%
        </div>
            </CardContent>
          </Card>
        </div>

        {/* Guest Management */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
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
              {filteredGuests.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-4">
                      <div>
                      <p className="text-white font-medium">{guest.name}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        {guest.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {guest.email}
                          </span>
                        )}
                        {guest.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {guest.phone}
                          </span>
                        )}
                        {guest.table_number && (
                          <span>Table {guest.table_number}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {guest.checked_in ? (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Checked In
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleManualCheckIn(guest.id)}
                        disabled={isProcessing}
                        size="sm"
                      >
                        Check In
                      </Button>
                    )}
                    </div>
                  </div>
                ))}
              {filteredGuests.length === 0 && (
                <p className="text-slate-400 text-center py-4">No guests found</p>
              )}
              </div>
          </CardContent>
        </Card>



        {/* Add Guest Modal */}
        <Dialog open={showAddGuestModal} onOpenChange={setShowAddGuestModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Guest</DialogTitle>
            </DialogHeader>
            {/* Add guest form would go here */}
          </DialogContent>
        </Dialog>

        {/* Send Invitation Modal */}
        <SendInvitationModal
          open={showSendInvitationModal}
          onClose={() => setShowSendInvitationModal(false)}
          eventId={eventId!}
          template={selectedTemplate}
        />
      </div>
    </>
  );
};

export default ViewAnalytics;
