import { ShowCompletedTodoDto, AddTodoDto } from "./todo.dto";
import { idParams } from "../../utils/id-params";
import { TodoModel } from "./todo.module";
import { Todo, TodoExtended } from "./../../entities/todo.entity";
import { QueryFilter } from "mongoose";

export class TodoSrv {
  async find(filter: ShowCompletedTodoDto): Promise<Todo[]> {
    const query: QueryFilter<Todo[]> = {};

    if (filter.showCompleted !== "true") query.completed = false;

    const res = await TodoModel.find(query);
    return res;
  }

  async add(params: AddTodoDto): Promise<Todo> {
    const toAdd = { ...params, completed: false };
    const res = await TodoModel.create(toAdd);
    return res;
  }

  async check(id: idParams): Promise<Todo | null> {
    const todo = await TodoModel.findOne({ _id: id.id });
    if (todo && todo.completed === false) {
      todo.completed = true;
      return await todo!.save();
    }
    return null;
  }

  async uncheck(id: idParams): Promise<Todo | null> {
    const todo = await TodoModel.findOne({ _id: id.id });
    if (todo && todo.completed === true) {
      todo.completed = false;
      return await todo.save();
    }
    return null;
  }
}

export default new TodoSrv();
