import { createMachine } from "xstate";
import { scrapeProductData } from "../scraper/scraper";

import { promise as FastQueue } from "fastq";

type ProductId = number;

interface EbikeDataScraperContext {
  queue: typeof FastQueue;
  ebikeDataScrapeTasks: number[];
  runningScrapeTasks: number[];
}

const queueWorker = async (productIds: ProductId[]) => {
  return await scrapeProductData(productIds);
};
