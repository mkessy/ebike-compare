import { assign, createMachine, send } from "xstate";
import { scrapeProductData } from "../scraper/scraper";

type ProductId = number;
type ScrapeTask = ProductId[];
type CompletedScrapeTask = ReturnType<typeof scrapeProductData>;

export type EbikeScraperEvent =
  | { type: "LOAD_BATCHES"; tasksToLoad: ScrapeTask[] } //load tasks to the loadedTask context var: STAGING STATE
  | { type: "BATCH" } //push tasks to current batch: STAGING STATE
  | { type: "START" } // start processing tasks on current batch --> transitions to SCRAPING state
  | { type: "TASK_COMPLETE"; completedScrapeTask: CompletedScrapeTask } //on completion of single task: SCRAPING STATE
  | { type: "BATCH_COMPLETE" } //on completion of a batch of tasks: SCRAPING --> STAGING STATE
  | { type: "ALL_COMPLETE" }; //on emptying of loaded batches

// a batch is just a grouping of a ScrapeTask[], a subset of loadedTasks

export interface EbikeDataScraperContext {
  initialBatches?: ScrapeTask[] | null;
  loadedBatches?: ScrapeTask[] | null;
  pendingBatch?: ScrapeTask | null;
  runningBatch?: ScrapeTask | null;
  completedBatches: ScrapeTask[] | null;
}

type ScraperTypeState =
  | {
      value: "staging";
      context: EbikeDataScraperContext & {
        initialBatches: null;
        loadedBatches: null;
        runningBatch: null;
        completedBatches: null;
        pendingBatch: null;
      };
      states:
        | {
            value: "notReady";
          }
        | {
            value: "ready";
          };
    }
  | {
      value: "scraping";
      context: EbikeDataScraperContext & {
        completedBatches: ScrapeTask[];
        runningBatch: ScrapeTask;
      };
    }
  | {
      value: "idle"; // after batch complete
      context: EbikeDataScraperContext & {
        completedBatches: ScrapeTask[];
      };
    }
  | {
      value: "complete";
      context: EbikeDataScraperContext & {
        completedBatches: ScrapeTask[];
      };
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
                  actions: assign((context, event) => {
                    const pendingBatch = context.loadedBatches?.slice(-1)[0]; //add pending batch
                    const loadedBatches = context.loadedBatches?.slice(0, -1); //remove batch from loadedBatches
                    return {
                      ...context,
                      pendingBatch,
                      loadedBatches,
                    };
                  }),
                },

                LOAD_BATCHES: {
                  target: "notReady",
                  actions: assign((context, event) => {
                    const loadedBatches = event.tasksToLoad;
                    return {
                      ...context,
                      loadedBatches,
                    };
                  }),
                },

                //push first batch of loaded tasks to current Batch
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
          entry: assign({
            runningBatch: (context, event) => context.pendingBatch,
            pendingBatch: (context, event) => null,
          }),
          on: {
            BATCH_COMPLETE: {
              target: "idle",
              actions: assign({
                runningBatch: (context, event) => null,
                completedBatches: (context, event) => {
                  const completed = context.completedBatches;
                  completed!.push(context.runningBatch!);
                  return [...completed!];
                },
              }),
            },
          },
        },
        idle: {
          on: {
            BATCH: {
              target: "scraping",
              actions: assign((context, event) => {
                const pendingBatch = context.loadedBatches?.slice(-1)[0]; //add pending batch
                const loadedBatches = context.loadedBatches?.slice(0, -1); //remove batch from loadedBatches
                return {
                  ...context,
                  pendingBatch,
                  loadedBatches,
                };
              }),
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
      actions: {},
      activities: {
        processBatches: (context, activityDefinition) => {
          //push batch to queue and start scraping
          // when complete send
          console.log("Processing: " + context.runningBatch);
          return () => {
            send({ type: "BATCH_COMPLETE" }, { to: "scraper.scraping" });
          };
        },
      },
    }
  );
};
