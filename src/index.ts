import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  workflowGet,
  workflowUpdate,
  workflowAddStep,
  workflowModifyStep,
  workflowDeleteStep,
} from './tools/workflow';

const server = new McpServer({
  name: 'ghl-internal-api',
  version: '0.1.0',
});

server.tool(
  'workflow_get',
  'Get a GHL workflow by ID — returns full step tree',
  {
    workflowId: z.string().describe('The GHL workflow UUID'),
  },
  async ({ workflowId }) => {
    try {
      const workflow = await workflowGet(workflowId);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(workflow, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'workflow_update',
  'Update a GHL workflow — modifies steps in the step tree and saves',
  {
    workflowId: z.string().describe('The GHL workflow UUID'),
    workflow: z.string().describe('Full workflow object as JSON string'),
    modifiedSteps: z.array(z.string()).optional().describe('Step IDs that were modified'),
    createdSteps: z.array(z.string()).optional().describe('New step IDs being added'),
    deletedSteps: z.array(z.string()).optional().describe('Step IDs to delete'),
  },
  async ({ workflowId, workflow, modifiedSteps, createdSteps, deletedSteps }) => {
    try {
      const parsed = JSON.parse(workflow);
      const result = await workflowUpdate(
        workflowId,
        parsed,
        modifiedSteps || [],
        createdSteps || [],
        deletedSteps || []
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

const stepShape = {
  id: z.string().optional(),
  name: z.string(),
  type: z.string(),
  order: z.number().optional(),
  parent: z.string().optional(),
  parentKey: z.string().optional(),
  next: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
};

server.tool(
  'workflow_add_step',
  'Add a step to a GHL workflow via auto-save. Read-modify-write: GETs the workflow, appends the step, and PUTs to /auto-save with createdSteps delta.',
  {
    workflowId: z.string().describe('The GHL workflow UUID'),
    step: z.object(stepShape).describe('Step to add — id is generated if omitted'),
  },
  async ({ workflowId, step }) => {
    try {
      const result = await workflowAddStep(workflowId, step);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'workflow_modify_step',
  'Modify a step in a GHL workflow via auto-save. Read-modify-write: GETs the workflow, merges patch into the target step, and PUTs to /auto-save with modifiedSteps delta. Top-level fields are replaced; attributes are shallow-merged.',
  {
    workflowId: z.string().describe('The GHL workflow UUID'),
    stepId: z.string().describe('ID of the step to modify'),
    patch: z
      .object({
        name: z.string().optional(),
        type: z.string().optional(),
        order: z.number().optional(),
        parent: z.string().optional(),
        parentKey: z.string().optional(),
        next: z.string().optional(),
        attributes: z.record(z.string(), z.unknown()).optional(),
      })
      .describe('Partial step — merged into the existing step'),
  },
  async ({ workflowId, stepId, patch }) => {
    try {
      const result = await workflowModifyStep(workflowId, stepId, patch);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'workflow_delete_step',
  'Delete a step from a GHL workflow via auto-save. Read-modify-write: GETs the workflow, removes the step from templates, and PUTs to /auto-save with deletedSteps delta.',
  {
    workflowId: z.string().describe('The GHL workflow UUID'),
    stepId: z.string().describe('ID of the step to delete'),
  },
  async ({ workflowId, stepId }) => {
    try {
      const result = await workflowDeleteStep(workflowId, stepId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GHL Internal API MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
