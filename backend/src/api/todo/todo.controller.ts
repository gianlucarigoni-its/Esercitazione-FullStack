import { NextFunction, Response } from 'express';
import { NotFoundError } from '../../errors/not-foud.error';
import { IdParams } from '../../utils/id-params';
import { TypedRequest } from './../../utils/typed-request';
import { AddTodoDto, ShowCompletedDto } from './todo.dto';
import todoSrv from './todo.service';

export async function getTodoList(
  req: TypedRequest<any, ShowCompletedDto>,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await todoSrv.find(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addTodo(
  req: TypedRequest<AddTodoDto>,
  res: Response,
  next: NextFunction,
) {
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
  next: NextFunction,
) {
  try {
    const result = await todoSrv.check(req.params);
    if (result === null) throw new NotFoundError();
    else res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function uncheckTodo(
  req: TypedRequest<any, any, IdParams>,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await todoSrv.uncheck(req.params);
    if (result === null) throw new NotFoundError();
    else res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
