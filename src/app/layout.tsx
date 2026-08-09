import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Análise de Investimentos - ETFs, FIIs e Fiagros',
  description: 'Sistema local de cotações, relatórios e automação de downloads do StatusInvest.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-light min-vh-100 py-4" suppressHydrationWarning>
        <main className="container-fluid px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
