import { NextFunction, Response } from 'express';
import { AlreadyCheckedError } from '../../errors/already-checked.error';
import { NotFoundError } from '../../errors/not-foud.error';
import { IdParams } from '../../utils/id-params';
import { TypedRequest } from './../../utils/typed-request';
import { AddTodoDto, ShowCompletedDto } from './todo.dto';
import { CheckResult } from './todo.enums';
import todoSrv from './todo.service';

export async function getTodoList(
  req: TypedRequest<any, ShowCompletedDto>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await todoSrv.find(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addTodo(req: TypedRequest<AddTodoDto>, res: Response, next: NextFunction) {
  try {
    const result = await todoSrv.add(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function checkTodo(
  req: TypedRequest<any, any, IdParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await todoSrv.check(req.params);
    if (result === CheckResult.NotFound) throw new NotFoundError();
    else if (result === CheckResult.AlreadyDone) throw new AlreadyCheckedError();
    else res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function uncheckTodo(
  req: TypedRequest<any, any, IdParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await todoSrv.uncheck(req.params);
    if (result === CheckResult.NotFound) throw new NotFoundError();
    else if (result === CheckResult.AlreadyDone) throw new AlreadyCheckedError();
    else res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
