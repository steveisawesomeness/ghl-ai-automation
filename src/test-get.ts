import { workflowGet } from './tools/workflow';

async function main() {
  const workflowId = '199f754c-8728-4f5b-a673-bc35d3a61bdf';
  console.log(`Fetching workflow ${workflowId}...`);
  const wf = await workflowGet(workflowId);
  console.log('--- SUMMARY ---');
  console.log('name:', wf.name);
  console.log('status:', wf.status);
  console.log('version:', wf.version);
  console.log('dataVersion:', wf.dataVersion);
  console.log('templates count:', wf.workflowData?.templates?.length);
  console.log('--- FULL JSON ---');
  console.log(JSON.stringify(wf, null, 2));
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
