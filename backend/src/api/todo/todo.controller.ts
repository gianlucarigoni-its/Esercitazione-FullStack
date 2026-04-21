import { TypedRequest } from "./../../utils/typed-request";
import { Response } from "express";
import { ShowCompletedDto, AddTodoDto } from "./todo.dto";
import todoSrv from "./todo.service";
import { idParams } from "../../utils/id-params";

export async function getTodoList(
  req: TypedRequest<any, ShowCompletedDto>,
  res: Response,
) {
  const result = await todoSrv.find(req.query);
  res.status(200).json(result);
}

export async function addTodo(req: TypedRequest<AddTodoDto>, res: Response) {
  const result = await todoSrv.add(req.body);
  res.status(201).json(result);
}

export async function checkTodo(
  req: TypedRequest<any, any, idParams>,
  res: Response,
) {
  const result = await todoSrv.check(req.params);
  if (result === null) res.status(404).send("id non esiste");
  else res.status(200).json(result);
}

export async function uncheckTodo(
  req: TypedRequest<any, any, idParams>,
  res: Response,
) {
  const result = await todoSrv.uncheck(req.params);
  if (result === null) res.status(404).send("id non esiste");
  else res.status(200).json(result);
}
