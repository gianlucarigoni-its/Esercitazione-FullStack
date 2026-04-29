import { alreadyCheckedHandler } from './already-checked.error';
import { alreadyUncheckedHandler } from './already-unchecked.error';
import { genericErrorHandler } from './generic.error';
import { notFoundHandler } from './not-foud.error';
import { validationHandler } from './validation.error';

export const errorHandlers = [
  validationHandler,
  notFoundHandler,
  alreadyCheckedHandler,
  alreadyUncheckedHandler,
  genericErrorHandler,
];
