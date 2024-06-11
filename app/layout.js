import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Head from "next/head";
import fav from "../public/favicon.ico";

export const metadata = {
  title: "Code Quest",
  description: "Best Coding platform for all your needs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href={fav} />
      </Head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
