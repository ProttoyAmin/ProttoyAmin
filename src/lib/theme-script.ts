import "server-only";

/**
 * Applies the theme before hydration so the page never flashes.
 *
 * Runs inline and must stay tiny. The order is: an explicit choice by the
 * visitor wins, then the theme the owner configured in the admin panel,
 * then the operating system preference.
 */
export function themeScript(defaultTheme: "dark" | "light" = "dark"): string {
  return `
(function () {
  try {
    var stored = localStorage.getItem("pa-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : ${JSON.stringify(defaultTheme)};
    var root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;
}
