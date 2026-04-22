import { Router } from 'express';
import { IdParams } from '../../utils/id-params';
import { validate } from './../../utils/validation-middleware';
import { addTodo, checkTodo, getTodoList, uncheckTodo } from './todo.controller';
import { AddTodoDto, ShowCompletedDto } from './todo.dto';

const router = Router();

router.get('/', validate(ShowCompletedDto, 'query'), getTodoList);
router.post('/', validate(AddTodoDto, 'body'), addTodo);
router.patch('/:id/check', validate(IdParams, 'params'), checkTodo);
router.patch('/:id/uncheck', validate(IdParams, 'params'), uncheckTodo);

export default router;
