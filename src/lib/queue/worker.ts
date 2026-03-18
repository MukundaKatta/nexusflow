// ============================================================
// NexusFlow — BullMQ Worker Process
// Run with: npm run worker
// ============================================================

import { Job } from "bullmq";
import { createWorker, type NexusFlowJob, enqueueWorkflowExecution } from "./jobs";
import { executeWorkflow } from "@/lib/engine/executor";
import { getActiveSchedules } from "@/lib/db/queries";
import { createExecution } from "@/lib/db/queries";
import { acquireLock, releaseLock } from "./redis";
import cronParser from "cron-parser";

console.log("Starting NexusFlow worker...");

const worker = createWorker(async (job: Job<NexusFlowJob>) => {
  const data = job.data;
  console.log(`Processing job: ${data.type} (${job.id})`);

  switch (data.type) {
    case "execute_workflow": {
      const lockKey = `execution:${data.executionId}`;
      const locked = await acquireLock(lockKey, 600);
      if (!locked) {
        console.log(`Execution ${data.executionId} already in progress, skipping.`);
        return;
      }

      try {
        await executeWorkflow(
          data.workflowId,
          data.executionId,
          data.triggerType,
          data.triggerData
        );
        console.log(`Workflow execution ${data.executionId} completed.`);
      } finally {
        await releaseLock(lockKey);
      }
      break;
    }

    case "schedule_check": {
      console.log("Checking scheduled workflows...");
      const schedules = await getActiveSchedules();
      const now = new Date();

      for (const schedule of schedules) {
        try {
          const interval = cronParser.parseExpression(schedule.cron, {
            tz: schedule.timezone || "UTC",
          });

          const lastRun = schedule.lastRunAt || new Date(0);
          const nextRun = interval.prev().toDate();

          if (nextRun > lastRun) {
            console.log(`Triggering scheduled workflow: ${schedule.workflowId}`);
            const execution = await createExecution({
              workflowId: schedule.workflowId,
              triggerType: "schedule",
              triggerData: {
                scheduledAt: now.toISOString(),
                cron: schedule.cron,
              },
            });

            await enqueueWorkflowExecution({
              workflowId: schedule.workflowId,
              executionId: execution.id,
              triggerType: "schedule",
              triggerData: {
                scheduledAt: now.toISOString(),
                cron: schedule.cron,
              },
            });
          }
        } catch (error) {
          console.error(`Error processing schedule ${schedule.id}:`, error);
        }
      }
      break;
    }
  }
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});

console.log("NexusFlow worker running. Waiting for jobs...");
