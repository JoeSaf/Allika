
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EventCategories from "@/components/EventCategories";
import FeaturedTemplates from "@/components/FeaturedTemplates";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Header />
      <div className="pt-24 flex-1">
        <Hero />
        <EventCategories />
        <FeaturedTemplates />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
