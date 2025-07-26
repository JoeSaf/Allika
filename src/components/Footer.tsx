import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 px-4 text-center">
      <div className="text-slate-500 text-sm">
        © {currentYear} Nejo. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
