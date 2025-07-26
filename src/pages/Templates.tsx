
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Gift, Sparkles, ArrowLeft } from "lucide-react";
import { createEvent, updateRsvpSettings } from "@/services/api";

import { isUserLoggedIn, requireLogin } from "@/utils/auth";
import Footer from "@/components/Footer";

const Templates = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  const templates = [
    {
      id: "wedding-1",
      name: "Elegant Wedding",
      type: "wedding",
      category: "weddings",
      description: "Classic and elegant wedding invitation with floral elements",
      image: "/placeholder.svg",
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      tags: ["Classic", "Elegant", "Floral"],
    },
    {
      id: "party-1",
      name: "Birthday Celebration",
      type: "birthday",
      category: "parties",
      description: "Fun and colorful birthday party invitation",
      image: "/placeholder.svg",
      icon: Gift,
      color: "from-blue-500 to-purple-500",
      tags: ["Fun", "Colorful", "Celebration"],
    },
    {
      id: "corporate-1",
      name: "Awards Ceremony",
      type: "awards",
      category: "awards",
      description: "Professional awards ceremony invitation",
      image: "/placeholder.svg",
      icon: Sparkles,
      color: "from-amber-500 to-orange-500",
      tags: ["Professional", "Formal", "Awards"],
    },
  ];

  const filteredTemplates = category
    ? templates.filter(template => template.category === category)
    : templates;

  const handleSelectTemplate = async (template: any) => {
    // Check if user is logged in before allowing template selection
    if (!isUserLoggedIn()) {
      navigate(requireLogin(window.location.pathname));
      return;
    }
    try {
      // 1. Create event via backend
      const eventPayload = {
        title: `New ${template.name}`,
        type: template.type,
        date: "",
        time: "",
        venue: "",
        additionalInfo: "",
      };
      const res = await createEvent(eventPayload);
      if (!res || !res.data || !res.data.event) {
        throw new Error("Event creation failed");
      }
      const newEvent = res.data.event;
      // Note: RSVP settings are already created by the backend with appropriate defaults
      // Users can customize them later in the template editor if needed
      // Store the current event ID in localStorage for the template editor
      localStorage.setItem("alika_current_event", newEvent.id);
      console.log("[Templates] Navigating to template editor with event ID:", newEvent.id);
      navigate(`/template/${newEvent.id}`);
    } catch (error) {
      console.error("Error creating event:", error);
      // Optionally show a toast or error message
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-24 flex-1">
        <div className="flex items-center gap-4 mb-8">
          {category && (
            <Button
              variant="outline"
              onClick={() => navigate("/templates")}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Templates
            </Button>
          )}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Templates` : "Choose a Template"}
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
                onClick={() => navigate("/templates")}
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
      <Footer />
    </div>
  );
};

export default Templates;
