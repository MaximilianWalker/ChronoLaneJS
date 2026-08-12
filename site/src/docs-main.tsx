import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import DocsPage from "./DocsPage.js";
import "./styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("Documentation root element was not found.");

createRoot(root).render(
    <StrictMode>
        <DocsPage />
    </StrictMode>
);
