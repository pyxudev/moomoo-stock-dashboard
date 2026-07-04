import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '株式分析ダッシュボード',
  description: '日本株リアルタイム監視・分析ツール',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
