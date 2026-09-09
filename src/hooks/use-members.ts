"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardsApi, boardKeys } from "@/lib/api";
import type { Role } from "@/lib/types";

export function useMembers(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: boardKeys.members(boardId),
    queryFn: ({ signal }) => boardsApi.listMembers(boardId, signal),
    enabled,
  });
}

export function useInviteMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: Role }) =>
      boardsApi.inviteMember(boardId, email, role),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: boardKeys.members(boardId) }),
  });
}

export function useChangeMemberRole(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      boardsApi.changeMemberRole(boardId, userId, role),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: boardKeys.members(boardId) }),
  });
}

export function useRemoveMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => boardsApi.removeMember(boardId, userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: boardKeys.members(boardId) }),
  });
}
