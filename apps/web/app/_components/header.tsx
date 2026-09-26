import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <header className="border-b border-black/10 bg-white/85 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex h-16 items-center justify-between w-full max-w-5xl px-6">
        <div className="flex-shrink-0 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-brand/10 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-brand">
                <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 19.5c-4.256 0-7.715-3.444-8.016-7.5h16.032c-.301 4.056-3.76 7.5-8.016 7.5z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-brand">KimiAI Suite</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`${isActive("/") ? "text-brand font-medium" : "text-slate-600 hover:text-slate-900 transition"} text-sm font-medium`}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={`${isActive("/dashboard") ? "text-brand font-medium" : "text-slate-600 hover:text-slate-900 transition"} text-sm font-medium`}
          >
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-green-500/20 rounded-xl flex items-center justify-center">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-slate-600 text-sm">Online</span>
        </div>
      </div>
    </header>
  );
}