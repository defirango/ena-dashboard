import './globals.css';

export const metadata = {
  title: 'ENA Pulse: Ethena Investment Dashboard',
  description: 'Live KPIs and plain-English bullish/bearish signals for tracking Ethena (ENA) as an investment.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </body>
    </html>
  );
}
