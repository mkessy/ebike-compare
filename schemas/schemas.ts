import { string, object, number, array } from "yup";

const scrapedEbikeDataSchema = object({
  productId: number().integer().defined(),
  imgSrc: string().defined(),
  modelBrand: array().of(array()),
  generalInfo,
  engine,
  gearsBrakes,
  suspension,
  misc,
});
