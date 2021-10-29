import { promise as FastQueue } from "fastq";

const queueWorker = async (productIds: ProductId[]) => {
  return await scrapeProductData(productIds);
};
