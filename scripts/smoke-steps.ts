import {
  workflowGet,
  workflowAddStep,
  workflowModifyStep,
  workflowDeleteStep,
} from '../src/tools/workflow';

const WORKFLOW_ID = 'fecd049f-3287-4bcc-91c6-7ff8742d9b39';

function findTagStep(templates: any[], tag: string) {
  return templates.find(
    (s) =>
      s.type === 'add_contact_tag' &&
      Array.isArray(s.attributes?.tags) &&
      s.attributes.tags.includes(tag)
  );
}

async function main() {
  const results: Array<{ step: string; pass: boolean; detail: string }> = [];

  // --- 1. ADD ---
  let addedId = '';
  try {
    const added = await workflowAddStep(WORKFLOW_ID, {
      name: 'CC Smoke Test Tag',
      type: 'add_contact_tag',
      attributes: { tags: ['cc-test-1'] },
    });
    const verify = await workflowGet(WORKFLOW_ID);
    const found = findTagStep(verify.workflowData?.templates ?? [], 'cc-test-1');
    if (found) {
      addedId = found.id;
      results.push({
        step: 'ADD',
        pass: true,
        detail: `Step ${addedId} present with tag cc-test-1 (version ${verify.version})`,
      });
    } else {
      results.push({
        step: 'ADD',
        pass: false,
        detail: `auto-save returned version ${added.version} but no step with tag cc-test-1 found in GET`,
      });
    }
  } catch (e) {
    results.push({ step: 'ADD', pass: false, detail: (e as Error).message });
  }

  // --- 2. MODIFY ---
  if (addedId) {
    try {
      await workflowModifyStep(WORKFLOW_ID, addedId, {
        attributes: { tags: ['cc-test-2'] },
      });
      const verify = await workflowGet(WORKFLOW_ID);
      const step = (verify.workflowData?.templates ?? []).find(
        (s: any) => s.id === addedId
      );
      const tags = step?.attributes?.tags ?? [];
      const ok =
        step &&
        Array.isArray(tags) &&
        tags.includes('cc-test-2') &&
        !tags.includes('cc-test-1');
      results.push({
        step: 'MODIFY',
        pass: !!ok,
        detail: ok
          ? `Step ${addedId} tags now ${JSON.stringify(tags)} (version ${verify.version})`
          : `Step ${addedId} tags are ${JSON.stringify(tags)} — expected exactly ['cc-test-2']`,
      });
    } catch (e) {
      results.push({ step: 'MODIFY', pass: false, detail: (e as Error).message });
    }
  } else {
    results.push({ step: 'MODIFY', pass: false, detail: 'skipped — ADD did not produce an id' });
  }

  // --- 3. DELETE ---
  if (addedId) {
    try {
      await workflowDeleteStep(WORKFLOW_ID, addedId);
      const verify = await workflowGet(WORKFLOW_ID);
      const stillThere = (verify.workflowData?.templates ?? []).some(
        (s: any) => s.id === addedId
      );
      results.push({
        step: 'DELETE',
        pass: !stillThere,
        detail: stillThere
          ? `Step ${addedId} still present after delete`
          : `Step ${addedId} removed (version ${verify.version})`,
      });
    } catch (e) {
      results.push({ step: 'DELETE', pass: false, detail: (e as Error).message });
    }
  } else {
    results.push({ step: 'DELETE', pass: false, detail: 'skipped — ADD did not produce an id' });
  }

  console.log('\n=== SMOKE TEST RESULTS ===');
  for (const r of results) {
    console.log(`[${r.pass ? 'PASS' : 'FAIL'}] ${r.step}: ${r.detail}`);
  }
  console.log();

  const allPass = results.every((r) => r.pass);
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error('RUNNER CRASHED:', e);
  process.exit(2);
});
