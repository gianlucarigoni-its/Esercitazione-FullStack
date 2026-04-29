import { NextFunction, Request, Response } from 'express';

export class AlreadyUncheckedError extends Error {
  constructor() {
    super('Todo is already unchecked  as complete');
    this.name = 'AlreadyUnchecked';
  }
}

export const alreadyUncheckedHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AlreadyUncheckedError) {
    res.status(409);
    res.json({
      error: err.name,
      message: err.message,
    });
  } else next(err);
};
