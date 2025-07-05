
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
      description: 'Elegant Islamic wedding invitation with traditional patterns'
    },
    {
      id: 2,
      name: 'Hot Pink Kitchen Party',
      category: 'kitchen party',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
      price: '2,200',
      description: 'Vibrant and fun kitchen party invitation design'
    },
    {
      id: 3,
      name: 'Black & Gold Wedding',
      category: 'weddings',
      image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
      price: '2,200',
      description: 'Sophisticated black and gold wedding invitation'
    },
    {
      id: 4,
      name: 'White & Pink Bridal Shower',
      category: 'kitchen party',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
      price: '2,200',
      description: 'Delicate bridal shower invitation in soft colors'
    },
    {
      id: 5,
      name: 'Purple Lavender Wedding',
      category: 'weddings',
      image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400',
      price: '2,200',
      description: 'Romantic purple themed wedding invitation'
    },
    {
      id: 6,
      name: 'Modern Birthday Celebration',
      category: 'birthday',
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
      price: '1,800',
      description: 'Contemporary birthday party invitation design'
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

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
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
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className={`bg-slate-800 border-slate-700 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}
            >
              <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                <img 
                  src={template.image} 
                  alt={template.name}
                  className={`object-cover group-hover:scale-110 transition-transform duration-300 ${
                    viewMode === 'list' ? 'w-full h-full' : 'w-full h-48'
                  }`}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
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
