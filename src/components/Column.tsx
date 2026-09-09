"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Column as ColumnType, Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onCreate: (title: string, columnId: string) => void;
  onDelete: (id: string) => void;
}

export function Column({ column, tasks, onCreate, onDelete }: ColumnProps) {
  const [title, setTitle] = useState("");
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed, column.id);
    setTitle("");
  }

  return (
    <section className="flex w-72 flex-none flex-col rounded-xl bg-zinc-100/70 dark:bg-zinc-900/50">
      <header className="flex items-center justify-between px-3 py-2.5">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {column.name}
        </h2>
        <span className="rounded-full bg-zinc-200 px-1.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {tasks.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={[
          "flex min-h-16 flex-1 flex-col gap-2 px-2 pb-2 transition-colors",
          isOver ? "rounded-lg bg-indigo-500/10" : "",
        ].join(" ")}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="px-1 py-3 text-xs text-zinc-400 dark:text-zinc-600">
            Drop a task here
          </p>
        )}
      </div>

      <form onSubmit={submit} className="p-2 pt-1">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task"
          aria-label={`Add a task to ${column.name}`}
          className="w-full rounded-lg border border-transparent bg-white/70 px-2.5 py-1.5 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white dark:bg-zinc-900/70 dark:text-zinc-100 dark:focus:bg-zinc-900"
        />
      </form>
    </section>
  );
}
