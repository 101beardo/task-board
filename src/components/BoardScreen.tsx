"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Board } from "@/components/Board";
import { MembersPanel } from "@/components/MembersPanel";
import { useBoard } from "@/hooks/use-board";

interface BoardScreenProps {
  boardId: string;
  userName: string;
}

export function BoardScreen({ boardId, userName }: BoardScreenProps) {
  const { data } = useBoard(boardId);
  const [membersOpen, setMembersOpen] = useState(false);
  const isOwner = data?.role === "OWNER";

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader userName={userName}>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Boards
        </Link>
        {data && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-sm font-medium">{data.name}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {data.role.toLowerCase()}
            </span>
          </>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={() => setMembersOpen((v) => !v)}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Members
          </button>
        )}
      </AppHeader>

      {isOwner && membersOpen && (
        <MembersPanel boardId={boardId} onClose={() => setMembersOpen(false)} />
      )}

      <Board boardId={boardId} />
    </div>
  );
}
