export interface TodoDocument {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
}

export interface Todo extends TodoDocument {
  expired: boolean;
}
