
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, MessageSquare, Eye, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ViewAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalInvitations: 0,
    responseRate: 0,
    views: 0,
    confirmed: 0,
    pending: 0,
    declined: 0
  });
  const [responseData, setResponseData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll use localStorage or generate sample data based on current events
    const savedEvents = JSON.parse(localStorage.getItem('events') || '[]');
    const savedGuests = JSON.parse(localStorage.getItem('guests') || '[]');
    
    if (savedEvents.length > 0) {
      const totalInvitations = savedEvents.reduce((sum, event) => sum + (event.guests || 0), 0);
      const totalSent = savedEvents.reduce((sum, event) => sum + (event.sent || 0), 0);
      const responseRate = totalSent > 0 ? ((savedGuests.filter(g => g.status === 'confirmed').length / totalSent) * 100) : 0;
      
      const confirmed = savedGuests.filter(g => g.status === 'confirmed').length;
      const pending = savedGuests.filter(g => g.status === 'pending').length;
      const declined = savedGuests.filter(g => g.status === 'declined').length;

      setAnalytics({
        totalInvitations,
        responseRate: Math.round(responseRate * 10) / 10,
        views: Math.round(totalSent * 0.92), // Assume 92% open rate
        confirmed,
        pending,
        declined
      });

      // Generate response timeline data
      setResponseData([
        { name: 'Week 1', responses: Math.round(confirmed * 0.2) },
        { name: 'Week 2', responses: Math.round(confirmed * 0.35) },
        { name: 'Week 3', responses: Math.round(confirmed * 0.25) },
        { name: 'Week 4', responses: Math.round(confirmed * 0.2) },
      ]);

      // Status distribution
      setStatusData([
        { name: 'Confirmed', value: confirmed, color: '#10b981' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
        { name: 'Declined', value: declined, color: '#ef4444' },
      ]);

      // Generate recent activity
      setRecentActivity(
        savedGuests.slice(0, 5).map((guest, index) => ({
          name: guest.name || `Guest ${index + 1}`,
          action: guest.status === 'confirmed' ? 'confirmed attendance' : 
                  guest.status === 'declined' ? 'declined invitation' : 'viewed invitation',
          time: `${Math.floor(Math.random() * 24)} hours ago`,
          status: guest.status || 'pending'
        }))
      );
    } else {
      // If no events, show empty state
      setAnalytics({
        totalInvitations: 0,
        responseRate: 0,
        views: 0,
        confirmed: 0,
        pending: 0,
        declined: 0
      });
    }
  }, []);

  const hasData = analytics.totalInvitations > 0;

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Event Analytics</h1>
          <p className="text-slate-300">Track your invitation performance and guest responses</p>
        </div>

        {!hasData ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No analytics data yet</h3>
              <p className="text-slate-500">Create events and send invitations to see analytics here</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Total Invitations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-teal-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics.totalInvitations}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Response Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-teal-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics.responseRate}%</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Views</CardTitle>
                  <Eye className="h-4 w-4 text-teal-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics.views}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Confirmed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics.confirmed}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Response Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={responseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="responses" fill="#14b8a6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Response Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{activity.name}</p>
                            <p className="text-sm text-slate-300">{activity.action}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            className={
                              activity.status === 'confirmed' ? 'bg-green-600' :
                              activity.status === 'declined' ? 'bg-red-600' : 'bg-yellow-600'
                            }
                          >
                            {activity.status}
                          </Badge>
                          <span className="text-sm text-slate-400">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewAnalytics;
