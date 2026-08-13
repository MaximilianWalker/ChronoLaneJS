import type { ReactNode } from "react";

import "@chronolanejs/react/styles.css";
import "./styles.css";

export default function RootLayout({ children }: { children: ReactNode }) {
    return <html lang="en"><body>{children}</body></html>;
}
