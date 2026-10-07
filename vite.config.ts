import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({isSsrBuild})=>({plugins:[react()],build:isSsrBuild?{rollupOptions:{input:{index:'server/index.ts','setup-owner':'server/setup-owner.ts'}}}:{},server:{proxy:{'/api':'http://127.0.0.1:3000'}}}));
