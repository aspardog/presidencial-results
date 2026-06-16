import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Dashboard Electoral Colombia 2026',
  description: 'Visualización interactiva de resultados electorales presidenciales',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gb-bg font-body text-gb-ink">
        {children}
      </body>
    </html>
  );
}
