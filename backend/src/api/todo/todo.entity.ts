export interface Todo {
  id: string;
  title: string;
  dueDate?: Date | null;
  completed: boolean;
  expired: boolean;
}
