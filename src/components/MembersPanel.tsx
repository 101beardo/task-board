"use client";

import { useState } from "react";
import type { Role } from "@/lib/types";
import {
  useChangeMemberRole,
  useInviteMember,
  useMembers,
  useRemoveMember,
} from "@/hooks/use-members";

const ASSIGNABLE_ROLES: Role[] = ["EDITOR", "VIEWER"];

export function MembersPanel({
  boardId,
  onClose,
}: {
  boardId: string;
  onClose: () => void;
}) {
  const { data: members, isPending } = useMembers(boardId, true);
  const invite = useInviteMember(boardId);
  const changeRole = useChangeMemberRole(boardId);
  const removeMember = useRemoveMember(boardId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("EDITOR");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    invite.mutate(
      { email: trimmed, role },
      { onSuccess: () => setEmail("") },
    );
  }

  return (
    <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Members</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Close
        </button>
      </div>

      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email of an existing account"
          aria-label="Invite by email"
          className="min-w-56 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          aria-label="Role for the invited member"
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {r.toLowerCase()}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={invite.isPending}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Invite
        </button>
      </form>
      {invite.isError && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {(invite.error as Error).message}
        </p>
      )}

      <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
        {isPending && (
          <li className="py-2 text-sm text-zinc-500">Loading members...</li>
        )}
        {members?.map((member) => (
          <li
            key={member.userId}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="min-w-0">
              <span className="font-medium">{member.name}</span>{" "}
              <span className="text-zinc-500 dark:text-zinc-400">
                {member.email}
              </span>
            </span>

            {member.role === "OWNER" ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                owner
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) =>
                    changeRole.mutate({
                      userId: member.userId,
                      role: e.target.value as Role,
                    })
                  }
                  aria-label={`Role for ${member.name}`}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.toLowerCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeMember.mutate(member.userId)}
                  className="text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
