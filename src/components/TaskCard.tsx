"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  readOnly: boolean;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, readOnly, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: "task", task }, disabled: readOnly });

  const pending = task.id.startsWith("optimistic-");

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={[
        "group relative rounded-lg border bg-white p-3 text-sm shadow-sm",
        "border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900",
        isDragging ? "opacity-40" : "",
        pending ? "opacity-60" : "",
      ].join(" ")}
    >
      {readOnly ? (
        <p className="leading-snug text-zinc-800 dark:text-zinc-100">
          {task.title}
        </p>
      ) : (
        <button
          type="button"
          className="flex-1 cursor-grab touch-none text-left leading-snug text-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:cursor-grabbing dark:text-zinc-100"
          {...attributes}
          {...listeners}
        >
          {task.title}
        </button>
      )}

      {!readOnly && !pending && (
        <button
          type="button"
          aria-label={`Delete "${task.title}"`}
          onClick={() => onDelete(task.id)}
          className="absolute right-1.5 top-1.5 rounded p-1 text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-zinc-800"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
