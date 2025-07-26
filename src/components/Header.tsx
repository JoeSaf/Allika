
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Menu, X, LogOut, User, Settings } from "lucide-react";
import { isUserLoggedIn, getCurrentUser, logoutUser } from "@/utils/auth";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLoggedIn = isUserLoggedIn();
  const currentUser = getCurrentUser();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    try {
      logoutUser();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Error",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-6xl mx-auto px-4 z-50">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            >
              <Sparkles className="w-8 h-8 text-teal-400" />
              <span className="text-2xl font-bold text-white">Alika</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => navigate("/")}
                className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105"
              >
                Home
              </button>
              {isLoggedIn && (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105"
                >
                  Events
                </button>
              )}
              <button
                onClick={() => navigate("/templates")}
                className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105"
              >
                Templates
              </button>
              <button
                onClick={() => navigate("/pricing")}
                className="text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105"
              >
                Pricing
              </button>
            </nav>

            {/* Desktop Authentication Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="bg-slate-800/80 backdrop-blur-md border border-slate-600/50 text-white hover:bg-slate-700/80 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {currentUser?.name || "User"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white w-48">
                    <DropdownMenuLabel className="text-slate-400">
                      {currentUser?.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={() => navigate("/dashboard")}
                      className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      My Events
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/templates")}
                      className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Templates
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="hover:bg-red-700 focus:bg-red-700 text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Button>
              )}
            </div>

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
                  onClick={() => handleNavigation("/")}
                  className="text-slate-300 hover:text-white transition-colors duration-200 text-left"
                >
                  Home
                </button>
                {isLoggedIn && (
                  <button
                    onClick={() => handleNavigation("/dashboard")}
                    className="text-slate-300 hover:text-white transition-colors duration-200 text-left"
                  >
                    Events
                  </button>
                )}
                <button
                  onClick={() => handleNavigation("/templates")}
                  className="text-slate-300 hover:text-white transition-colors duration-200 text-left"
                >
                  Templates
                </button>
                <button
                  onClick={() => handleNavigation("/pricing")}
                  className="text-slate-300 hover:text-white transition-colors duration-200 text-left"
                >
                  Pricing
                </button>

                {/* Mobile Authentication Section */}
                {isLoggedIn ? (
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 text-sm">{currentUser?.name || "User"}</span>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleNavigation("/dashboard")}
                        className="w-full text-left text-slate-300 hover:text-white transition-colors duration-200 flex items-center space-x-2"
                      >
                        <User className="w-4 h-4" />
                        <span>My Events</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/templates")}
                        className="w-full text-left text-slate-300 hover:text-white transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Templates</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleNavigation("/login")}
                    className="bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl w-full mt-4"
                  >
                    Get Started
                  </Button>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
