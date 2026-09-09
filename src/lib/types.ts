export type Role = "OWNER" | "EDITOR" | "VIEWER";

/** OWNER and EDITOR may mutate the board; VIEWER is read-only. */
export function canWrite(role: Role): boolean {
  return role === "OWNER" || role === "EDITOR";
}

export interface Column {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  columnId: string;
  /** Fractional rank used to order tasks within a column without renumbering. */
  order: number;
  createdAt: string;
}

export interface BoardSummary {
  id: string;
  name: string;
  role: Role;
  taskCount: number;
}

export interface BoardDetail {
  id: string;
  name: string;
  /** The requesting user's role on this board. */
  role: Role;
  columns: Column[];
  tasks: Task[];
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface CreateBoardInput {
  name: string;
}

export interface CreateTaskInput {
  title: string;
  columnId: string;
}

export interface MoveTaskInput {
  id: string;
  columnId: string;
  /** Place the task immediately before this task. Omit to append to the column. */
  beforeId?: string | null;
}

export interface InviteMemberInput {
  email: string;
  role: Role;
}
