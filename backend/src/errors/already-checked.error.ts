import { NextFunction, Request, Response } from 'express';

export class AlreadyCheckedError extends Error {
  constructor() {
    super('Todo is already checked  as complete');
    this.name = 'AlreadyChecked';
  }
}

export const alreadyCheckedHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AlreadyCheckedError) {
    res.status(409);
    res.json({
      error: err.name,
      message: err.message,
    });
  } else next(err);
};
