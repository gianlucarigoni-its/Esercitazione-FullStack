import { Router } from "express";
import {
  getTodoList,
  addTodo,
  checkTodo,
  uncheckTodo,
} from "./todo/todo.controller";

const router = Router();

router.get("/todos", getTodoList);
router.post("/todos", addTodo);
router.patch("/todos/:id/check", checkTodo);
router.patch("/todos/:id/uncheck", uncheckTodo);

export default router;
