import {build} from 'vite';
import {resolve,dirname} from 'node:path';
const adapters=new Set([resolve('lib/storage.ts'),resolve('lib/env.ts')]);
await build({build:{outDir:'dist'}});
await build({plugins:[{name:'independent-cloudflare-runtime',enforce:'pre',resolveId(source,importer){if(importer&&source.startsWith('.')){const full=resolve(dirname(importer),source.replace(/\.ts$/,''))+'.ts';if(adapters.has(full))return resolve('cloudflare/runtime.ts');}}}],build:{ssr:'cloudflare/worker.ts',outDir:'dist-worker',rollupOptions:{input:'cloudflare/worker.ts',external:['cloudflare:workers']}}});
