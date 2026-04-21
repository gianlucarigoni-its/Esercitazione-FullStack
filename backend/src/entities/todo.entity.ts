export interface Todo {
  id: string;
  title: string;
  dueDate?: Date | null;
  completed: boolean;
}

export interface TodoExtended extends Todo {
  expired: boolean;
}
