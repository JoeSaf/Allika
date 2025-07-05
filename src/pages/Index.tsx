
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import EventCategories from '@/components/EventCategories';
import FeaturedTemplates from '@/components/FeaturedTemplates';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <Hero />
      <EventCategories />
      <FeaturedTemplates />
    </div>
  );
};

export default Index;
