
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Heart, Grid, List } from 'lucide-react';
import Header from '@/components/Header';

const Templates = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const templates = [
    {
      id: 1,
      name: 'Royal Islamic Wedding Invitation',
      category: 'weddings',
      image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400',
      price: '2,600',
      description: 'Elegant Islamic wedding invitation with traditional patterns',
      layout: 'layout1'
    },
    {
      id: 2,
      name: 'Hot Pink Kitchen Party',
      category: 'kitchen party',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
      price: '2,200',
      description: 'Vibrant and fun kitchen party invitation design',
      layout: 'layout2'
    },
    {
      id: 3,
      name: 'Black & Gold Wedding',
      category: 'weddings',
      image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
      price: '2,200',
      description: 'Sophisticated black and gold wedding invitation',
      layout: 'layout3'
    },
    {
      id: 4,
      name: 'White & Pink Bridal Shower',
      category: 'kitchen party',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
      price: '2,200',
      description: 'Delicate bridal shower invitation in soft colors',
      layout: 'layout1'
    },
    {
      id: 5,
      name: 'Purple Lavender Wedding',
      category: 'weddings',
      image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400',
      price: '2,200',
      description: 'Romantic purple themed wedding invitation',
      layout: 'layout2'
    },
    {
      id: 6,
      name: 'Modern Birthday Celebration',
      category: 'birthday',
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
      price: '1,800',
      description: 'Contemporary birthday party invitation design',
      layout: 'layout3'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'weddings', name: 'Weddings' },
    { id: 'kitchen party', name: 'Kitchen Party' },
    { id: 'birthday', name: 'Birthday' },
    { id: 'sendoff', name: 'Send Off' },
    { id: 'welcome', name: 'Welcome' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const TemplatePreview = ({ template }: { template: any }) => {
    const { layout, name, category, image } = template;
    
    const commonContent = {
      eventName: name.split(' ')[0] + ' ' + name.split(' ')[1],
      date: "December 25, 2024",
      time: "6:00 PM",
      venue: "Grand Ballroom",
      details: "Join us for a memorable celebration"
    };

    if (layout === 'layout1') {
      // Picture on left, text on top right
      return (
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 h-64 flex">
          <div className="w-1/2 pr-4">
            <img src={image} alt={name} className="w-full h-full object-cover rounded-lg shadow-md" />
          </div>
          <div className="w-1/2 pl-4 flex flex-col justify-center">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold text-purple-800 uppercase tracking-wide">{commonContent.eventName}</h3>
              <div className="space-y-1 text-sm text-purple-700">
                <p className="font-semibold">{commonContent.date}</p>
                <p>{commonContent.time}</p>
                <p className="font-medium">{commonContent.venue}</p>
              </div>
              <p className="text-xs text-purple-600 italic mt-3">{commonContent.details}</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (layout === 'layout2') {
      // Picture on left, text below
      return (
        <div className="bg-gradient-to-b from-blue-50 to-teal-100 p-6 h-64 flex flex-col">
          <div className="flex flex-1 mb-4">
            <div className="w-1/2 pr-3">
              <img src={image} alt={name} className="w-full h-full object-cover rounded-lg shadow-md" />
            </div>
            <div className="w-1/2 pl-3 flex items-center">
              <div className="text-center w-full">
                <h3 className="text-xl font-bold text-teal-800 mb-2">{commonContent.eventName}</h3>
                <div className="text-sm text-teal-700 space-y-1">
                  <p className="font-semibold">{commonContent.date}</p>
                  <p>{commonContent.time}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-teal-200 pt-3 text-center">
            <p className="text-sm font-medium text-teal-800">{commonContent.venue}</p>
            <p className="text-xs text-teal-600 mt-1">{commonContent.details}</p>
          </div>
        </div>
      );
    }
    
    if (layout === 'layout3') {
      // Picture on right, text on left
      return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-6 h-64 flex">
          <div className="w-1/2 pr-4 flex flex-col justify-center">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-amber-800 text-center">{commonContent.eventName}</h3>
              <div className="space-y-2 text-sm text-amber-700 text-center">
                <p className="font-semibold text-base">{commonContent.date}</p>
                <p className="font-medium">{commonContent.time}</p>
                <p className="font-medium">{commonContent.venue}</p>
              </div>
              <div className="border-t border-amber-200 pt-3">
                <p className="text-xs text-amber-600 text-center italic">{commonContent.details}</p>
              </div>
            </div>
          </div>
          <div className="w-1/2 pl-4">
            <img src={image} alt={name} className="w-full h-full object-cover rounded-lg shadow-md" />
          </div>
        </div>
      );
    }

    // Fallback layout
    return (
      <div className="bg-gray-100 p-6 h-64 flex items-center justify-center">
        <p className="text-gray-500">Template Preview</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Template Library</h1>
          <p className="text-slate-300">Choose from our collection of stunning invitation templates</p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={selectedCategory === cat.id 
                    ? "bg-teal-600 hover:bg-teal-700" 
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                  }
                >
                  {cat.name}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`border-slate-600 ${viewMode === 'grid' ? 'bg-slate-700' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`border-slate-600 ${viewMode === 'list' ? 'bg-slate-700' : ''}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Templates Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className={`bg-slate-800 border-slate-700 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                viewMode === 'list' ? 'flex flex-col' : ''
              }`}
            >
              <div className="relative">
                <TemplatePreview template={template} />
                <div className="absolute top-2 left-2">
                  <span className="bg-slate-900/80 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm capitalize">
                    {template.category}
                  </span>
                </div>
                <div className="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                <div>
                  <h3 className="text-white font-semibold mb-2">{template.name}</h3>
                  {viewMode === 'list' && (
                    <p className="text-slate-300 text-sm mb-4">{template.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-teal-400 font-bold">{template.price} Tsh</span>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => navigate(`/template/${template.id}`)}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No templates found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
