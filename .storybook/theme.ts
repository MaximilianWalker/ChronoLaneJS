import { create } from "storybook/theming";

import { siteMetadata } from "../site/src/siteMetadata.js";

/** Shared ChronoLaneJS theme for the Storybook manager and generated docs. */
export const chronoLaneJsTheme = create({
    base: "light",
    brandTitle: "ChronoLaneJS",
    brandUrl: siteMetadata.url,
    brandTarget: "_self",
    colorPrimary: "#1d4ed8",
    colorSecondary: "#0f766e"
});
