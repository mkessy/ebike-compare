import { type } from "os";
import { scrapeProductData } from "./scraper/scraper";

export type ProductId = number;
export type EbikeDataField = [string, string];

export type ScrapedEbikeDataType = {
  productId: ProductId;
  imgSrc: string;
  modelBrand: EbikeDataField[];
  generalInfo: EbikeDataField[];
  engine: EbikeDataField[];
  gearsBrakes: EbikeDataField[];
  suspension: EbikeDataField[];
  misc: EbikeDataField[];
};

export type ScrapeTask = ProductId[];
export type Batch = {
  count: number;
  tasks: ScrapeTask;
};

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type ScrapeTaskResults = Awaited<ReturnType<typeof scrapeProductData>>;

export type EbikeDataScraperContext = {
  initialBatches: Batch[];
  loadedBatches: Batch[];
  pendingBatch: Batch | null;
  runningBatch: Batch | null;
  completedBatches: ScrapeTaskResults[];
  errors?: any[];
};
