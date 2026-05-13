"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  function applyTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    document.cookie = `theme=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setTheme(nextTheme);
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      aria-pressed={isLight}
      onClick={() => applyTheme(isLight ? "dark" : "light")}
    >
      <span className={isLight ? "theme-toggle-option" : "theme-toggle-option is-active"}>
        Oscuro
      </span>
      <span className={isLight ? "theme-toggle-option is-active" : "theme-toggle-option"}>
        Claro
      </span>
    </button>
  );
}

