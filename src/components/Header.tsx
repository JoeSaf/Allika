
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Menu, X } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-6xl mx-auto px-4 z-50">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <Sparkles className="w-8 h-8 text-teal-400" />
              <span className="text-2xl font-bold text-white">Alika</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => navigate('/')}
                className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105"
              >
                Home
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105"
              >
                Events
              </button>
              <button 
                onClick={() => navigate('/templates')}
                className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105"
              >
                Templates
              </button>
              <button 
                onClick={() => navigate('/pricing')}
                className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105"
              >
                Pricing
              </button>
            </nav>
            
            {/* Desktop Get Started Button */}
            <Button 
              onClick={() => navigate('/dashboard')}
              className="hidden md:flex bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started
            </Button>

            {/* Mobile Menu Button */}
            <Button
              onClick={toggleMobileMenu}
              className="md:hidden bg-slate-800/80 backdrop-blur-md border border-slate-600/50 text-white hover:bg-slate-700/80"
              size="sm"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700/50">
            <div className="px-6 py-4 bg-slate-900/90 backdrop-blur-md rounded-b-2xl">
              <nav className="flex flex-col space-y-4">
                <button 
                  onClick={() => handleNavigation('/')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 text-left"
                >
                  Home
                </button>
                <button 
                  onClick={() => handleNavigation('/dashboard')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 text-left"
                >
                  Events
                </button>
                <button 
                  onClick={() => handleNavigation('/templates')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 text-left"
                >
                  Templates
                </button>
                <button 
                  onClick={() => handleNavigation('/pricing')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 text-left"
                >
                  Pricing
                </button>
                <Button 
                  onClick={() => handleNavigation('/dashboard')}
                  className="bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl w-full mt-4"
                >
                  Get Started
                </Button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
