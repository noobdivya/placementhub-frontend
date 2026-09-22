import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { THEME_KEY } from "@/lib/theme";

export const metadata: Metadata = {
  title: { default: "Placement Hub", template: "%s · Placement Hub" },
  description: "One place for students, companies and the placement cell to run campus recruitment.",
};

// Runs before first paint: apply the saved theme, falling back to the OS preference.
const themeInit = `try{var t=localStorage.getItem("${THEME_KEY}");if(t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
