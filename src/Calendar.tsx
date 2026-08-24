"use client";

import { Suspense } from "react";
import type {
    ComponentProps,
    ElementType,
    ReactElement,
    ReactNode
} from "react";
import {
    DEFAULT_CALENDAR_LOCALE,
    readCalendarLocale
} from "./core/locale.js";
import {
    defaultCalendarFormatters,
    defaultCalendarMessages
} from "./core/localization.js";
import { defaultCalendarViews } from "./viewRegistry.js";
import type {
    CalendarEvent,
    CalendarFormatters,
    CalendarLocale,
    CalendarMessages,
    CalendarStyle,
    CalendarViewDefinition,
    SharedViewProps
} from "./types.js";
import type { ViewProps as AgendaViewProps } from "./views/agenda/types.js";
import type { ViewProps as MonthViewProps } from "./views/month/types.js";
import type { ViewProps as TimeGridViewProps } from "./views/time-grid/types.js";

const EMPTY_EVENTS: never[] = [];
const EMPTY_PROPS = /* @__PURE__ */ Object.freeze({});
const EMPTY_VIEWS: CalendarViewRegistry = /* @__PURE__ */ Object.freeze({});

/** A component or component definition registered under an application view name. */
export type CalendarViewRegistration = ElementType | CalendarViewDefinition;

/** Application-defined views accepted by the root `Calendar` component. */
export type CalendarViewRegistry = Record<string, CalendarViewRegistration>;

interface RootProps {
    className?: string;
    style?: CalendarStyle;
    localeFallback?: ReactNode;
}

interface BuiltInViewProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    agenda: AgendaViewProps<Event>;
    day: TimeGridViewProps<Event, Resource>;
    month: MonthViewProps<Event>;
    "time-grid": TimeGridViewProps<Event, Resource>;
    week: TimeGridViewProps<Event, Resource>;
}

export type CalendarBuiltInView = keyof BuiltInViewProps;
type SharedProps<
    Event extends CalendarEvent,
    Resource
> = Omit<
    SharedViewProps<Event, Resource>,
    "className" | "style" | "viewName"
>;
type ForwardedSharedProps<
    Event extends CalendarEvent,
    Resource
> = Omit<
    SharedProps<Event, Resource>,
    "events" | "backgroundEvents" | "locale" | "formatters" | "messages"
>;
type DisallowedViewProps = keyof SharedViewProps | keyof RootProps | "viewName";
type ViewProps<Props> = Omit<
    Props,
    DisallowedViewProps
> & Partial<Record<DisallowedViewProps, never>>;

/** Configuration accepted by one selected built-in calendar view. */
export type CalendarViewProps<
    View extends CalendarBuiltInView,
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> = ViewProps<BuiltInViewProps<Event, Resource>[View]>;

type BuiltInBranch<
    View extends CalendarBuiltInView,
    Event extends CalendarEvent,
    Resource
> = RootProps
    & SharedProps<Event, Resource>
    & {
        viewProps?: Partial<CalendarViewProps<View, Event, Resource>>;
        views?: CalendarViewRegistry;
    }
    & (View extends "week" ? { view?: View } : { view: View });

type BuiltInProps<
    Event extends CalendarEvent,
    Resource
> = {
    [View in CalendarBuiltInView]: BuiltInBranch<View, Event, Resource>
}[CalendarBuiltInView];

type RegisteredViewProps<Registration> = Registration extends {
    component: infer Component extends ElementType;
}
    ? ComponentProps<Component>
    : Registration extends ElementType
        ? ComponentProps<Registration>
        : never;

type ValidatedViewRegistration<Registration> = Registration extends {
    component: infer Component extends ElementType;
}
    ? Registration & {
        component: Component;
        defaultProps?: Partial<ComponentProps<Component>>;
    }
    : Registration extends ElementType
        ? Registration
        : never;

type ValidatedViewRegistry<Views extends CalendarViewRegistry> = {
    [View in keyof Views]: ValidatedViewRegistration<Views[View]>;
};

type CustomViewProps<Registration> = ViewProps<RegisteredViewProps<Registration>>;

type CustomProps<
    Event extends CalendarEvent,
    Resource,
    Views extends CalendarViewRegistry
> = {
    [View in keyof Views & string]: RootProps
        & SharedProps<Event, Resource>
        & {
            view: View;
            views: Views & ValidatedViewRegistry<Views>;
            viewProps?: Partial<CustomViewProps<Views[View]>>;
        }
}[keyof Views & string];

type UnionKeys<Union> = Union extends Union ? keyof Union : never;
type StrictUnion<Union, All = Union> = Union extends Union
    ? Union & Partial<Record<Exclude<UnionKeys<All>, keyof Union>, never>>
    : never;

