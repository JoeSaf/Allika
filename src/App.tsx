import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import TemplateEditor from "./pages/TemplateEditor";
import MessagePreview from "./pages/MessagePreview";
import Pricing from "./pages/Pricing";
import ViewAnalytics from "./pages/ViewAnalytics";
import QrScanner from "./pages/QrScanner";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { logoutUser, isUserLoggedIn } from "@/utils/auth";
import { toast } from "@/hooks/use-toast";
import IdleSessionHandler from "@/components/IdleSessionHandler";
import InvitationCard from './pages/InvitationCard';
import Rsvp from './pages/Rsvp';

const queryClient = new QueryClient();

const App = () => {
  // Removed useNavigate and idle session logic
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <IdleSessionHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/template/:id" element={<TemplateEditor />} />
            <Route path="/preview-message" element={<MessagePreview />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/analytics/:eventId" element={<ViewAnalytics />} />
            <Route path="/qr-scanner/:eventId" element={<QrScanner />} />
            <Route path="/invitation/:token" element={<InvitationCard />} />
            <Route path="/rsvp/:token" element={<Rsvp />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;