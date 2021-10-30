import {
  createScraperMachine,
  EbikeDataScraperContext,
  EbikeScraperEvent,
} from "./state/machines";

import { interpret } from "xstate";
import { scrapeProductData } from "./scraper/scraper";

const initialState: EbikeDataScraperContext = {
  completedBatches: [],
  initialBatches: [],
  pendingBatch: [],
  loadedBatches: [],
  runningBatch: [],
};

const machine = createScraperMachine(initialState);
const service = interpret(machine);

service.onTransition((state) => {
  console.log(state.value);
  console.log(state.context);
});

service.start();

service.send({
  type: "LOAD_BATCHES",
  tasksToLoad: [[1], [2], [3], [4], [5], [6]],
});

service.send({ type: "BATCH" });
service.send({ type: "START" });

console.log(service.state.context.completedBatches[0]);
