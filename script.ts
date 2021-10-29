import {
  fetchEbikeProductPage,
  scrapeEbikeProductData,
  EbikeDataTable,
} from "./scraper/scraperFuncs";
import PromisePool from "@supercharge/promise-pool";
import log from "./logger/log";
import fs from "fs";
import { performance } from "perf_hooks";
import { start } from "repl";

const productIds = [123];

fetchEbikeProductPage(123).then((data) =>
  console.log(scrapeEbikeProductData(data, 123))
);

const scrapeProductData = async (productIds: number[]) => {
  log.info(
    `Scraping product data for ${productIds.length} product${
      productIds.length > 1 ? "s" : ""
    }...`
  );
  const { results, errors } = await PromisePool.for(productIds)
    .withConcurrency(10)
    .process(async (productId) => {
      //errors are caught in this block
      //process functions should send errors here
      const productData = await fetchEbikeProductPage(productId);
      return scrapeEbikeProductData(productData, productId);
    });

  return { results, errors };
};

type RawEbikeProductData = ReturnType<typeof scrapeEbikeProductData>;

const scrape = (data: RawEbikeProductData) => {
  scrapeProductData(productIds).then((data) => {
    /* fs.writeFile("./scraped_data/results.json", JSON.stringify(data), (err) => {
      console.log(err);
    }); */
  });
};
