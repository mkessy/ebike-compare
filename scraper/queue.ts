import { promise as FastQueue } from "fastq";
import { scrapeProductData } from "./scraper";

import { send } from "xstate";

const scrapeWorker = async (productIds: number[]) => {
  const data = await scrapeProductData(productIds);
};

const queue = FastQueue(scrapeWorker, 1);
