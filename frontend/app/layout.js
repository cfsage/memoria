// frontend/app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Step 1: Import the AuthProvider we created
import { AuthProvider } from "../context/AuthContext";

// Your existing font setup (preserved)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Updated metadata for the Memoria project
export const metadata = {
  title: "Memoria",
  description: "Record a story. Preserve a legacy.",
};

// The Root Layout for your entire application
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        // Your existing classNames for fonts (preserved)
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/*
          Step 2: Wrap the application's children with the AuthProvider.
          This makes the authentication context available to every page,
          while keeping your specific font styles intact.
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}