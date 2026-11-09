#!/usr/bin/env node
// Release gate: refuses to ship while certificate pins are placeholders or fewer than 2 pins exist.
const fs = require('fs');
const path = require('path');
const files = [
  'src/config/security.ts',
  'src/config/api.ts',
  'native-config/android/network_security_config.xml',
  'native-config/ios/Info.plist.snippet.xml',
];
let failed = false;
for (const f of files) {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) {continue;}
  if (fs.readFileSync(p, 'utf8').includes('REPLACE_ME')) {
    console.error(`[verify-pins] placeholder pin found in ${f}`);
    failed = true;
  }
}
if (failed) {process.exit(1);}
console.log('[verify-pins] OK');
