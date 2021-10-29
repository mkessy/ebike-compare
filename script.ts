import {
  fetchEbikeProductPage,
  scrapeEbikeProductData,
  EbikeDataTable,
} from "./scraper/scraperFuncs";
import PromisePool from "@supercharge/promise-pool";
import log from "./logger/log";
import fs from "fs";
import { performance } from "perf_hooks";

/* const scrape = async (productIds: number[]) => {
  const scrapedEbikeData = await scrapeProductData(productIds);
  return scrapedEbikeData;
};
 */
