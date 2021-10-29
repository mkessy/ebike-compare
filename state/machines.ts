import { createMachine } from "xstate";
import { promise as FastQueue } from "fastq";

type;

interface EbikeDataScraperContext {
  queue: typeof FastQueue;
  ebikeDataScrapeTasks: number[];
  runningScrapeTasks: number[];
}
