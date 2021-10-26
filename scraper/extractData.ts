import axios from "axios";
import cheerio from "cheerio";
//consumes a URL and returns an ebik data object
//refer to images to understand html data structure

/* a map of the ebike tech spec category names to the div ids
see ebike_technical_specs.png and ebike_html_data_structure.png */
type EbikeDataTable = {
  generalInfo: string;
  engine: string;
  gearsBrakes: string;
  suspension: string;
  misc: string;
};

type DataTableRecord = Record<keyof EbikeDataTable, string>;

const buildDataTableStrings = (productId: number): DataTableRecord => {
  const dataTables: DataTableRecord = {
    generalInfo: `collapseOne-product-${productId}`,
    engine: `collapseTwo-product-${productId}`,
    gearsBrakes: `collapseGears-product-${productId}`,
    suspension: `collapseSuspension-product-${productId}`,
    misc: `collapseFour-product-${productId}`,
  };

  return dataTables;
};

const extractEbikeData = async (url: string) => {
  const rawPageHtml = await axios.get<string>(url);
  const $ = cheerio.load(rawPageHtml.data);
};
