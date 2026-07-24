import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "原神伤害计算器｜面板模拟",
  description:
    "单角色、单目标的原神面板与代表技能伤害计算器，支持多方案、武器精炼、圣遗物套装与反应条件。",
  openGraph: {
    title: "原神伤害计算器｜面板与技能伤害",
    description:
      "实时计算最终面板、代表技能伤害、防御抗性倍率与元素反应。",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "原神伤害计算器：面板与技能伤害",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "原神伤害计算器｜面板与技能伤害",
    description:
      "实时计算最终面板、代表技能伤害、防御抗性倍率与元素反应。",
    images: ["/og.png"],
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
