import PromisePool from "@supercharge/promise-pool";
import { log } from "console";
import { ScrapeTask } from "../types";
import {
  fetchEbikeProductPage,
  extractEbikeProductData,
} from "./scraperFuncs.js";

const pool = new PromisePool();

export const scrapeProductData = async (scrapeTask: ScrapeTask) => {
  const { results, errors } = await pool
    .for(scrapeTask)
    .withConcurrency(10)
    .process(async (productId) => {
      //errors are caught in this block
      //process functions should send errors here
      const productData = await fetchEbikeProductPage(productId);
      return extractEbikeProductData(productData, productId);
    });

  return { results, errors };
};
