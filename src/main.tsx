import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import InvitationCard from "./pages/InvitationCard";
import Rsvp from "./pages/Rsvp";
import PrintInvitationCard from "./pages/PrintInvitationCard";

createRoot(document.getElementById("root")!).render(<App />);
