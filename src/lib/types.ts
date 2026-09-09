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

export interface Board {
  columns: Column[];
  tasks: Task[];
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
