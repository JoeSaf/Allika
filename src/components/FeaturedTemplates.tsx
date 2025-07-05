
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Eye, Heart } from 'lucide-react';

const FeaturedTemplates = () => {
  const navigate = useNavigate();
  
  const templates = [
    {
      id: 1,
      name: 'Royal Islamic Wedding',
      category: 'WEDDINGS',
      image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400',
      price: '2,600',
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 2,
      name: 'Modern Kitchen Party',
      category: 'KITCHEN PARTY',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
      price: '2,200',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 3,
      name: 'Elegant Black & Gold',
      category: 'WEDDINGS',
      image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
      price: '2,200',
      color: 'from-yellow-500 to-amber-600'
    },
    {
      id: 4,
      name: 'Bridal Shower Bliss',
      category: 'KITCHEN PARTY',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
      price: '2,200',
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 5,
      name: 'Purple Lavender Dream',
      category: 'WEDDINGS',
      image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400',
      price: '2,200',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <section className="py-16 px-4 bg-slate-800" id="templates">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Featured Templates</h2>
          <p className="text-slate-300 text-lg">Choose from our collection of stunning invitation designs</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="bg-slate-700 border-slate-600 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="relative">
                <img 
                  src={template.image} 
                  alt={template.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute top-2 left-2">
                  <span className="bg-slate-900/80 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
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
              
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2 line-clamp-1">{template.name}</h3>
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
        
        <div className="text-center mt-12">
          <Button 
            onClick={() => navigate('/templates')}
            variant="outline" 
            className="border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-900 px-8 py-3 text-lg"
          >
            View All Templates
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedTemplates;
