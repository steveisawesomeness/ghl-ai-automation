import { workflowGet, workflowUpdate } from './tools/workflow';

async function main() {
  const id = 'fecd049f-3287-4bcc-91c6-7ff8742d9b39';

  console.log('1. Reading current state...');
  const before = await workflowGet(id);
  const originalName = before.name;
  const originalVersion = before.version;
  console.log(`   name="${originalName}" version=${originalVersion}`);

  const newName = `${originalName} [MCP-WRITE-TEST ${Date.now()}]`;
  console.log(`\n2. PUT with name="${newName}"...`);
  const modified = { ...before, name: newName };
  const putResult = await workflowUpdate(id, modified);
  console.log(`   PUT returned version=${putResult.version}`);

  console.log('\n3. Re-reading to confirm persistence...');
  const after = await workflowGet(id);
  console.log(`   name="${after.name}" version=${after.version}`);

  if (after.name === newName) {
    console.log('\n✅ WRITE SUCCESS — name changed and persisted');
  } else {
    console.log(`\n❌ WRITE FAILED — expected "${newName}", got "${after.name}"`);
    process.exit(1);
  }

  console.log('\n4. Restoring original name...');
  const restored = { ...after, name: originalName };
  await workflowUpdate(id, restored);
  const final = await workflowGet(id);
  console.log(`   name="${final.name}" version=${final.version}`);
  if (final.name === originalName) {
    console.log('\n✅ RESTORE SUCCESS');
  } else {
    console.log('\n⚠ RESTORE FAILED — name still modified, fix manually in UI');
  }
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
