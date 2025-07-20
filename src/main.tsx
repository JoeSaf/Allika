import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import InvitationCard from './pages/InvitationCard';
import Rsvp from './pages/Rsvp';

createRoot(document.getElementById("root")!).render(<App />);
