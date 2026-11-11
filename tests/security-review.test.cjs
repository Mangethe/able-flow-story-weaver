const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {schema, parseReport, criticalCount} = require('../.github/scripts/security-contract.cjs');
const {runReview} = require('../.github/scripts/security-review.cjs');
const finding = severity => ({severity, file:'index.html', line:42, description:'A concrete vulnerability and its exploit conditions.'});

test('all severity values and an explicitly empty findings list are valid', () => {
  assert.equal(criticalCount(parseReport(JSON.stringify({findings:['critical','high','medium','low'].map(finding)}))), 1);
  assert.deepEqual(parseReport('{"findings":[]}'), {findings:[]});
});

test('missing fields, extra fields, unknown severity and invalid locations fail closed', () => {
  for (const field of ['severity','file','line','description']) {
    const incomplete = finding('critical'); delete incomplete[field];
    assert.throws(() => parseReport(JSON.stringify({findings:[incomplete]})));
  }
  for (const changes of [{severity:'urgent'},{severity:'CRITICAL'},{line:0},{line:1.5},{line:'42'},{line:null},{file:''},{description:''},{extra:true}]) {
    assert.throws(() => parseReport(JSON.stringify({findings:[{...finding('high'),...changes}]})));
  }
  for (const report of [{},{findings:null},{findings:'No issues'},[],{findings:[],summary:'clean'}]) assert.throws(() => parseReport(JSON.stringify(report)));
});

test('prose, markdown-fenced JSON and incomplete JSON cannot pass as a clean review', () => {
  for (const raw of ['No critical issues found.', '```json\n{"findings":[]}\n```', '{"findings":', '', 'null']) assert.throws(() => parseReport(raw));
});

test('SDK runner supplies outputSchema and rejects an unstructured final response', async () => {
  let options;
  const codex = {startThread() {return {async run(prompt, settings) {options=settings;return {finalResponse:'{"findings":[]}'};}};}};
  assert.deepEqual(await runReview(codex, 'Review a test diff.'), {findings:[]});
  assert.equal(options.outputSchema, schema);
  assert.ok(options.signal instanceof AbortSignal);
  await assert.rejects(runReview({startThread(){return {async run(){return {finalResponse:'Looks safe.'};}};}}, 'Review'));
  await assert.rejects(runReview({startThread(){return {async run(){throw new Error('API failure');}};}}, 'Review'));
});

test('CLI gate passes valid noncritical reports and blocks critical, missing and malformed output', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'able-flow-security-'));
  const gate = path.resolve(__dirname,'../.github/scripts/security-contract.cjs');
  const output = path.join(directory,'findings.json');
  try {
    for (const [report,status] of [[{findings:[]},0],[{findings:[finding('high')]},0],[{findings:[finding('critical')]},1],[{findings:[{severity:'critical'}]},1]]) {
      fs.writeFileSync(output,JSON.stringify(report));
      assert.equal(spawnSync(process.execPath,[gate,output],{encoding:'utf8'}).status,status);
    }
    fs.writeFileSync(output,'Review completed: no problems.');
    assert.equal(spawnSync(process.execPath,[gate,output],{encoding:'utf8'}).status,1);
    assert.equal(spawnSync(process.execPath,[gate,path.join(directory,'missing.json')],{encoding:'utf8'}).status,1);
  } finally {
    fs.unlinkSync(output);fs.rmdirSync(directory);
  }
});
