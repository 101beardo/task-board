"use client";

import { useState } from "react";
import Link from "next/link";
import { useBoards, useCreateBoard } from "@/hooks/use-boards";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export function BoardList() {
  const { data: boards, isPending, isError, error, refetch } = useBoards();
  const createBoard = useCreateBoard();
  const [name, setName] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createBoard.mutate(trimmed, { onSuccess: () => setName("") });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <h1 className="text-lg font-semibold">Your boards</h1>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New board name"
          aria-label="New board name"
          maxLength={80}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={createBoard.isPending}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Create
        </button>
      </form>
      {createBoard.isError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {(createBoard.error as Error).message}
        </p>
      )}

      <div className="mt-6 space-y-2">
        {isPending &&
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900/60"
            />
          ))}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {(error as Error).message}
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 underline"
            >
              Retry
            </button>
          </div>
        )}

        {boards?.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No boards yet. Create one above.
          </p>
        )}

        {boards?.map((board) => (
          <Link
            key={board.id}
            href={`/b/${board.id}`}
            className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <span className="font-medium">{board.name}</span>
            <span className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                {board.taskCount} {board.taskCount === 1 ? "task" : "tasks"}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                {ROLE_LABEL[board.role]}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
