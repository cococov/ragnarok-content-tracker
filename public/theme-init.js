try {
  const stored = localStorage.getItem("theme");
  const theme = stored === "light" || stored === "dark"
    ? stored
    : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (stored !== theme) localStorage.setItem("theme", theme);
} catch {}
