"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardsApi, boardKeys } from "@/lib/api";

export function useBoards() {
  return useQuery({
    queryKey: boardKeys.lists,
    queryFn: ({ signal }) => boardsApi.list(signal),
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => boardsApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.lists }),
  });
}
