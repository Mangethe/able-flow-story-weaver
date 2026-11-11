const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');

const schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../.codex/security-schema.json'), 'utf8'));
const validate = new Ajv({allErrors: true, strict: true}).compile(schema);

function parseReport(raw) {
  // Deliberately reject markdown fences, prose and missing/partial responses.
  const report = JSON.parse(raw);
  if (!validate(report)) throw new Error('Security findings do not match security-schema.json.');
  return report;
}

function criticalCount(report) {
  return report.findings.filter(finding => finding.severity === 'critical').length;
}

if (require.main === module) {
  try {
    const report = parseReport(fs.readFileSync(process.argv[2] || 'findings.json', 'utf8'));
    const count = criticalCount(report);
    console.log(`Validated ${report.findings.length} security findings; ${count} critical.`);
    if (count > 0) {
      console.error(`::error::${count} critical security findings block this check.`);
      process.exitCode = 1;
    }
  } catch {
    console.error('::error::Security review output is missing, invalid JSON, or does not match the required schema.');
    process.exitCode = 1;
  }
}

module.exports = {schema, parseReport, criticalCount};
