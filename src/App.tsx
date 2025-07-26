import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
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
import InvitationCard from "./pages/InvitationCard";
import Rsvp from "./pages/Rsvp";

// Components
import IdleSessionHandler from "@/components/IdleSessionHandler";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = (): JSX.Element => {
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
