import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Value Educação",
  description: "Plataforma de ensino da Value Educação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
