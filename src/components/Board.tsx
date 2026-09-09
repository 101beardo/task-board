"use client";

import { useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBoard, useCreateTask, useDeleteTask, useMoveTask } from "@/hooks/use-board";
import type { Task } from "@/lib/types";
import { useBoardUi } from "@/store/board-ui";
import { Column } from "./Column";

function byOrder(a: Task, b: Task) {
  return a.order - b.order;
}

export function Board() {
  const { data, isPending, isError, error, refetch } = useBoard();
  const createTask = useCreateTask();
  const moveTask = useMoveTask();
  const deleteTask = useDeleteTask();
  const { activeTaskId, setActiveTaskId } = useBoardUi();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const column of data?.columns ?? []) map.set(column.id, []);
    for (const task of data?.tasks ?? []) {
      map.get(task.columnId)?.push(task);
    }
    for (const list of map.values()) list.sort(byOrder);
    return map;
  }, [data]);

  const activeTask = data?.tasks.find((t) => t.id === activeTaskId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over || !data) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const moved = data.tasks.find((t) => t.id === activeId);
    if (!moved) return;

    const overType = over.data.current?.type as "task" | "column" | undefined;

    if (overType === "column") {
      if (moved.columnId === overId) return;
      moveTask.mutate({ id: activeId, columnId: overId, beforeId: null });
      return;
    }

    // Dropped on another task: land in that task's column, just before it.
    const overTask = data.tasks.find((t) => t.id === overId);
    if (!overTask || overTask.id === activeId) return;

    const siblings = data.tasks
      .filter((t) => t.columnId === overTask.columnId && t.id !== activeId)
      .sort(byOrder);
    const overIndex = siblings.findIndex((t) => t.id === overTask.id);
    const activeIndex = siblings.findIndex((t) => t.order > moved.order);

    // If dragging downward within the same column, insert after the target.
    const draggingDown =
      moved.columnId === overTask.columnId &&
      activeIndex !== -1 &&
      activeIndex <= overIndex;
    const beforeId = draggingDown
      ? (siblings[overIndex + 1]?.id ?? null)
      : overTask.id;

    if (moved.columnId === overTask.columnId && beforeId === activeId) return;

    moveTask.mutate({ id: activeId, columnId: overTask.columnId, beforeId });
  }

  if (isPending) {
    return (
      <div className="flex gap-4 overflow-x-auto p-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-72 w-72 flex-none animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900/50"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        <p className="font-medium">Could not load the board.</p>
        <p className="mt-1 text-red-600 dark:text-red-400">{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTaskId(null)}
    >
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {data.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasksByColumn.get(column.id) ?? []}
            onCreate={(title, columnId) => createTask.mutate({ title, columnId })}
            onDelete={(id) => deleteTask.mutate(id)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-64 rotate-2 rounded-lg border border-zinc-300 bg-white p-3 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {activeTask.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
