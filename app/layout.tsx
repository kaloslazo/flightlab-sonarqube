import type { Metadata } from 'next';
import { Lato, Sora } from 'next/font/google';
import './globals.css';

const lato = Lato({ variable: '--font-lato', subsets: ['latin'], weight: ['400', '700', '900'] });
const sora = Sora({ variable: '--font-sora', subsets: ['latin'], weight: ['300', '700', '800'] });

export const metadata: Metadata = {
  title: 'FlightLab - Reservas de vuelos',
  description: 'Prototipo académico para prácticas de pruebas y análisis estático con SonarQube.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${lato.variable} ${sora.variable}`}>{children}</body>
    </html>
  );
}
