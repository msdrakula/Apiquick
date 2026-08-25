const fs = require('fs');
let content = fs.readFileSync('src/utils/executor.ts', 'utf8');
content = content.replace('const nonce = authHeader.match(/nonce="([^"]+")/)?.[1] || \'\';', 'const nonce = authHeader.match(/nonce="([^"]+)"/)?.[1] || \'\';');
content = content.replace('const opaque = authHeader.match(/opaque="([^"]+")/)?.[1] || \'\';', 'const opaque = authHeader.match(/opaque="([^"]+)"/)?.[1] || \'\';');
content = content.replace("const qop = authHeader.match(/qop=\"([^\"]+")/)?.[1] || 'auth';", "const qop = authHeader.match(/qop=\"([^\"]+)\"/))?.[1] || 'auth';");
fs.writeFileSync('src/utils/executor.ts', content);
console.log('Fixed executor.ts');
