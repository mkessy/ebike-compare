import { assert } from "console";
import {
  assign,
  createMachine,
  DoneInvokeEvent,
  EventObject,
  send,
} from "xstate";
import {
  Batch,
  Data,
  EbikeDataScraperContext,
  ScrapedEbikeDataType,
  ScrapeTask,
  ScrapeTaskResults,
} from "../types";
import { scrapeProductData } from "../scraper/scraper.js";
import Lowdb, { Low } from "lowdb";

export type EbikeScraperEvent =
  | { type: "BATCH" } //push tasks to current batch: STAGING STATE
  | { type: "LOAD_BATCHES"; batchesToLoad: Batch[] } //load tasks to the loadedTask context var: STAGING STATE
  | { type: "START" } // start processing tasks on current batch --> transitions to SCRAPING state
  | { type: "BATCH_COMPLETE" } //on completion of a batch of tasks: SCRAPING --> STAGING STATE
  | { type: "ALL_COMPLETE" } //on emptying of loaded batches
  | { type: "error.platform"; data: any }
  | { type: "done.invoke.scrape-productData"; data: ScrapeTaskResults } //type this data
  | EventObject
  | DoneInvokeEvent<ScrapeTaskResults>;

// a batch is just a grouping of a ScrapeTask[], a subset of loadedTasks

type ScraperTypeState =
  | {
      value: "staging";
      context: EbikeDataScraperContext;
      states:
        | {
            value: { staging: "notReady" };
          }
        | {
            value: { staging: "ready" };
          };
    }
  | {
      value: "scraping";
      context: EbikeDataScraperContext;
    }
  | {
      value: "idle"; // after batch complete
      context: EbikeDataScraperContext;
    }
  | {
      value: "complete";
      context: EbikeDataScraperContext;
    };

export const createScraperMachine = (
  initialState: EbikeDataScraperContext,
  db: Low<Data>
) => {
  return createMachine<
    EbikeDataScraperContext,
    EbikeScraperEvent,
    ScraperTypeState
  >(
    {
      id: "scraper",
      initial: "staging",
      context: initialState,
      states: {
        staging: {
          initial: "notReady",
          states: {
            notReady: {
              on: {
                LOAD_BATCHES: {
                  target: "notReady",
                  actions: "load",
                },

                BATCH: {
                  target: "ready",
                  actions: "batch",
                },
              },
            },

            ready: {
              on: {
                START: {
                  target: "#scraper.scraping",
                },
              },
            },
          },
        },

        scraping: {
          //push tasks from context.currentBatch to the queue to start processing
          entry: "setRunningBatch",
          invoke: {
            id: "scrape-productData",
            src: invokeScrapeProductData,
            onDone: {
              target: "idle",
              actions: ["completeBatch", "saveAndValidateBatch"],
            },
            onError: {
              target: "idle",
              actions: "saveError",
            },
          },
        },
        idle: {
          always: [
            {
              target: "scraping",
              actions: "batch",
              cond: (context, event) => context.loadedBatches.length > 0,
            },
            {
              target: "complete",
              actions: (context, event) => {
                console.log("finished");
              },
              cond: (context, event) => context.loadedBatches.length === 0,
            },
          ],
        },

        complete: {},
      },
    },
    {
      actions: {
        setRunningBatch: assign({
          runningBatch: (context, event) => context.pendingBatch,
          pendingBatch: (context, event) => null,
        }),
        batch: assign({
          pendingBatch: (context, event): Batch =>
            context.loadedBatches.slice(-1)[0], //add pending batch
          loadedBatches: (context, event): Batch[] =>
            context.loadedBatches.slice(0, -1), //remove batch from loadedBatches
        }),
        completeBatch: assign({
          completedBatches: (context, event) => {
            assertEventType(event, "done.invoke.scrape-productData");
            return context.completedBatches.concat(event.data);
          },
          runningBatch: (context, event) => null,
        }),

        saveAndValidateBatch: async (context, event) => {
          assertEventType(event, "done.invoke.scrape-productData");
          event.data.results.forEach((ebike, i) => {
            db.data?.ebikes.push(ebike);
          });
          await db.write();
        },

        ///why do i need explicitly type this event? not recognizing it...
        load: assign({
          loadedBatches: (context, event) => {
            assertEventType(event, "LOAD_BATCHES");
            return event.batchesToLoad;
          },
        }),

        saveError: assign({
          errors: (context, event) => {
            assertEventType(event, "error.platform");
            return context.errors
              ? context.errors.concat(event.data)
              : [event.data];
          },
        }),
      },
    }
  );
};

const invokeScrapeProductData = async (context: EbikeDataScraperContext) => {
  const { runningBatch } = context;
  return scrapeProductData(runningBatch!.tasks);
};

const invokeValidateAndSave = async (context: EbikeDataScraperContext) => {};

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
