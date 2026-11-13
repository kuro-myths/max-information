import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAX Information — AI Usage Intelligence",
  description: "Centralized telemetry and analytics for 9Router and OpenAI-compatible AI gateways."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}