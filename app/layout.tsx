import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "原神伤害计算器｜面板模拟",
  description:
    "移动端友好的原神角色最终面板计算器，支持角色、武器、圣遗物与额外伤害加成录入。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
