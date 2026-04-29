import { Schema, model } from 'mongoose';
import { Todo } from './todo.entity';

const todoSchema = new Schema<Todo>({
  title: { type: String, required: true },
  dueDate: { type: Date },
  completed: { type: Boolean, default: false },
});

todoSchema.virtual('expired').get(function () {
  const now = new Date();
  if (this.dueDate && this.dueDate < now && this.completed === false) return true;
  return false;
});

todoSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret: any) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

todoSchema.set('toObject', {
  virtuals: true,
  transform: (_, ret: any) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const TodoModel = model<Todo>('Todo', todoSchema);
