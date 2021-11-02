import { createMachine, DoneInvokeEvent, EventObject } from "xstate";
import { Batch, EbikeDataScraperContext, ScrapeTaskResults } from "../types";
import { scrapeProductData } from "../scraper/scraper.js";
import {
  setContextRunningBatch,
  batch,
  completeBatch,
  saveAndValidateBatch,
  loadBatches,
  saveError,
} from "./helperFuncs.js";

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

        complete: {
          entry: (context, event) => {
            console.log(`
          END SCRAPER STATE MACHINE\n
          #########################\n
          Total: ${context.totalTasksRun}
          Validated: ${context.totalValidatedProducts}\n
          InValidated: ${context.totalInvalidProducts}\n
          Total Scrape errors: ${context.completedBatches.reduce(
            (errorSum, currCompleted) => {
              return errorSum + currCompleted.errorCount;
            },
            0
          )}
          `);
          },
        },
      },
    },
    {
      actions: {
        setRunningBatch: setContextRunningBatch,
        batch: batch,
        completeBatch: completeBatch,

        saveAndValidateBatch: saveAndValidateBatch,

        ///why do i need explicitly type this event? not recognizing it...
        load: loadBatches,

        saveError: saveError,
      },
    }
  );
};

const invokeScrapeProductData = async (context: EbikeDataScraperContext) => {
  const { runningBatch } = context;
  return scrapeProductData(runningBatch!.tasks);
};

const invokeValidateAndSave = async (context: EbikeDataScraperContext) => {};
