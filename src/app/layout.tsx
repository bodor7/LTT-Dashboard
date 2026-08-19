import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

/**
 * Cairo متغيّر ويغطّي المحرف العربي. next/font يستضيفه ذاتياً وقت البناء،
 * فلا يُرسل المتصفح أي طلب إلى Google عند فتح الصفحة.
 */
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "رادار مغادرة العملاء",
  description:
    "لوحة تحكم عربية للتنبؤ باحتمال مغادرة عملاء LTT — بيانات تدريبية اصطناعية.",
};

/**
 * نوع صريح بدل `LayoutProps<"/">` المُولَّد من Next داخل `.next/types`،
 * حتى يعمل `tsc --noEmit` على نسخة جديدة من المستودع قبل أول بناء.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
