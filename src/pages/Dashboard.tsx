
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Users, Sparkles, Upload } from 'lucide-react';
import Header from '@/components/Header';

const Dashboard = () => {
  const navigate = useNavigate();
  const [eventData, setEventData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    category: '',
    guestCount: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = () => {
    console.log('Creating event:', eventData);
    // Navigate to template selection
    navigate('/templates');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Event Creator Dashboard</h1>
          <p className="text-slate-300">Create memorable events with stunning invitations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Creation Form */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="w-6 h-6 text-teal-400" />
                <h2 className="text-2xl font-bold text-white">Create New Event</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="name" className="text-white">Event Name</Label>
                  <Input
                    id="name"
                    value={eventData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., James & Sarah's Wedding"
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="date" className="text-white">Event Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={eventData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="time" className="text-white">Event Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="location" className="text-white">Event Location</Label>
                  <Input
                    id="location"
                    value={eventData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., St. Peter's Church, Oysterbay"
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-white">Event Category</Label>
                  <Select onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-2">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="baby-shower">Baby Shower</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="guestCount" className="text-white">Expected Guests</Label>
                  <Input
                    id="guestCount"
                    type="number"
                    value={eventData.guestCount}
                    onChange={(e) => handleInputChange('guestCount', e.target.value)}
                    placeholder="100"
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-white">Event Description</Label>
                  <Textarea
                    id="description"
                    value={eventData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Tell your guests about your special event..."
                    className="bg-slate-700 border-slate-600 text-white mt-2 h-24"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Guest List Management</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV File
                  </Button>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    <Users className="w-4 h-4 mr-2" />
                    Add Guests Manually
                  </Button>
                </div>
              </div>

              <div className="mt-8">
                <Button 
                  onClick={handleCreateEvent}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                  disabled={!eventData.name || !eventData.date}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Event & Choose Template
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick Stats & Actions */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Events</span>
                  <span className="text-2xl font-bold text-teal-400">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Active Invitations</span>
                  <span className="text-2xl font-bold text-green-400">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total RSVPs</span>
                  <span className="text-2xl font-bold text-blue-400">0</span>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/templates')}
                  variant="outline" 
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Browse Templates
                </Button>
                <Button 
                  onClick={() => navigate('/analytics')}
                  variant="outline" 
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  View Analytics
                </Button>
                <Button 
                  onClick={() => navigate('/scanner')}
                  variant="outline" 
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  QR Scanner
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
