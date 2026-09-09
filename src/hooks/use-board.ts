"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardsApi, boardKeys } from "@/lib/api";
import type {
  BoardDetail,
  CreateTaskInput,
  MoveTaskInput,
  Task,
} from "@/lib/types";

const ORDER_STEP = 1000;

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: ({ signal }) => boardsApi.get(boardId, signal),
  });
}

/** Apply the same move logic the server uses, so the optimistic board matches. */
function applyMove(
  board: BoardDetail,
  { id, columnId, beforeId }: MoveTaskInput,
): BoardDetail {
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

export function useCreateTask(boardId: string) {
  const qc = useQueryClient();
  const key = boardKeys.detail(boardId);
  return useMutation({
    mutationFn: (input: CreateTaskInput) => boardsApi.createTask(boardId, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<BoardDetail>(key);
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
        qc.setQueryData<BoardDetail>(key, {
          ...previous,
          tasks: [...previous.tasks, optimistic],
        });
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useMoveTask(boardId: string) {
  const qc = useQueryClient();
  const key = boardKeys.detail(boardId);
  return useMutation({
    mutationFn: (input: MoveTaskInput) => boardsApi.moveTask(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<BoardDetail>(key);
      if (previous) {
        qc.setQueryData<BoardDetail>(key, applyMove(previous, input));
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteTask(boardId: string) {
  const qc = useQueryClient();
  const key = boardKeys.detail(boardId);
  return useMutation({
    mutationFn: (id: string) => boardsApi.deleteTask(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<BoardDetail>(key);
      if (previous) {
        qc.setQueryData<BoardDetail>(key, {
          ...previous,
          tasks: previous.tasks.filter((t) => t.id !== id),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
