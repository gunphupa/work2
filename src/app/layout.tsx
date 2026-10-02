import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Header, Footer } from '@/components/shell';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/noto-sans-thai';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'FixFlow — Find the cause. Find your next step.', template: '%s | FixFlow' },
  description:
    'Guided Windows troubleshooting that adapts to your answers. Diagnose before fixing, with clear checks in English and Thai.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to content / ข้ามไปเนื้อหา
          </a>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
