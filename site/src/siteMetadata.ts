export const siteMetadata = {
    basePath: "/ChronoLaneJS/",
    description: "ChronoLaneJS is an open-source React and TypeScript calendar and scheduler with accessible views, resources, event interactions, and timezone support.",
    socialDescription: "An open-source React and TypeScript calendar and scheduler with accessible views, resources, event interactions, and timezone support.",
    title: "ChronoLaneJS — React Calendar and Scheduler for TypeScript",
    socialTitle: "ChronoLaneJS — React Calendar and Scheduler",
    url: "https://maximilianwalker.github.io/ChronoLaneJS/"
} as const;

export const createPublicUrl = (route = ""): string => new URL(
    route,
    siteMetadata.url
).href;
