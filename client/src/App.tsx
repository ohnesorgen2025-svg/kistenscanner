import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import "./App.css";
import { AddBoxPage } from "./pages/AddBox";
import { BoxDetailPage } from "./pages/BoxDetail";
import { BoxesPage } from "./pages/Boxes";
import { HelpPage } from "./pages/Help";
import { ItemDetailPage } from "./pages/ItemDetail";
import { ScanPage } from "./pages/Scan";
import { SearchPage } from "./pages/Search";
import { SettingsPage } from "./pages/Settings";

type SubNavItem = {
  label: string;
  icon: string;
  to?: string;
  match?: (pathname: string) => boolean;
  disabled?: boolean;
};

const subNavItems: SubNavItem[] = [
  {
    label: "Behälter",
    icon: "inventory_2",
    to: "/boxes",
    match: (p) =>
      p === "/boxes" || (p.startsWith("/boxes/") && p !== "/boxes/add") || p.startsWith("/items/"),
  },
  { label: "Suchen", icon: "search", to: "/", match: (p) => p === "/" },
  { label: "Aktivität", icon: "history", disabled: true },
];

const mobileNavItems = [
  { label: "Suchen", icon: "search", to: "/", isBoxes: false },
  { label: "Behälter", icon: "inventory_2", to: "/boxes", isBoxes: true },
  { label: "Hinzufügen", icon: "add_circle", to: "/boxes/add", isBoxes: false },
  { label: "Scannen", icon: "qr_code_scanner", to: "/scan", isBoxes: false },
  { label: "Mehr", icon: "more_horiz", to: "/settings", isBoxes: false },
] as const;

function AppBar() {
  const navigate = useNavigate();
  const onCmdkClick = () => navigate("/");

  return (
    <header className="appbar">
      <div className="appbar__inner">
        <div className="appbar__brand">
          <Link to="/boxes" className="appbar__mark" aria-label="Kistenscanner">K</Link>
          <span className="appbar__name">Kistenscanner</span>
          <span className="appbar__sep">/</span>
          <span className="appbar__path">
            stefan / <b>inventar</b>
          </span>
        </div>

        <button type="button" className="cmdk" onClick={onCmdkClick} aria-label="Suchen oder Befehl">
          <span className="material-symbols-outlined">search</span>
          <span className="cmdk__placeholder">Suchen oder Befehl ausführen…</span>
          <span className="cmdk__kbd">⌘K</span>
        </button>

        <div className="appbar__actions">
          <Link to="/boxes/add" className="appbar__icon" title="Behälter hinzufügen">
            <span className="material-symbols-outlined">add</span>
          </Link>
          <Link to="/scan" className="appbar__icon" title="Scannen">
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </Link>
          <Link to="/help" className="appbar__icon" title="Hilfe">
            <span className="material-symbols-outlined">help</span>
          </Link>
          <Link to="/settings" className="appbar__icon" title="Einstellungen">
            <span className="material-symbols-outlined">settings</span>
          </Link>
          <span className="appbar__avatar" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

function SubNav() {
  const location = useLocation();
  return (
    <nav className="subnav">
      <div className="subnav__inner">
        <div className="subnav__tabs">
          {subNavItems.map((item) => {
            if (item.disabled || !item.to) {
              return (
                <span
                  key={item.label}
                  className="subnav__tab subnav__tab--disabled"
                  aria-disabled="true"
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                  <span className="subnav__count subnav__count--soon">soon</span>
                </span>
              );
            }
            const active = item.match
              ? item.match(location.pathname)
              : location.pathname === item.to;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={() => `subnav__tab${active ? " subnav__tab--active" : ""}`}
                end={item.to === "/"}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <div className="subnav__actions">
          <Link to="/scan" className="subnav__btn">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Scan
          </Link>
          <Link to="/boxes/add" className="subnav__btn subnav__btn--primary">
            <span className="material-symbols-outlined">add</span>
            Behälter
          </Link>
        </div>
      </div>
    </nav>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  return (
    <nav className="bottom-nav">
      {mobileNavItems.map((item) => {
        const active = item.isBoxes
          ? location.pathname === "/boxes"
            || (location.pathname.startsWith("/boxes/") && location.pathname !== "/boxes/add")
            || location.pathname.startsWith("/items/")
          : location.pathname === item.to;
        return (
          <NavLink
            key={item.label}
            to={item.to}
            className={() => `nav-link${active ? " nav-link--active" : ""}`}
            end={item.to === "/"}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function CmdkShortcut() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
  return null;
}

function App() {
  const location = useLocation();
  const isBoxDetailRoute =
    (location.pathname.startsWith("/boxes/") && location.pathname !== "/boxes/add")
    || location.pathname.startsWith("/items/");
  const routeShellClass = isBoxDetailRoute
    ? "page-shell page-shell--detail"
    : "page-shell page-shell--app";

  return (
    <div className="shell">
      <AppBar />
      <SubNav />
      <CmdkShortcut />

      <main className={routeShellClass}>
        <div className="page-stack page-stack--route" key={location.pathname}>
          <Routes location={location}>
            <Route element={<SearchPage />} path="/" />
            <Route element={<ScanPage />} path="/scan" />
            <Route element={<SettingsPage />} path="/settings" />
            <Route element={<BoxesPage />} path="/boxes" />
            <Route element={<AddBoxPage />} path="/boxes/add" />
            <Route element={<BoxDetailPage />} path="/boxes/:id" />
            <Route element={<ItemDetailPage />} path="/items/:id" />
            <Route element={<HelpPage />} path="/help" />
          </Routes>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}

export default App;
