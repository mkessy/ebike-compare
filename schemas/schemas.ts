import { string, object, number, array, SchemaOf } from "yup";
import { ScrapedEbikeDataType } from "../types";

export const ScrapedEbikeDataSchema: SchemaOf<ScrapedEbikeDataType> = object({
  productId: number().integer().defined().required(),
  imgSrc: string().defined(),
  modelBrand: array()
    .of(array().of(string().defined()).length(2).defined())
    .defined(),
  generalInfo: array()
    .of(array().of(string().defined()).length(2).defined())
    .defined(),
  engine: array()
    .of(array().of(string().defined()).length(2).defined())
    .defined(),
  gearsBrakes: array()
    .of(array().of(string().defined()).length(2).defined())
    .defined(),
  suspension: array()
    .of(array().of(string().defined()).length(2).defined())
    .defined(),
  misc: array()
    .of(array().of(string().defined()).length(2).defined())
    .defined(),
}).defined();
