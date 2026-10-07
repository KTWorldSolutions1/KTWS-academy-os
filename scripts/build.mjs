import {build} from 'vite';
import {mkdirSync,copyFileSync} from 'node:fs';
await build({build:{outDir:'dist'}});
await build({build:{ssr:'server/index.ts',outDir:'dist-server',rollupOptions:{input:'server/index.ts'}}});
await build({build:{ssr:'server/setup-owner.ts',outDir:'dist-setup',rollupOptions:{input:'server/setup-owner.ts'}}});
mkdirSync('dist-server',{recursive:true});copyFileSync('dist-setup/setup-owner.js','dist-server/setup-owner.js');
