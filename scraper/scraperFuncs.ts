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

type ProductId = number;
type EbikeDataField = [string, string];

type ScrapedEbikeDataType = {
  productId: ProductId;
  imgSrc: string;
  modelBrand: EbikeDataField[];
  generalInfo: EbikeDataField[];
  engine: EbikeDataField[];
  gearsBrakes: EbikeDataField[];
  suspension: EbikeDataField[];
  misc: EbikeDataField[];
};

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

type ExtractEbikeProductDataFunc = (
  rawEbikeProductHTML: string,
  productId: ProductId
) => ScrapedEbikeDataType;

export const extractEbikeProductData: ExtractEbikeProductDataFunc = (
  rawEbikeProductHTML,
  productId
): ScrapedEbikeDataType => {
  const $ = cheerio.load(rawEbikeProductHTML);

  const dataTables = buildDataTableStrings(productId);
  const imgSrc = $("img.product-image[itemprop=image]").attr("src") as string;

  const selectedDataTables: Record<
    keyof EbikeDataTable,
    ReturnType<typeof cheerio.root>
  > = entries(dataTables).reduce((ebikeData, entry) => {
    return set(ebikeData, entry[0], $(entry[1]));
  }, {} as EbikeDataTable);

  const extractedDataTables = mapValues(
    selectedDataTables,
    (cheerioSelection, key): EbikeDataField[] => {
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
        .map<EbikeDataField>((elem) => {
          return [$("td.prop-key", elem).text(), $("td.prop-val", elem).text()];
        });
    }
  );
  log.info(`Extracted data for product: ${productId}`);
  return { productId, imgSrc, ...extractedDataTables };
};
