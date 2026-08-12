import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.js";
import "../../src/Calendar.css";
import "../../src/components/CalendarNavigation.css";
import "../../src/views/agenda/AgendaView.css";
import "../../src/views/month/MonthView.css";
import "../../src/views/time-grid/TimeGridView.css";
import "./styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("Site root element was not found.");

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>
);
