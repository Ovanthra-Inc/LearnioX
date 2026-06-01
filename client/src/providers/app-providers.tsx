"use client";

import { ReactQueryProvider } from "./query-client";
import { ReduxProvider } from "./redux-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <ReactQueryProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </ReactQueryProvider>
    </ReduxProvider>
  );
}
