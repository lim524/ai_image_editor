import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  Black_Han_Sans,
  Do_Hyeon,
  Gaegu,
  Gothic_A1,
  Gowun_Batang,
  Jua,
  Nanum_Gothic,
  Nanum_Myeongjo,
  Noto_Sans_KR,
  Poor_Story,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const nanumGothic = Nanum_Gothic({
  variable: "--font-nanum-gothic",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-nanum-myeongjo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const gothicA1 = Gothic_A1({
  variable: "--font-gothic-a1",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jua = Jua({
  variable: "--font-jua",
  subsets: ["latin"],
  weight: "400",
});

const poorStory = Poor_Story({
  variable: "--font-poor-story",
  subsets: ["latin"],
  weight: "400",
});

const gaegu = Gaegu({
  variable: "--font-gaegu",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const doHyeon = Do_Hyeon({
  variable: "--font-do-hyeon",
  subsets: ["latin"],
  weight: "400",
});

const blackHanSans = Black_Han_Sans({
  variable: "--font-black-han-sans",
  subsets: ["latin"],
  weight: "400",
});

const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  notoSansKr.variable,
  nanumGothic.variable,
  nanumMyeongjo.variable,
  gothicA1.variable,
  jua.variable,
  poorStory.variable,
  gaegu.variable,
  doHyeon.variable,
  blackHanSans.variable,
  gowunBatang.variable,
].join(" ");

export const metadata: Metadata = {
  title: "AI 웹툰 에디터",
  description: "AI 이미지를 편집하고 웹툰·만화를 만드는 브라우저 에디터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-neutral-100 font-sans">
        {children}
      </body>
    </html>
  );
}
