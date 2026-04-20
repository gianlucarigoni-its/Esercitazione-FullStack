import { Request } from "express";
import { Query, ParamsDictionary} from "express-serve-static-core";

export interface TypedRequest<B = any, Q = Query, P = ParamsDictionary> extends Request<P, any, B, Q> { }

export { Query, ParamsDictionary };
