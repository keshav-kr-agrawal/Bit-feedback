import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bangalore Institute of Technology | Feedback Portal',
  description: 'Stakeholder Feedback System - An Autonomous Institution under VTU, Belagavi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8F9FB] text-slate-800 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
