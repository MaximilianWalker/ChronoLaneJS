"use client";

import { useState } from "react";

import Calendar from "@chronolanejs/react";
import type { CalendarDateInput, CalendarEvent } from "@chronolanejs/react";

const initialEvents: CalendarEvent[] = [{
    id: "planning",
    title: "Planning",
    start: "2026-09-14T09:00:00",
    end: "2026-09-14T10:00:00",
    color: "#2563eb"
}];

export default function Schedule() {
    const [date, setDate] = useState<CalendarDateInput>("2026-09-14");
    const [selectedEventIds, setSelectedEventIds] = useState<Array<string | number>>([]);

    return (
        <Calendar
            date={date}
            onDateChange={setDate}
            events={initialEvents}
            selectedEventIds={selectedEventIds}
            onEventSelect={(event) => {
                if (event.id != null) setSelectedEventIds([event.id]);
            }}
            viewProps={{ minTime: "08:00", maxTime: "18:00" }}
        />
    );
}
