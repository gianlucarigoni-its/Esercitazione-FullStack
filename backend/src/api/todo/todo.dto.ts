export interface ShowCompletedTodoDto {
  showCompleted?: string;
}

export interface AddTodoDto {
  title: string;
  dueDate?: Date;
}
