import {AsyncLocalStorage} from 'node:async_hooks';
export const identity=new AsyncLocalStorage<{userId:string;email:string;displayName:string}>();
