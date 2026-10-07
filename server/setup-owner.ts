import {sql} from '../lib/storage';
import {activation} from './auth';
const email=process.argv[2]?.trim().toLowerCase();if(!email||!email.includes('@')||!process.env.PUBLIC_ORIGIN)throw Error('Set PUBLIC_ORIGIN and run setup-owner with your owner email.');
const existing:any=sql.prepare("SELECT id FROM accounts WHERE id='academy-owner'").get();if(existing)throw Error('Owner already exists. Do not overwrite the account.');
sql.prepare('INSERT INTO accounts(id,email) VALUES(?,?)').run('academy-owner',email);
console.log('Owner activation link (expires in 30 minutes; treat as a password): '+process.env.PUBLIC_ORIGIN+'/activate#token='+activation('academy-owner'));
