import { genericErrorHandler } from './generic.error';
import { notFoundHandler } from './not-foud.error';
import { validationHandler } from './validation.error';

export const errorHandlers = [validationHandler, notFoundHandler, genericErrorHandler];
