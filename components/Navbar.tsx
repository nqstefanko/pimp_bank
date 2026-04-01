import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Pimp Bank
        </Link>

        <div className="flex gap-4 text-sm">
          <Link href="/questions">Questions</Link>
          <Link href="/add">Add</Link>
        </div>
      </div>
    </nav>
  );
}