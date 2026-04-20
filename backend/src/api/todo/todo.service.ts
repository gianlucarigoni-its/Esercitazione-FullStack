import { CompletedTodoDto } from "./todo.dto";
import { TodoModel } from "./todo.module";
import { TodoDocument } from "./../../entities/todo.entity";
import { QueryFilter } from "mongoose";

export class TodoSrv {
  async find(filter: CompletedTodoDto): Promise<any[]> {
    const query: QueryFilter<TodoDocument> = {};

    if (filter.showCompleted !== "true") query.completed = false;

    const res = await TodoModel.find(query);
    return res;
  }
}

export default new TodoSrv();
