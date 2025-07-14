import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser, isUserLoggedIn } from "@/utils/auth";
import { toast } from "@/hooks/use-toast";

const IDLE_LIMIT = 15 * 60 * 1000; // 15 minutes

export default function IdleSessionHandler() {
  const navigate = useNavigate();
  const idleTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
      if (isUserLoggedIn()) {
        idleTimeout.current = setTimeout(() => {
          logoutUser();
          toast({
            title: "Session Expired",
            description: "You have been logged out due to inactivity.",
            variant: "destructive"
          });
          navigate("/login");
        }, IDLE_LIMIT);
      }
    };
    const events = [
      "mousemove", "mousedown", "keydown", "touchstart", "scroll"
    ];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [navigate]);

  return null;
} 