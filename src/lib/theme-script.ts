import "server-only";

/**
 * Applies the stored theme before hydration so the page never flashes.
 * Runs inline and must stay tiny.
 */
export const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("pa-theme");
    var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    var theme = stored === "light" || stored === "dark" ? stored : (prefersLight ? "light" : "dark");
    var root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;
