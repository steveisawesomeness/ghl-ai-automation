import { randomUUID } from 'crypto';
import { getLocationId } from '../auth';
import { ghlGet, ghlPut } from '../client';

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  order: number;
  parent?: string;
  parentKey?: string;
  next?: string;
  attributes: Record<string, unknown>;
}

export interface Workflow {
  _id: string;
  id: string;
  locationId: string;
  companyId: string;
  name: string;
  status: 'published' | 'draft';
  version: number;
  dataVersion: number;
  workflowData: {
    templates: WorkflowStep[];
  };
  newTriggers?: unknown[];
  oldTriggers?: unknown[];
  [key: string]: unknown;
}

export async function workflowGet(workflowId: string): Promise<Workflow> {
  const locationId = getLocationId();
  const sessionId = randomUUID();
  const path = `/workflow/${locationId}/${workflowId}?includeScheduledPauseInfo=true&sessionId=${sessionId}`;
  return ghlGet<Workflow>(path);
}

export async function workflowUpdate(
  workflowId: string,
  workflow: Workflow,
  modifiedSteps: string[] = [],
  createdSteps: string[] = [],
  deletedSteps: string[] = []
): Promise<Workflow> {
  const locationId = getLocationId();
  const path = `/workflow/${locationId}/${workflowId}`;

  const payload = {
    ...workflow,
    modifiedSteps,
    createdSteps,
    deletedSteps,
    triggersChanged: false,
    newTriggers: workflow.newTriggers || [],
    oldTriggers: workflow.oldTriggers || [],
  };

  return ghlPut<Workflow>(path, payload);
}

async function workflowAutoSave(
  workflowId: string,
  workflow: Workflow,
  createdSteps: string[],
  modifiedSteps: string[],
  deletedSteps: string[]
): Promise<Workflow> {
  const locationId = getLocationId();
  const path = `/workflow/${locationId}/${workflowId}/auto-save`;

  const payload = {
    ...workflow,
    createdSteps,
    modifiedSteps,
    deletedSteps,
    isAutoSave: true,
    triggersChanged: false,
    newTriggers: workflow.newTriggers || [],
    oldTriggers: workflow.oldTriggers || [],
  };

  return ghlPut<Workflow>(path, payload);
}

export type NewStepInput = {
  id?: string;
  name: string;
  type: string;
  order?: number;
  parent?: string;
  parentKey?: string;
  next?: string;
  attributes?: Record<string, unknown>;
};

export async function workflowAddStep(
  workflowId: string,
  step: NewStepInput
): Promise<Workflow> {
  const workflow = await workflowGet(workflowId);
  const templates = workflow.workflowData?.templates ?? [];

  const id = step.id ?? randomUUID();
  const order = step.order ?? templates.length;
  const newStep: WorkflowStep = {
    id,
    name: step.name,
    type: step.type,
    order,
    parent: step.parent,
    parentKey: step.parentKey,
    next: step.next,
    attributes: step.attributes ?? {},
  };

  const nextWorkflow: Workflow = {
    ...workflow,
    workflowData: { ...workflow.workflowData, templates: [...templates, newStep] },
  };

  return workflowAutoSave(workflowId, nextWorkflow, [id], [], []);
}

export async function workflowModifyStep(
  workflowId: string,
  stepId: string,
  patch: Partial<WorkflowStep>
): Promise<Workflow> {
  const workflow = await workflowGet(workflowId);
  const templates = workflow.workflowData?.templates ?? [];

  const idx = templates.findIndex((s) => s.id === stepId);
  if (idx === -1) throw new Error(`Step ${stepId} not found in workflow ${workflowId}`);

  const current = templates[idx];
  const merged: WorkflowStep = {
    ...current,
    ...patch,
    id: current.id,
    attributes: { ...current.attributes, ...(patch.attributes ?? {}) },
  };

  const nextTemplates = [...templates];
  nextTemplates[idx] = merged;

  const nextWorkflow: Workflow = {
    ...workflow,
    workflowData: { ...workflow.workflowData, templates: nextTemplates },
  };

  return workflowAutoSave(workflowId, nextWorkflow, [], [stepId], []);
}

export async function workflowDeleteStep(
  workflowId: string,
  stepId: string
): Promise<Workflow> {
  const workflow = await workflowGet(workflowId);
  const templates = workflow.workflowData?.templates ?? [];

  if (!templates.some((s) => s.id === stepId)) {
    throw new Error(`Step ${stepId} not found in workflow ${workflowId}`);
  }

  const nextWorkflow: Workflow = {
    ...workflow,
    workflowData: {
      ...workflow.workflowData,
      templates: templates.filter((s) => s.id !== stepId),
    },
  };

  return workflowAutoSave(workflowId, nextWorkflow, [], [], [stepId]);
}
