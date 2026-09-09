"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface AppHeaderProps {
  userName: string;
  /** Extra content shown between the title and the user menu. */
  children?: React.ReactNode;
}

export function AppHeader({ userName, children }: AppHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
      <Link href="/" className="text-base font-semibold">
        Task Board
      </Link>

      <div className="flex flex-1 items-center justify-end gap-3">
        {children}
        <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">
          {userName}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
