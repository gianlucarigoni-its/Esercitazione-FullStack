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

todoSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret: any) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const TodoModel = model("Todo", todoSchema);
