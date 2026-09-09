"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi, boardKeys } from "@/lib/api";
import type { Board, CreateTaskInput, MoveTaskInput, Task } from "@/lib/types";

const ORDER_STEP = 1000;

export function useBoard() {
  return useQuery({
    queryKey: boardKeys.all,
    queryFn: ({ signal }) => boardApi.get(signal),
  });
}

/** Apply the same move logic the server uses, so the optimistic board matches. */
function applyMove(board: Board, { id, columnId, beforeId }: MoveTaskInput): Board {
  const task = board.tasks.find((t) => t.id === id);
  if (!task) return board;

  const siblings = board.tasks
    .filter((t) => t.columnId === columnId && t.id !== id)
    .sort((a, b) => a.order - b.order);

  let order: number;
  if (!beforeId) {
    order = (siblings.at(-1)?.order ?? 0) + ORDER_STEP;
  } else {
    const idx = siblings.findIndex((t) => t.id === beforeId);
    if (idx === -1) {
      order = (siblings.at(-1)?.order ?? 0) + ORDER_STEP;
    } else {
      const before = siblings[idx];
      const prev = siblings[idx - 1];
      order = prev ? (prev.order + before.order) / 2 : before.order / 2;
    }
  }

  return {
    ...board,
    tasks: board.tasks.map((t) =>
      t.id === id ? { ...t, columnId, order } : t,
    ),
  };
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => boardApi.createTask(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: boardKeys.all });
      const previous = qc.getQueryData<Board>(boardKeys.all);
      if (previous) {
        const maxOrder = previous.tasks
          .filter((t) => t.columnId === input.columnId)
          .reduce((m, t) => Math.max(m, t.order), 0);
        const optimistic: Task = {
          id: `optimistic-${crypto.randomUUID()}`,
          title: input.title,
          columnId: input.columnId,
          order: maxOrder + ORDER_STEP,
          createdAt: new Date().toISOString(),
        };
        qc.setQueryData<Board>(boardKeys.all, {
          ...previous,
          tasks: [...previous.tasks, optimistic],
        });
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(boardKeys.all, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MoveTaskInput) => boardApi.moveTask(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: boardKeys.all });
      const previous = qc.getQueryData<Board>(boardKeys.all);
      if (previous) {
        qc.setQueryData<Board>(boardKeys.all, applyMove(previous, input));
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(boardKeys.all, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => boardApi.deleteTask(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: boardKeys.all });
      const previous = qc.getQueryData<Board>(boardKeys.all);
      if (previous) {
        qc.setQueryData<Board>(boardKeys.all, {
          ...previous,
          tasks: previous.tasks.filter((t) => t.id !== id),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(boardKeys.all, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  });
}
