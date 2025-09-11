"use node";

import { NodeSSH } from 'node-ssh';
import { ActionCtx } from "@/convex/_generated/server";
import { Id } from "@/convex/_generated/dataModel";
import { internal } from "@/convex/_generated/api";

// Simplified interfaces - only essential data
export interface GoogleCredentials {
  project_id: string;
  client_email: string;
  private_key: string;
}

// Core connection info that all services need
export interface SSHConnection {
  ssh: NodeSSH;
  sshUser: string;
  ip: string;
}



export async function updateMachineStatus(
  ctx: ActionCtx,
  machineId: Id<"machine">,
  status: string
) {
  await ctx.runMutation(internal.application.machine.mutation.scheduler.machine, {
    machineId,
    updateData: { state: status },
  });
}

export async function handlePhaseError(
  ctx: ActionCtx,
  machineId: Id<"machine">
) {
  // Update machine status to failed
  await updateMachineStatus(ctx, machineId, "failed");

  // Get machine details for cleanup
  const machine = await ctx.runQuery(internal.application.machine.query.by_id.machine, {
    machineId,
  });

  if (machine) {
    // Trigger cleanup using the delete action
    await ctx.runAction(internal.application.machine.action.delete.machine, {
      machine,
    });
  }
}


