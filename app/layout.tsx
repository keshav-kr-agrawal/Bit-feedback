import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stakeholder Feedback System | Institute Vision & Mission',
  description: 'NBA / NAAC Accreditation Stakeholder Feedback System for Institute Vision and Mission formulation.',
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
