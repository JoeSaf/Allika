import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering...'); // Debug log
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/template/:id" element={<TemplateEditor />} />
            <Route path="/preview-message" element={<MessagePreview />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/view-analytics" element={<ViewAnalytics />} />
            <Route path="/qr-scanner" element={<QrScanner />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;