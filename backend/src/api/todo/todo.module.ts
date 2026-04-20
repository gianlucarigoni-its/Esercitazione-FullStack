import { Schema, model } from "mongoose";

const todoSchema = new Schema(
  {
    title: { type: String, required: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true },
  },
);

todoSchema.virtual("expired").get(function () {
  const now = new Date();
  if (this.dueDate && this.dueDate < now && this.completed === false)
    return true;
  return false;
});

export const TodoModel = model("Todo", todoSchema);
