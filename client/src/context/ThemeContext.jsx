import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Base Theme: light | dark | amoled
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  // Accent Color: hex code
  const [accent, setAccent] = useState(() => {
    return localStorage.getItem("accent") || "#d4829c"; // Default pink
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    
    // Apply accent color to CSS variables
    document.documentElement.style.setProperty("--accent", accent);
    // Create a soft version for backgrounds/shadows
    document.documentElement.style.setProperty("--accent-soft", `${accent}1a`); 
    localStorage.setItem("accent", accent);
  }, [theme, accent]);

  const toggle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("amoled");
    else setTheme("light");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
