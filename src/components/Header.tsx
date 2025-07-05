
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-teal-400" />
            <span className="text-2xl font-bold text-white">NeJo</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/dashboard" className="text-slate-300 hover:text-white transition-colors">Events</a>
            <a href="/templates" className="text-slate-300 hover:text-white transition-colors">Templates</a>
            <a href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
          </nav>
          
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
