import { createScraperMachine } from "./state/machines";

import { EbikeDataScraperContext } from "./types";

import { scrapeProductData } from "./scraper/scraper";
import { ScrapedEbikeDataSchema } from "./schemas/schemas";
import { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { interpret } from "xstate";

const initialState: EbikeDataScraperContext = {
  completedBatches: [],
  initialBatches: [],
  pendingBatch: null,
  loadedBatches: [],
  runningBatch: null,
};

const machine = createScraperMachine(initialState);
const service = interpret(machine);

service.onTransition((state) => {
  console.log(state.value);
  console.log(state.context);
});

service.start();

const batches = [
  { count: 3, tasks: [1, 8, 123] },
  { count: 1, tasks: [2] },
];

service.send({
  type: "LOAD_BATCHES",
  batchesToLoad: batches,
});

service.send({ type: "BATCH" });
service.send({ type: "START" });
/* scrapeProductData([1231]).then((data) => {
  data.results[0].engine = [[]];
  const ebikeData: ScrapedEbikeDataType = ScrapedEbikeDataSchema.validateSync(
    data.results[0]
  );
  console.log(ebikeData);
}); */

//console.log(scrapeProductData([1231]));

//console.log(pathToFileURL(process.cwd()));
