import Link from "next/link";
import { signOut } from "@/app/auth/actions";

// Shared top navigation bar for all signed-in pages: brand + links + logout.
export default function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          PixelSupport
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/tickets" className="text-gray-600 hover:text-gray-900">
            Tickets
          </Link>
        </nav>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Log out
        </button>
      </form>
    </header>
  );
}
