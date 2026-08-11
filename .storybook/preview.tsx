import type { Decorator, Preview } from "@storybook/react-vite";

import "../src/Calendar.css";
import "../src/components/CalendarNavigation.css";
import "../src/views/agenda/AgendaView.css";
import "../src/views/month/MonthView.css";
import "../src/views/time-grid/TimeGridView.css";
import "../stories/story.css";
import { chronoLaneJsTheme } from "./theme.js";

interface CalendarStoryParameters {
    locale?: string;
    timeZone?: string;
    width?: "content" | "wide";
}

const withCalendarEnvironment: Decorator = (Story, context) => {
    const calendar = (context.parameters.calendar ?? {}) as CalendarStoryParameters;
    const locale = calendar.locale ?? String(context.globals.locale);
    const timeZone = calendar.timeZone ?? String(context.globals.timeZone);

    return (
        <main className={`story-shell story-shell--${calendar.width ?? "wide"}`}>
            {Story({
                args: {
                    ...context.args,
                    locale,
                    timeZone
                }
            })}
        </main>
    );
};

const preview: Preview = {
    decorators: [withCalendarEnvironment],
    tags: ["autodocs"],
    globalTypes: {
        locale: {
            description: "date-fns locale used by the active story",
            toolbar: {
                icon: "globe",
                items: [
                    { value: "en-US", title: "English (United States)" },
                    { value: "en-GB", title: "English (United Kingdom)" },
                    { value: "pt-PT", title: "Portuguese (Portugal)" },
                    { value: "fr-FR", title: "French (France)" },
                    { value: "ja-JP", title: "Japanese (Japan)" }
                ],
                dynamicTitle: true
            }
        },
        timeZone: {
            description: "IANA time zone used for calendar calculations",
            toolbar: {
                icon: "time",
                items: [
                    "Europe/Lisbon",
                    "America/New_York",
                    "Asia/Tokyo",
                    "UTC"
                ],
                dynamicTitle: true
            }
        }
    },
    initialGlobals: {
        locale: "en-US",
        timeZone: "Europe/Lisbon"
    },
    parameters: {
        a11y: {
            test: "error"
        },
        controls: {
            expanded: true,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            },
            sort: "requiredFirst"
        },
        docs: {
            theme: chronoLaneJsTheme,
            toc: true
        },
        layout: "fullscreen",
        options: {
            storySort: {
                order: [
                    "Introduction",
                    "Views",
                    "Scenarios",
                    "Customization"
                ]
            }
        }
    }
};

export default preview;
