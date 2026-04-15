import { workflowGet } from './tools/workflow';

async function main() {
  const id = 'fecd049f-3287-4bcc-91c6-7ff8742d9b39';
  const wf = await workflowGet(id);
  console.log('name:', wf.name);
  console.log('status:', wf.status);
  console.log('version:', wf.version);
  console.log('dataVersion:', wf.dataVersion);
  console.log('templates count:', wf.workflowData?.templates?.length);
  console.log('\n--- TEMPLATES ---');
  console.log(JSON.stringify(wf.workflowData?.templates, null, 2));
  console.log('\n--- TRIGGERS ---');
  console.log('newTriggers:', JSON.stringify((wf as any).newTriggers));
  console.log('oldTriggers:', JSON.stringify((wf as any).oldTriggers));
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
