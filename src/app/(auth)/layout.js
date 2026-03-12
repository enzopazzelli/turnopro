import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">{APP_NAME}</span>
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg px-4 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
