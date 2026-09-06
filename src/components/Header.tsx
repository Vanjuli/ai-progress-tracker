import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { applyTheme, getInitialTheme, getSystemPrefersDark, nextTheme } from "../lib/theme";

export function Header() {
  const [theme, setTheme] = useState(() =>
    getInitialTheme({ storage: window.localStorage, prefersDark: getSystemPrefersDark() })
  );

  useEffect(() => {
    applyTheme(document.documentElement, window.localStorage, theme);
  }, [theme]);

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="dot" />
          AI Progress Tracker
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/compare">Compare</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        <div className="header-right">
          <button
            type="button"
            className="btn theme-toggle"
            onClick={() => setTheme((current) => nextTheme(current))}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
