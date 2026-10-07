import {AsyncLocalStorage} from 'node:async_hooks';
export const bindings=new AsyncLocalStorage<any>();
export const env=new Proxy({} as any,{get:(_,key)=>bindings.getStore()?.[key]});
export function database(){if(!env.DB)throw Error('Database unavailable');return env.DB;}
export function bucket(){if(!env.BUCKET)throw Error('Storage unavailable');return env.BUCKET;}
