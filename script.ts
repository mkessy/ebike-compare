import {
  createScraperMachine,
  EbikeDataScraperContext,
  EbikeScraperEvent,
} from "./state/machines";

import { scrapeProductData } from "./scraper/scraper";
import {
  ScrapedEbikeDataSchema,
  ScrapedEbikeDataType,
} from "./schemas/schemas";

const initialState: EbikeDataScraperContext = {
  completedBatches: [],
  initialBatches: [],
  pendingBatch: [],
  loadedBatches: [],
  runningBatch: [],
};

/* const machine = createScraperMachine(initialState);
const service = interpret(machine);

service.onTransition((state) => {
  console.log(state.value);
  console.log(state.context);
});

service.start();

service.send({
  type: "LOAD_BATCHES",
  tasksToLoad: [[1, 8, 123], [2]],
});

service.send({ type: "BATCH" });
service.send({ type: "START" }); */
scrapeProductData([1231]).then((data) => {
  data.results[0].engine = [[]];
  const ebikeData: ScrapedEbikeDataType = ScrapedEbikeDataSchema.validateSync(
    data.results[0]
  );
  console.log(ebikeData);
});

//console.log(scrapeProductData([1231]));
