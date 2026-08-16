import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.js";
import "@chronolanejs/react/styles.css";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Application root was not found.");

createRoot(root).render(<StrictMode><App /></StrictMode>);
