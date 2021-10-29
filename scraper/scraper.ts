import PromisePool from "@supercharge/promise-pool/dist";
import { log } from "console";
import { fetchEbikeProductPage, extractEbikeProductData } from "./scraperFuncs";

export const scrapeProductData = async (productIds: number[]) => {
  const { results, errors } = await PromisePool.for(productIds)
    .withConcurrency(10)
    .process(async (productId) => {
      //errors are caught in this block
      //process functions should send errors here
      const productData = await fetchEbikeProductPage(productId);
      return extractEbikeProductData(productData, productId);
    });

  return { results, errors };
};

type RawEbikeProductData = ReturnType<typeof extractEbikeProductData>;
