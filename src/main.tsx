// src/main.tsx

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import "./utils/contrastAudit";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
