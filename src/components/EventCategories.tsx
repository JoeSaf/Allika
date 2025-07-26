
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Folder,
  Heart,
  Cake,
  Users,
  Briefcase,
  Plane,
  Home,
  Music,
  Trophy,
} from "lucide-react";

const EventCategories = () => {
  const navigate = useNavigate();

  const categories = [
    { name: "SEMINAR", icon: FileText, color: "from-teal-500 to-teal-600", bgColor: "bg-teal-500" },
    { name: "OTHER", icon: Folder, color: "from-slate-500 to-slate-600", bgColor: "bg-slate-500" },
    { name: "WEDDING", icon: Heart, color: "from-pink-500 to-rose-600", bgColor: "bg-pink-500" },
    { name: "BIRTHDAY", icon: Cake, color: "from-orange-500 to-yellow-600", bgColor: "bg-orange-500" },
    { name: "MEETING", icon: Users, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-500" },
    { name: "CONFERENCE", icon: Briefcase, color: "from-indigo-500 to-indigo-600", bgColor: "bg-indigo-500" },
    { name: "SEND OFF", icon: Plane, color: "from-red-500 to-red-600", bgColor: "bg-red-500" },
    { name: "WELCOME", icon: Home, color: "from-green-500 to-green-600", bgColor: "bg-green-500" },
    { name: "FESTIVAL", icon: Music, color: "from-purple-500 to-purple-600", bgColor: "bg-purple-500" },
    { name: "AWARDS", icon: Trophy, color: "from-yellow-500 to-amber-600", bgColor: "bg-yellow-500" },
  ];

  return (
    <section className="py-16 px-4 bg-slate-900">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.name}
                className={`${category.bgColor} hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl p-6 text-center border-0 group`}
                onClick={() => navigate(`/templates?category=${category.name.toLowerCase()}`)}
              >
                <div className="text-white">
                  <Icon className="w-8 h-8 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-sm uppercase tracking-wide">
                    {category.name}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EventCategories;
