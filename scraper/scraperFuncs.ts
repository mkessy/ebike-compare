import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import cheerio from "cheerio";
import config from "config";
import { entries, mapValues, set } from "lodash";
import log from "../logger/log";
//consumes a URL and returns an ebik data object
//refer to images to understand html data structure

/* a map of the ebike tech spec category names to the div ids
see ebike_technical_specs.png and ebike_html_data_structure.png */
export interface EbikeDataTable {
  modelBrand: any;
  generalInfo: any;
  engine: any;
  gearsBrakes: any;
  suspension: any;
  misc: any;
}

type DataTableRecord = Record<keyof EbikeDataTable, string | number>;

const buildDataTableStrings = (productId: number): DataTableRecord => {
  const dataTables: DataTableRecord = {
    modelBrand: `h1[itemprop=name].brandName`,
    generalInfo: `#collapseOne-product-${productId}`,
    engine: `#collapseTwo-product-${productId}`,
    gearsBrakes: `#collapseGears-product-${productId}`,
    suspension: `#collapseSuspension-product-${productId}`,
    misc: `#collapseFour-product-${productId}`,
  };

  return dataTables;
};

const baseUrl = config.get("Scraper.baseUrl");

//separate the fetch from the extract method
//async fetch function and

export const fetchEbikeProductPage = async (
  productId: number
): Promise<string> => {
  const axiosResponse: AxiosResponse<string, string> = await axios.get(
    `${baseUrl}?tx_gfproducts_gfproductsef%5Bproduct%5D=${productId}`
  );

  log.info(
    `Fetched raw HTML for product: ${productId} at URL:  ${axiosResponse.status} `
  );

  return axiosResponse.data;
};

export const extractEbikeProductData = (
  rawEbikeProductHTML: string,
  productId: number
) => {
  const $ = cheerio.load(rawEbikeProductHTML);

  const dataTables = buildDataTableStrings(productId);
  const imgSrc = $("img.product-image[itemprop=image]").attr("src");

  const selectedDataTables: Record<
    keyof EbikeDataTable,
    ReturnType<typeof cheerio.root>
  > = entries(dataTables).reduce((ebikeData, entry) => {
    return set(ebikeData, entry[0], $(entry[1]));
  }, {} as EbikeDataTable);

  const extractedDataTables = mapValues(
    selectedDataTables,
    (cheerioSelection, key) => {
      if (key === "modelBrand") {
        return [
          [
            "manufacturer",
            $("span[itemprop=manufacturer]", cheerioSelection).text(),
          ],
          ["model", $("span.modelName", cheerioSelection).text()],
        ];
      }

      return $("table", cheerioSelection)
        .find("tr")
        .toArray()
        .map((elem) => {
          return [$("td.prop-key", elem).text(), $("td.prop-val", elem).text()];
        });
    }
  );
  log.info(`Extracted data for product: ${productId}`);
  return { productId, imgSrc, ...extractedDataTables };
};