/**
 * Props accepted by the root `Calendar` component.
 *
 * @remarks
 * Built-in views form a discriminated union keyed by `view`; omitting `view`
 * selects the `week` contract. Supplying an application registry as the third
 * generic argument adds branches whose names and `viewProps` are inferred from
 * the registered components.
 */
export type CalendarProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown,
    Views extends CalendarViewRegistry | undefined = undefined
> = StrictUnion<BuiltInProps<Event, Resource>>
    | (Views extends CalendarViewRegistry
        ? StrictUnion<CustomProps<Event, Resource, Views>>
        : never);

interface ViewSelection {
    component: ElementType;
    defaultProps: object;
    viewProps: object;
    name: string;
}

interface ViewLocalization {
    locale: CalendarLocale;
    formatters: CalendarFormatters;
    messages: CalendarMessages;
}

interface ViewInput<
    Event extends CalendarEvent,
    Resource
> {
    sharedProps: ForwardedSharedProps<Event, Resource>;
    events: Event[];
    backgroundEvents: Event[];
}

interface ResolvedViewProps<
    Event extends CalendarEvent,
    Resource
> {
    selection: ViewSelection;
    localization: ViewLocalization;
    input: ViewInput<Event, Resource>;
}

/**
 * Resolves a locale inside `Suspense` and applies the ordered prop layers to a
 * registered view component.
 */
const ResolvedView = <Event extends CalendarEvent, Resource>({
    selection,
    localization,
    input
}: ResolvedViewProps<Event, Resource>) => {
    const ViewComponent = selection.component;

    return (
        <ViewComponent
            {...input.sharedProps}
            {...selection.defaultProps}
            {...selection.viewProps}
            locale={readCalendarLocale(localization.locale)}
            formatters={localization.formatters}
            messages={localization.messages}
            events={input.events}
            backgroundEvents={input.backgroundEvents}
            viewName={selection.name}
        />
    );
};

/** Distinguishes a view registration with defaults from a bare component. */
const isViewDefinition = (
    value: CalendarViewRegistration
): value is CalendarViewDefinition => (
    typeof value === "object" && value !== null && "component" in value
);

/**
 * Renders the selected calendar view from the built-in and caller-provided
 * view registries.
 *
 * @remarks
 * Caller-provided views override built-ins with the same name. View props are
 * merged in this order: shared calendar props, registered defaults, explicit
 * `viewProps`, and finally events, the resolved locale, and the root
 * localization registries. Named locales may suspend while their date-fns
 * module loads.
 *
 * @throws Error if the requested view is not registered.
 */
export default function Calendar<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown,
    Views extends CalendarViewRegistry | undefined = undefined
>({
    className,
    style,
    view = "week",
    views = EMPTY_VIEWS,
    viewProps = EMPTY_PROPS,
    events = EMPTY_EVENTS,
    backgroundEvents = EMPTY_EVENTS,
    locale = DEFAULT_CALENDAR_LOCALE,
    formatters = defaultCalendarFormatters,
    messages = defaultCalendarMessages,
    localeFallback = null,
    date,
    defaultDate,
    timeZone,
    minDate,
    maxDate,
    showControls,
    selectedEventIds,
    canSelectEvent,
    canOpenEvent,
    onDateChange,
    onRangeChange,
    onEventSelect,
    onEventOpen,
    eventInteractions
}: CalendarProps<Event, Resource, Views>): ReactElement {
    const sharedProps: ForwardedSharedProps<Event, Resource> = {
        date,
        defaultDate,
        timeZone,
        minDate,
        maxDate,
        showControls,
        selectedEventIds,
        canSelectEvent,
        canOpenEvent,
        onDateChange,
        onRangeChange,
        onEventSelect,
        onEventOpen,
        eventInteractions
    };
    const registeredViews: CalendarViewRegistry = views ?? EMPTY_VIEWS;
    const builtInView = view in defaultCalendarViews
        ? defaultCalendarViews[view]
        : undefined;
    const viewDefinition = registeredViews[view] ?? builtInView;
    if (!viewDefinition) {
        throw new Error(`Calendar view "${view}" is not registered.`);
    }

    const ViewComponent = isViewDefinition(viewDefinition)
        ? viewDefinition.component
        : viewDefinition;
    const defaultViewProps = isViewDefinition(viewDefinition)
        ? viewDefinition.defaultProps ?? EMPTY_PROPS
        : EMPTY_PROPS;

    return (
        <div
            className={`calendar ${className ?? ""}`.trim()}
            data-calendar-view={view}
            style={style}
        >
            <Suspense fallback={localeFallback as ReactNode}>
                <ResolvedView
                    selection={{
                        component: ViewComponent,
                        defaultProps: defaultViewProps,
                        viewProps,
                        name: view
                    }}
                    localization={{ locale, formatters, messages }}
                    input={{ sharedProps, events, backgroundEvents }}
                />
            </Suspense>
        </div>
    );
}
