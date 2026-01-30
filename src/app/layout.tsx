import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '英语学习助手',
  description: '基于间隔重复的个人英语学习应用',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
