import axios from "axios";
import cheerio from "cheerio";
import config from "config";
import { entries, mapValues, set } from "lodash";
//consumes a URL and returns an ebik data object
//refer to images to understand html data structure

/* a map of the ebike tech spec category names to the div ids
see ebike_technical_specs.png and ebike_html_data_structure.png */
interface EbikeDataTable {
  generalInfo: any;
  engine: any;
  gearsBrakes: any;
  suspension: any;
  misc: any;
}

type EbikeDataTableRow = [string, string];

interface RawEbikeData {
  generalInfo: {
    modelYear: EbikeDataTable;
    price: EbikeDataTable;
    category: EbikeDataTable;
    type: EbikeDataTable;
    frameType: EbikeDataTable;
    weight: EbikeDataTable;
    permMaxWeight: EbikeDataTable;
    range: EbikeDataTable;
  };

  engine: {
    engine: EbikeDataTable;
    enginePosition: EbikeDataTable;
    enginePower: EbikeDataTable;
    assistsUntil: EbikeDataTable;
    batteryType: EbikeDataTable;
    batterySpecs: EbikeDataTable;
    range: EbikeDataTable;
  };

  gearsBrakes: {
    gearshiftType: EbikeDataTable;
    gears: EbikeDataTable;
    gearsBrand: EbikeDataTable;
    brakeType: EbikeDataTable;
    brakesModel: EbikeDataTable;
  };

  suspension: {
    suspensionFrontRear: EbikeDataTable;
  };

  misc: {
    permMaxWeight: EbikeDataTable;
    lighting: EbikeDataTable;
    rack: EbikeDataTable;
    fenders: EbikeDataTable;
  };
}

type DataTableRecord = Record<keyof EbikeDataTable, string>;

const buildDataTableStrings = (productId: number): DataTableRecord => {
  const dataTables: DataTableRecord = {
    generalInfo: `#collapseOne-product-${productId}`,
    engine: `#collapseTwo-product-${productId}`,
    gearsBrakes: `#collapseGears-product-${productId}`,
    suspension: `#collapseSuspension-product-${productId}`,
    misc: `#collapseFour-product-${productId}`,
  };

  return dataTables;
};

const extractEbikeData = async (productId: number): Promise<EbikeDataTable> => {
  const url = generateScraperUrl(productId);
  const rawHtmlString = await axios.get<string>(url);
  const $ = cheerio.load(rawHtmlString.data);

  const x = $("table");

  const dataTables = buildDataTableStrings(productId);

  const selectedDataTables: Record<
    keyof EbikeDataTable,
    ReturnType<typeof cheerio.root>
  > = entries(dataTables).reduce((ebikeData, entry) => {
    return set(ebikeData, entry[0], $(entry[1]));
  }, {} as EbikeDataTable);

  const extractedDataTables = mapValues(
    selectedDataTables,
    (cheerioSelection) => {
      return $("table", cheerioSelection)
        .find("tr")
        .toArray()
        .map((elem) => {
          return [$("td.prop-key", elem).text(), $("td.prop-val", elem).text()];
        });
    }
  );

  return extractedDataTables;
};

const generateScraperUrl = (productId: number): string => {
  const baseUrl = config.get<string>("Scraper.baseUrl");

  return `${baseUrl}${productId}`;
};

export default extractEbikeData;
