import { workflowGet } from '../src/tools/workflow';

(async () => {
  const w = await workflowGet('fecd049f-3287-4bcc-91c6-7ff8742d9b39');
  console.log('name:', w.name);
  console.log('status:', w.status);
  console.log('version:', w.version);
  console.log('templates:', (w.workflowData?.templates ?? []).length);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
