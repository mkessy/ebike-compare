import { assign, createMachine, send } from "xstate";
import { scrapeProductData } from "../scraper/scraper";

type ProductId = number;
type ScrapeTask = ProductId[];
type CompletedScrapeTask = ReturnType<typeof scrapeProductData>;

export type EbikeScraperEvent =
  | { type: "BATCH" } //push tasks to current batch: STAGING STATE
  | { type: "LOAD_BATCHES"; tasksToLoad: ScrapeTask[] } //load tasks to the loadedTask context var: STAGING STATE
  | { type: "START" } // start processing tasks on current batch --> transitions to SCRAPING state
  | { type: "BATCH_COMPLETE" } //on completion of a batch of tasks: SCRAPING --> STAGING STATE
  | { type: "ALL_COMPLETE" }; //on emptying of loaded batches

// a batch is just a grouping of a ScrapeTask[], a subset of loadedTasks

export interface EbikeDataScraperContext {
  initialBatches: ScrapeTask[];
  loadedBatches: ScrapeTask[];
  pendingBatch: ScrapeTask;
  runningBatch: ScrapeTask;
  completedBatches: ScrapeTask[];
}

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

export const createScraperMachine = (initialState: EbikeDataScraperContext) => {
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
                BATCH: {
                  target: "ready",
                  actions: "batch",
                },

                LOAD_BATCHES: {
                  target: "notReady",
                  actions: "load",
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
          entry: "runPendingBatch",
          invoke: {
            id: "scrape-productData",
            src: invokeScrapeProductData,
            onDone: {
              target: "idle",
              actions: assign({
                completedBatches: (context, event) =>
                  context.completedBatches.concat(event.data),
                runningBatch: (context, event) => [],
              }),
            },
            onError: "idle",
          },
        },
        idle: {
          on: {
            BATCH: {
              target: "scraping",
              actions: "batch",
            },
            ALL_COMPLETE: {
              target: "complete",
              actions: (context, event) => {
                console.log("finished");
              },
            },
          },
        },

        complete: {},
      },
    },
    {
      actions: {
        runPendingBatch: assign({
          runningBatch: (context, event) => context.pendingBatch,
          pendingBatch: (context, event) => [],
        }),
        batch: assign({
          pendingBatch: (context, event) => context.loadedBatches.slice(-1)[0], //add pending batch
          loadedBatches: (context, event) => context.loadedBatches.slice(0, -1), //remove batch from loadedBatches
        }),
        completeBatch: assign({
          runningBatch: (context, event) => [],
          completedBatches: (context, event) => {
            return context.completedBatches.concat([context.runningBatch]);
          },
        }),
        ///why do i need explicitly type this event? not recognizing it...
        load: assign({
          loadedBatches: (context, event) =>
            (event as { type: "LOAD_BATCHES"; tasksToLoad: ScrapeTask[] })
              .tasksToLoad,
        }),
      },
    }
  );
};

const invokeScrapeProductData = async (context: EbikeDataScraperContext) => {
  const { runningBatch } = context;
  return scrapeProductData(runningBatch);
};
