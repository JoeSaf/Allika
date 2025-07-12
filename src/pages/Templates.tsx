
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Gift, Sparkles, ArrowLeft } from 'lucide-react';
import { createDefaultEvent, saveEvent, setCurrentEvent } from '@/utils/storage';
import { isUserLoggedIn, requireLogin } from '@/utils/auth';

const Templates = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');

  const templates = [
    {
      id: 'wedding-1',
      name: 'Elegant Wedding',
      type: 'wedding',
      category: 'weddings',
      description: 'Classic and elegant wedding invitation with floral elements',
      image: '/placeholder.svg',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      tags: ['Classic', 'Elegant', 'Floral']
    },
    {
      id: 'party-1',
      name: 'Birthday Celebration',
      type: 'birthday',
      category: 'parties',
      description: 'Fun and colorful birthday party invitation',
      image: '/placeholder.svg',
      icon: Gift,
      color: 'from-blue-500 to-purple-500',
      tags: ['Fun', 'Colorful', 'Celebration']
    },
    {
      id: 'corporate-1',
      name: 'Awards Ceremony',
      type: 'awards',
      category: 'awards',
      description: 'Professional awards ceremony invitation',
      image: '/placeholder.svg',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-500',
      tags: ['Professional', 'Formal', 'Awards']
    }
  ];

  const filteredTemplates = category 
    ? templates.filter(template => template.category === category)
    : templates;

  const handleSelectTemplate = (template: any) => {
    // Check if user is logged in before allowing template selection
    if (!isUserLoggedIn()) {
      navigate(requireLogin(window.location.pathname));
      return;
    }

    // Create a new event based on the template
    const newEvent = createDefaultEvent(template.type);
    newEvent.title = `New ${template.name}`;
    
    // Customize RSVP settings based on template type
    if (template.type === 'wedding') {
      newEvent.rsvpSettings.title = 'Wedding Invitation';
      newEvent.rsvpSettings.subtitle = 'Join us in celebration of our special day';
      newEvent.rsvpSettings.welcomeMessage = 'We would be honored by your presence at our wedding';
    } else if (template.type === 'birthday') {
      newEvent.rsvpSettings.title = 'Birthday Party';
      newEvent.rsvpSettings.subtitle = 'Come celebrate with us!';
      newEvent.rsvpSettings.welcomeMessage = 'Join us for an amazing birthday celebration';
    } else if (template.type === 'awards') {
      newEvent.rsvpSettings.title = 'Awards Ceremony';
      newEvent.rsvpSettings.subtitle = 'An evening of recognition and celebration';
      newEvent.rsvpSettings.welcomeMessage = 'You are cordially invited to our awards ceremony';
      newEvent.rsvpSettings.guestCountEnabled = false;
      newEvent.rsvpSettings.specialRequestsEnabled = false;
    }
    
    // Save the event and set it as current
    saveEvent(newEvent);
    setCurrentEvent(newEvent.id);
    
    // Navigate to template editor
    navigate(`/template/${newEvent.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          {category && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/templates')}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Templates
            </Button>
          )}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Templates` : 'Choose a Template'}
            </h1>
            <p className="text-slate-300">Select a template to start creating your invitation</p>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No templates found</h3>
              <p className="text-slate-500 mb-6">No templates available for this category</p>
              <Button 
                onClick={() => navigate('/templates')}
                className="bg-teal-600 hover:bg-teal-700"
              >
                View All Templates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card key={template.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all cursor-pointer">
                  <CardHeader>
                    <div className={`w-full h-40 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center mb-4`}>
                      <IconComponent className="w-16 h-16 text-white" />
                    </div>
                    <CardTitle className="text-white">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 text-sm mb-4">{template.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-slate-700 text-slate-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
