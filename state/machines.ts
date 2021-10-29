import { actions, createMachine } from "xstate";
import { scrapeProductData } from "../scraper/scraper";

type ProductId = number;
type ScrapeTask = ProductId[];
type CompletedScrapeTask = ReturnType<typeof scrapeProductData>;

type EbikeScraperEvent =
  | { type: "LOAD_TASKS"; tasksToLoad: ScrapeTask[] } //load tasks to the loadedTask context var: STAGING STATE
  | { type: "BATCH_TASKS"; tasksToBatch: ScrapeTask[] } //push tasks to current batch: STAGING STATE
  | { type: "START" } // start processing tasks on current batch --> transitions to SCRAPING state
  | { type: "TASK_COMPLETE"; completedScrapeTask: CompletedScrapeTask } //on completion of single task: SCRAPING STATE
  | { type: "BATCH_COMPLETE" } //on completion of a batch of tasks: SCRAPING --> STAGING STATE
  | { type: "ALL_COMPLETE" }; //on emptying of loaded tasks

// a batch is just a grouping of a ScrapeTask[], a subset of loadedTasks

interface EbikeDataScraperContext {
  initialTasks?: ScrapeTask[];
  loadedTasks?: ScrapeTask[];
  pendingBatch?: ScrapeTask[];
  runningBatch?: ScrapeTask[];
  completedTasks?: ScrapeTask[];
}

type ScraperTypeState =
  | {
      value: "staging";
      context: EbikeDataScraperContext & {
        initialTasks: undefined;
        loadedTasks: undefined;
        runningBatch: undefined;
        completedTasks: undefined;
        pendingBatch: undefined;
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

const scrapeMachine = createMachine<
  EbikeDataScraperContext,
  EbikeScraperEvent,
  ScraperTypeState
>(
  {
    id: "scraper",
    initial: "staging",
    states: {
      staging: {
        initial: "notReady",
        entry: ["loadTasks"],
        states: {
          notReady: {
            on: {
              BATCH_TASKS: { target: "ready" },
              //push first batch of loaded tasks to current Batch
            },
          },

          ready: {
            on: {
              START: { target: "#scraper.scraping" },
            },
          },
        },
      },

      scraping: {
        activities: ["processBatches"], //push tasks from context.currentBatch to the queue to start processing
        on: {
          BATCH_COMPLETE: { target: "idle" },
        },
      },
      idle: {
        on: {
          BATCH_TASKS: { target: "scraping" },
          ALL_COMPLETE: { target: "complete" },
        },
      },

      complete: {},
    },
  },
  {
    actions: {
      loadTasks: (context, event) => {
        //add initial tasks to 'loadedTasks'
      },
    },
    activities: {
      processBatches: (context, activityDefinition) => {
        //push batch to queue and start scraping
      },
    },
  }
);
