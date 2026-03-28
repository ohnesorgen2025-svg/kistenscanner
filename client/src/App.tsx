import { NavLink, Route, Routes } from "react-router-dom";

import "./App.css";
import { AddBoxPage } from "./pages/AddBox";
import { BoxDetailPage } from "./pages/BoxDetail";
import { BoxesPage } from "./pages/Boxes";
import { SearchPage } from "./pages/Search";

type NavigationLink = {
  label: string;
  icon: string;
  to?: string;
};

const navigationLinks: NavigationLink[] = [
  { label: "Suchen", icon: "search", to: "/" },
  { label: "Scannen", icon: "qr_code_scanner", to: "/boxes/add" },
  { label: "Hinzufügen", icon: "add_box", to: "/boxes/add" },
  { label: "Einstellungen", icon: "settings" },
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
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="material-symbols-outlined brand__icon">package_2</span>
          <span className="brand__text">KISTENSCANNER</span>
        </div>
        <div className="topbar__actions">
          <NavLink className="topbar__link" to="/boxes">
            Kisten
          </NavLink>
        </div>
      </header>

      <main className="page-shell">
        <Routes>
          <Route element={<SearchPage />} path="/" />
          <Route element={<BoxesPage />} path="/boxes" />
          <Route element={<AddBoxPage />} path="/boxes/add" />
          <Route element={<BoxDetailPage />} path="/boxes/:id" />
        </Routes>
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
