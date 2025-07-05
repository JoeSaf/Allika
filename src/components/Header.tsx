
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-6xl mx-auto px-4 z-50">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-teal-400" />
              <span className="text-2xl font-bold text-white">NeJo</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/dashboard" className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105">
                Events
              </a>
              <a href="/templates" className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105">
                Templates
              </a>
              <a href="/pricing" className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105">
                Pricing
              </a>
            </nav>
            
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
