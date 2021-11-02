import { createScraperMachine } from "./state/machines.js";
import { Batch, Data, EbikeDataScraperContext, ProductId } from "./types";
import { Low, JSONFile } from "lowdb";
import { interpret } from "xstate";
import { range, chunk } from "lodash-es";

const BATCH_SIZE = 20;
const adapter = new JSONFile<Data>("db.json");
const db = new Low<Data>(adapter);
const initialState: EbikeDataScraperContext = {
  db,
  completedBatches: [],
  initialBatches: [],
  pendingBatch: null,
  loadedBatches: [],
  runningBatch: null,
  totalInvalidProducts: 0,
  totalTasksRun: 0,
  totalValidatedProducts: 0,
};

const machine = createScraperMachine(initialState);
const service = interpret(machine);

service.onTransition((state) => {
  console.log(state.value);
  console.log(state.context);
});

db.read().then(() => {
  if (!db.data) {
    db.data = { ebikes: [], unvalidated: [] };
  }
  service.start();
  const batches = makeBatches([1001, 5000]);

  service.send({
    type: "LOAD_BATCHES",
    batchesToLoad: batches,
  });

  service.send({ type: "BATCH" });
  service.send({ type: "START" });
});

const makeBatches = (productIdRange: [ProductId, ProductId]): Batch[] => {
  const [low, high] = productIdRange;
  const tasks = range(low, high + 1);
  const batches = high - low < BATCH_SIZE ? [tasks] : chunk(tasks, BATCH_SIZE);
  return batches.map((batch) => {
    return { count: batch.length, tasks: batch };
  });
};

/* scrapeProductData([1231]).then((data) => {
  data.results[0].engine = [[]];
  const ebikeData: ScrapedEbikeDataType = ScrapedEbikeDataSchema.validateSync(
    data.results[0]
  );
  console.log(ebikeData);
}); */

//console.log(scrapeProductData([1231]));

//console.log(pathToFileURL(process.cwd()));
