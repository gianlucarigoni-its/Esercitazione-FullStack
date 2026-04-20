import { TypedRequest } from "./../../utils/typed-request";
import { Response } from "express";
import todoSrv from "./todo.service";

export async function getTodoList(
  req: TypedRequest<any, { showCompleted?: string }>,
  res: Response,
) {
  const result = await todoSrv.find(req.query);
  res.json(result);
}
