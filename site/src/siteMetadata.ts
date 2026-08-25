export const siteMetadata = {
    basePath: "/ChronoLaneJS/",
    currentRelease: "2.1.0",
    description: "ChronoLaneJS is an open-source React and TypeScript calendar and scheduler with accessible views, resources, event interactions, and timezone support.",
    googleSiteVerification: "bh455Nkz60AYweBxUjMfogi_styVUmuiwyNYAAd_cbA",
    socialDescription: "An open-source React and TypeScript calendar and scheduler with accessible views, resources, event interactions, and timezone support.",
    title: "ChronoLaneJS — React Calendar and Scheduler for TypeScript",
    socialTitle: "ChronoLaneJS — React Calendar and Scheduler",
    url: "https://maximilianwalker.github.io/ChronoLaneJS/"
} as const;

export const createPublicUrl = (route = ""): string => new URL(
    route,
    siteMetadata.url
).href;
