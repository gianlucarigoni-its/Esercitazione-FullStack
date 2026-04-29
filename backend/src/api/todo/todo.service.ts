import { QueryFilter } from 'mongoose';
import { IdParams } from '../../utils/id-params';
import { AddTodoDto, ShowCompletedDto } from './todo.dto';
import { Todo } from './todo.entity';
import { CheckResult } from './todo.enums';
import { TodoModel } from './todo.model';

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

  async check(id: IdParams): Promise<Todo | CheckResult> {
    const todo = await TodoModel.findOne({ _id: id.id });
    if (todo && todo.completed === false) {
      todo.completed = true;
      return await todo!.save();
    } else if (todo && todo.completed === true) {
      return CheckResult.AlreadyDone;
    }
    return CheckResult.NotFound;
  }

  async uncheck(id: IdParams): Promise<Todo | CheckResult> {
    const todo = await TodoModel.findOne({ _id: id.id });
    if (todo && todo.completed === true) {
      todo.completed = false;
      return await todo.save();
    } else if (todo && todo.completed === false) {
      return CheckResult.AlreadyDone;
    }
    return CheckResult.NotFound;
  }
}

export default new TodoSrv();
