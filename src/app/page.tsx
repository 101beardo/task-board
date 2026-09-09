import { Board } from "@/components/Board";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <div>
          <h1 className="text-base font-semibold">Task Board</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Drag cards between columns. Changes apply optimistically and
            reconcile with the server.
          </p>
        </div>
        <a
          href="https://github.com/101beardo/task-board"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Source
        </a>
      </header>
      <Board />
    </div>
  );
}
