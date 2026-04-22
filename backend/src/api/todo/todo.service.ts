import { QueryFilter } from 'mongoose';
import { IdParams } from '../../utils/id-params';
import { Todo } from './../../entities/todo.entity';
import { AddTodoDto, ShowCompletedDto } from './todo.dto';
import { TodoModel } from './todo.module';

export class TodoSrv {
  async find(filter: ShowCompletedDto): Promise<Todo[]> {
    const query: QueryFilter<Todo> = {};

    if (filter.showCompleted !== 'true') query.completed = false;

    const res = await TodoModel.find(query);
    return res;
  }

  async add(params: AddTodoDto): Promise<Todo> {
    const toAdd = { ...params, completed: false };
    const res = await TodoModel.create(toAdd);
    return res;
  }

  async check(id: IdParams): Promise<Todo | null> {
    const todo = await TodoModel.findOne({ _id: id.id });
    if (todo && todo.completed === false) {
      todo.completed = true;
      return await todo!.save();
    }
    return null;
  }

  async uncheck(id: IdParams): Promise<Todo | null> {
    const todo = await TodoModel.findOne({ _id: id.id });
    if (todo && todo.completed === true) {
      todo.completed = false;
      return await todo.save();
    }
    return null;
  }
}

export default new TodoSrv();
