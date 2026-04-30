import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import "./App.css";
import { AddBoxPage } from "./pages/AddBox";
import { ActivityPage } from "./pages/Activity";
import { BoxDetailPage } from "./pages/BoxDetail";
import { BoxesPage } from "./pages/Boxes";
import { HelpPage } from "./pages/Help";
import { ItemDetailPage } from "./pages/ItemDetail";
import { ScanPage } from "./pages/Scan";
import { SearchPage } from "./pages/Search";
import { SettingsPage } from "./pages/Settings";
import {
  listBoxes,
  resolveAssetUrl,
  searchInventory,
  type BoxSummary,
  type SearchResult,
} from "./lib/api";

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
  { label: "Aktivität", icon: "history", to: "/activity", match: (p) => p === "/activity" },
];

const mobileNavItems = [
  { label: "Suchen", icon: "search", to: "/", isBoxes: false },
  { label: "Behälter", icon: "inventory_2", to: "/boxes", isBoxes: true },
  { label: "Hinzufügen", icon: "add_circle", to: "/boxes/add", isBoxes: false },
  { label: "Scannen", icon: "qr_code_scanner", to: "/scan", isBoxes: false },
  { label: "Mehr", icon: "more_horiz", to: "/settings", isBoxes: false },
] as const;

function AppBar() {
  const onCmdkClick = () => window.dispatchEvent(new CustomEvent("cmdk:open"));

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

function CmdkShortcut({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    };
    const trigger = () => onOpen();
    window.addEventListener("keydown", handler);
    window.addEventListener("cmdk:open", trigger);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("cmdk:open", trigger);
    };
  }, [onOpen]);
  return null;
}

type CommandItem =
  | {
      kind: "route";
      id: string;
      icon: string;
      title: string;
      hint?: string;
      to: string;
    }
  | {
      kind: "box";
      id: string;
      icon: string;
      title: string;
      hint?: string;
      to: string;
      thumb: string | null;
    }
  | {
      kind: "item";
      id: string;
      icon: string;
      title: string;
      hint?: string;
      to: string;
      thumb: string | null;
    };

const ROUTE_COMMANDS: CommandItem[] = [
  { kind: "route", id: "go-boxes", icon: "inventory_2", title: "Behälter öffnen", hint: "/boxes", to: "/boxes" },
  { kind: "route", id: "go-search", icon: "search", title: "Suchen", hint: "/", to: "/" },
  { kind: "route", id: "go-add", icon: "add_circle", title: "Neuen Behälter anlegen", hint: "/boxes/add", to: "/boxes/add" },
  { kind: "route", id: "go-scan", icon: "qr_code_scanner", title: "Scanner öffnen", hint: "/scan", to: "/scan" },
  { kind: "route", id: "go-settings", icon: "settings", title: "Einstellungen", hint: "/settings", to: "/settings" },
  { kind: "route", id: "go-help", icon: "help", title: "Hilfe", hint: "/help", to: "/help" },
];

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [boxes, setBoxes] = useState<BoxSummary[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      // Focus next tick so the input is mounted
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    return;
  }, [open]);

  // Lazy-load box list once when palette is opened the first time
  useEffect(() => {
    if (!open || boxes.length > 0) return;
    let cancelled = false;
    void listBoxes()
      .then((data) => {
        if (!cancelled) setBoxes(data);
      })
      .catch(() => {
        /* silent */
      });
    return () => {
      cancelled = true;
    };
  }, [open, boxes.length]);

  // Live item search debounced
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void searchInventory(trimmed)
        .then(setResults)
        .catch(() => setResults([]));
    }, 150);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    const out: CommandItem[] = [];

    if (q.length === 0) {
      out.push(...ROUTE_COMMANDS);
      // Recent boxes (top 5 by updatedAt)
      const recent = [...boxes]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5);
      for (const b of recent) {
        out.push({
          kind: "box",
          id: `box-${b.id}`,
          icon: "inventory_2",
          title: `${b.name}`,
          hint: `#${String(b.number).padStart(3, "0")} · ${b.location || "—"}`,
          to: `/boxes/${b.id}`,
          thumb: resolveAssetUrl(b.thumbnailPath),
        });
      }
      return out;
    }

    // Filter routes
    for (const r of ROUTE_COMMANDS) {
      if (r.title.toLowerCase().includes(q) || r.hint?.toLowerCase().includes(q)) {
        out.push(r);
      }
    }
    // Filter boxes by name / number / location
    const matchedBoxes = boxes
      .filter((b) => {
        const num = `#${String(b.number).padStart(3, "0")}`;
        return (
          b.name.toLowerCase().includes(q) ||
          (b.location ?? "").toLowerCase().includes(q) ||
          num.includes(q) ||
          String(b.number) === q
        );
      })
      .slice(0, 8);
    for (const b of matchedBoxes) {
      out.push({
        kind: "box",
        id: `box-${b.id}`,
        icon: "inventory_2",
        title: b.name,
        hint: `#${String(b.number).padStart(3, "0")} · ${b.location || "—"}`,
        to: `/boxes/${b.id}`,
        thumb: resolveAssetUrl(b.thumbnailPath),
      });
    }
    // Items from search API
    for (const r of results.slice(0, 10)) {
      out.push({
        kind: "item",
        id: `item-${r.item.id}`,
        icon: "label",
        title: r.item.name,
        hint: `${r.box.name} · ${r.box.location || "—"}`,
        to: `/items/${r.item.id}`,
        thumb: resolveAssetUrl(r.item.thumbnailPath),
      });
    }
    return out;
  }, [query, boxes, results]);

  // Clamp active index when items change
  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(Math.max(0, items.length - 1));
  }, [items.length, activeIndex]);

  // Scroll active row into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cmd-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;

  const onSelect = (item: CommandItem) => {
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const sel = items[activeIndex];
      if (sel) onSelect(sel);
    }
  };

  return (
    <div className="cmdp-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="cmdp"
        role="dialog"
        aria-modal="true"
        aria-label="Befehlspalette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cmdp__head">
          <span className="material-symbols-outlined">search</span>
          <input
            ref={inputRef}
            className="cmdp__input"
            type="text"
            placeholder="Suche Behälter, Items oder springe zu…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
          />
          <span className="cmdp__kbd">Esc</span>
        </div>
        <div className="cmdp__list" ref={listRef}>
          {items.length === 0 ? (
            <div className="cmdp__empty">
              {query.trim().length < 2
                ? "Tippe, um zu suchen — oder wähle einen Schnellbefehl."
                : `Nichts gefunden für „${query.trim()}".`}
            </div>
          ) : (
            items.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-cmd-idx={idx}
                  className={`cmdp__row${isActive ? " cmdp__row--active" : ""}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => onSelect(item)}
                >
                  <span className="cmdp__icon">
                    {item.kind !== "route" && "thumb" in item && item.thumb ? (
                      <img src={item.thumb} alt="" />
                    ) : (
                      <span className="material-symbols-outlined">{item.icon}</span>
                    )}
                  </span>
                  <span className="cmdp__title">{item.title}</span>
                  {item.hint ? <span className="cmdp__hint">{item.hint}</span> : null}
                  <span className="cmdp__kind">
                    {item.kind === "route" ? "Springe zu" : item.kind === "box" ? "Behälter" : "Item"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
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
      <CmdkShortcut onOpen={() => setPaletteOpen(true)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

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
            <Route element={<ActivityPage />} path="/activity" />
          </Routes>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}

export default App;
