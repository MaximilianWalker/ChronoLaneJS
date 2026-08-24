import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import App from "./App.js";
import "../../src/Calendar.css";
import "../../src/components/Navigation.css";
import "../../src/views/agenda/View.css";
import "../../src/views/month/View.css";
import "../../src/views/time-grid/View.css";
import "./styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("Site root element was not found.");

const page = (
    <StrictMode>
        <App baseUrl={import.meta.env.BASE_URL} />
    </StrictMode>
);

if (root.hasChildNodes()) {
    hydrateRoot(root, page);
} else {
    createRoot(root).render(page);
}
