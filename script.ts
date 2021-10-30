import {
  createScraperMachine,
  EbikeDataScraperContext,
  EbikeScraperEvent,
} from "./state/machines";

import { interpret } from "xstate";

const initialState: EbikeDataScraperContext = {
  completedBatches: [],
  initialBatches: null,
  pendingBatch: null,
  loadedBatches: null,
  runningBatch: null,
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

service.send({ type: "BATCH_COMPLETE" });

service.send({ type: "BATCH" });

service.send({ type: "BATCH_COMPLETE" });
service.send({ type: "ALL_COMPLETE" });
