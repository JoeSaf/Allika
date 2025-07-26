
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Star, Music, Heart, Sparkles } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-slate-900 py-20 px-4 overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 text-yellow-400 animate-pulse">
        <Star className="w-6 h-6" />
      </div>
      <div className="absolute top-32 right-20 text-blue-400 animate-bounce">
        <Music className="w-5 h-5" />
      </div>
      <div className="absolute bottom-32 left-16 text-pink-400 animate-pulse">
        <Heart className="w-4 h-4" />
      </div>
      <div className="absolute bottom-20 right-10 text-yellow-300 animate-bounce">
        <Sparkles className="w-6 h-6" />
      </div>

      <div className="container mx-auto text-center relative z-10">
        <div className="mb-6">
          <Sparkles className="w-12 h-12 text-teal-400 mx-auto mb-4" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Create <span className="text-teal-400">Events</span> That Spark Memories
        </h1>

        <p className="text-xl text-slate-300 max-w-4xl mx-auto mb-8 leading-relaxed">
          Dive into the ultimate event experience with Alika! We make it easy to create memorable events with our custom invitation templates, attendee management, and real-time RSVP tracking.
        </p>

        <Button
          onClick={() => navigate("/dashboard")}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-green-600/25"
        >
          Get Started
        </Button>
      </div>
    </section>
  );
};

export default Hero;
