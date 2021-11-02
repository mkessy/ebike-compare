import { partition } from "lodash-es";
import { send } from "process";
import { ActionFunction, assign, AssignAction, EventObject } from "xstate";
import { Batch, EbikeDataScraperContext } from "../types";
import { EbikeScraperEvent } from "./machines.js";
import { ScrapedEbikeDataSchema } from "../schemas/schemas.js";
import { resourceLimits } from "worker_threads";

export const setContextRunningBatch: AssignAction<
  EbikeDataScraperContext,
  EbikeScraperEvent
> = assign({
  runningBatch: (context, event) => context.pendingBatch,
  pendingBatch: (context, event) => null,
});

type ScraperActionFunction = AssignAction<
  EbikeDataScraperContext,
  EbikeScraperEvent
>;

export const batch: ScraperActionFunction = assign({
  pendingBatch: (context, event): Batch => context.loadedBatches.slice(-1)[0], //add pending batch
  loadedBatches: (context, event): Batch[] =>
    context.loadedBatches.slice(0, -1), //remove batch from loadedBatches
});

export const completeBatch: ScraperActionFunction = assign({
  completedBatches: (context, event) => {
    assertEventType(event, "done.invoke.scrape-productData");
    return context.completedBatches.concat([
      {
        resultCount: event.data.results.length,
        errorCount: event.data.errors.length,
      },
    ]);
  },
  runningBatch: (context, event) => null,
});

export const saveAndValidateBatch: ActionFunction<
  EbikeDataScraperContext,
  EbikeScraperEvent
> = async (context, event) => {
  assertEventType(event, "done.invoke.scrape-productData");
  const { data } = context.db;
  const {
    data: { results },
  } = event;

  context.totalTasksRun += results.length;
  const [validated, notValidated] = partition(results, (data) => {
    return ScrapedEbikeDataSchema.isValidSync(data);
  });
  context.totalValidatedProducts += validated.length;
  context.totalInvalidProducts += notValidated.length;
  context.db.data!.ebikes = data!.ebikes.concat(validated);
  context.db.data!.unvalidated = data!.unvalidated.concat(notValidated);
  await context.db.write();
};

export const loadBatches: ScraperActionFunction = assign({
  loadedBatches: (context, event) => {
    assertEventType(event, "LOAD_BATCHES");
    return event.batchesToLoad;
  },
});

export const saveError: ScraperActionFunction = assign({
  errors: (context, event) => {
    assertEventType(event, "error.platform");
    return context.errors ? context.errors.concat(event.data) : [event.data];
  },
});

function assertEventType<TE extends EventObject, TType extends TE["type"]>(
  event: TE,
  eventType: TType
): asserts event is TE & { type: TType } {
  if (event.type !== eventType) {
    throw new Error(
      `Invalid event: expected "${eventType}", got "${event.type}"`
    );
  }
}
