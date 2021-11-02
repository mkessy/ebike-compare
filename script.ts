import { createScraperMachine } from "./state/machines.js";

import { Data, EbikeDataScraperContext, ScrapedEbikeDataType } from "./types";
import { Low, JSONFile } from "lowdb";
import { entries, set, mapValues } from "lodash-es";

import { interpret } from "xstate";

const initialState: EbikeDataScraperContext = {
  completedBatches: [],
  initialBatches: [],
  pendingBatch: null,
  loadedBatches: [],
  runningBatch: null,
};

const adapter = new JSONFile<Data>("db.json");
const db = new Low<Data>(adapter);

db.data = { ebikes: [] };

const machine = createScraperMachine(initialState, db);
const service = interpret(machine);

service.onTransition((state) => {
  console.log(state.value);
  console.log(state.context);
});

service.start();

const batches = [
  { count: 1, tasks: [1] },
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
