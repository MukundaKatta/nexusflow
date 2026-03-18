// ============================================================
// NexusFlow — BullMQ Job Queue
// ============================================================

import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const QUEUE_NAME = "nexusflow-executions";

let connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

let executionQueue: Queue | null = null;

export function getExecutionQueue(): Queue {
  if (!executionQueue) {
    executionQueue = new Queue(QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }
  return executionQueue;
}

// --- Job Types ---

export interface ExecuteWorkflowJob {
  type: "execute_workflow";
  workflowId: string;
  executionId: string;
  triggerType: string;
  triggerData?: Record<string, unknown>;
}

export interface ScheduleCheckJob {
  type: "schedule_check";
}

export type NexusFlowJob = ExecuteWorkflowJob | ScheduleCheckJob;

// --- Enqueue Functions ---

export async function enqueueWorkflowExecution(data: {
  workflowId: string;
  executionId: string;
  triggerType: string;
  triggerData?: Record<string, unknown>;
}): Promise<string> {
  const queue = getExecutionQueue();
  const job = await queue.add("execute_workflow", {
    type: "execute_workflow",
    ...data,
  } satisfies ExecuteWorkflowJob);
  return job.id!;
}

export async function enqueueScheduleCheck(): Promise<string> {
  const queue = getExecutionQueue();
  const job = await queue.add(
    "schedule_check",
    { type: "schedule_check" } satisfies ScheduleCheckJob,
    {
      repeat: {
        every: 60000, // Check every minute
      },
    }
  );
  return job.id!;
}

// --- Worker Creation ---

export function createWorker(
  processor: (job: Job<NexusFlowJob>) => Promise<void>
): Worker {
  return new Worker<NexusFlowJob>(QUEUE_NAME, processor, {
    connection: getConnection(),
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  });
}
