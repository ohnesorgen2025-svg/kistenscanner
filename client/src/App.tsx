import { NavLink, Route, Routes, useLocation } from "react-router-dom";

import "./App.css";
import { AddBoxPage } from "./pages/AddBox";
import { BoxDetailPage } from "./pages/BoxDetail";
import { BoxesPage } from "./pages/Boxes";
import { ScanPage } from "./pages/Scan";
import { SearchPage } from "./pages/Search";
import { SettingsPage } from "./pages/Settings";

type NavigationLink = {
  label: string;
  icon: string;
  to?: string;
};

const navigationLinks: NavigationLink[] = [
  { label: "Suchen", icon: "search", to: "/" },
  { label: "Scannen", icon: "qr_code_scanner", to: "/scan" },
  { label: "Hinzufügen", icon: "add_box", to: "/boxes/add" },
  { label: "Kisten", icon: "inventory_2", to: "/boxes" },
  { label: "Settings", icon: "settings", to: "/settings" },
];

function NavigationItem({ icon, label, to }: NavigationLink) {
  if (!to) {
    return (
      <span className="nav-link nav-link--disabled">
        <span className="material-symbols-outlined">{icon}</span>
        <span>{label}</span>
      </span>
    );
  }

  return (
    <NavLink
      className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
      to={to}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function App() {
  const location = useLocation();
  const routeShellClass = location.pathname === "/boxes"
    ? "page-shell page-shell--boxes"
    : location.pathname.startsWith("/boxes/") && location.pathname !== "/boxes/add"
      ? "page-shell page-shell--detail"
      : "page-shell page-shell--narrow";

  return (
    <div className="shell">


      <main className={routeShellClass}>
        <div className="page-stack page-stack--route" key={location.pathname}>
          <Routes location={location}>
            <Route element={<SearchPage />} path="/" />
            <Route element={<ScanPage />} path="/scan" />
            <Route element={<SettingsPage />} path="/settings" />
            <Route element={<BoxesPage />} path="/boxes" />
            <Route element={<AddBoxPage />} path="/boxes/add" />
            <Route element={<BoxDetailPage />} path="/boxes/:id" />
          </Routes>
        </div>
      </main>

      <nav className="bottom-nav">
        {navigationLinks.map((item) => (
          <NavigationItem key={item.label} {...item} />
        ))}
      </nav>
    </div>
  );
}

export default App;
