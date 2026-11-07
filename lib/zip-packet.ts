/** Small, dependency-free STORE-format ZIP writer for controlled DMV packets.
 * The packet is generated only after an authenticated privileged request.
 * ZIP itself is not encrypted; export/download must go via an authorized
 * protected destination. Sensitive packet bytes are never stored in database.
 */
const enc=new TextEncoder();
function crc32(b:Uint8Array){let crc=0xffffffff;for(const byte of b){crc^=byte;for(let i=0;i<8;i++)crc=crc>>>1 ^ (crc&1?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function write16(x:Uint8Array,p:number,n:number){x[p]=n&255;x[p+1]=(n>>>8)&255;}
function write32(x:Uint8Array,p:number,n:number){write16(x,p,n);write16(x,p+2,n>>>16);}
export function createZip(files:{name:string;data:Uint8Array}[]){
 if(files.length>65)throw Error('Too many attachments for a single roster packet');
 let offset=0;const locals:Uint8Array[]=[],dirs:Uint8Array[]=[];
 for(const file of files){
  const name=enc.encode(file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,140)),data=file.data;
  if(!name.length||data.byteLength>11000000)throw Error('Attachment invalid or too large');
  const checksum=crc32(data);
  const local=new Uint8Array(30+name.length+data.length);
  write32(local,0,0x04034b50);write16(local,4,20);write16(local,6,2048);write16(local,8,0);write32(local,14,checksum);
  write32(local,18,data.length);write32(local,22,data.length);write16(local,26,name.length);
  local.set(name,30);local.set(data,30+name.length);locals.push(local);
  const dir=new Uint8Array(46+name.length);write32(dir,0,0x02014b50);write16(dir,4,20);write16(dir,6,20);write16(dir,8,2048);write16(dir,10,0);
  write32(dir,16,checksum);write32(dir,20,data.length);write32(dir,24,data.length);write16(dir,28,name.length);write32(dir,42,offset);dir.set(name,46);
  dirs.push(dir);offset+=local.length;
 }
 const size=dirs.reduce((n,d)=>n+d.length,0),total=offset+size+22;
 if(total>35000000)throw Error('Packet is too large; split the class or reduce attachment sizes');
 const out=new Uint8Array(total);let pos=0;
 for(const l of locals){out.set(l,pos);pos+=l.length;}
 for(const d of dirs){out.set(d,pos);pos+=d.length;}
 write32(out,pos,0x06054b50);write16(out,pos+8,files.length);write16(out,pos+10,files.length);
 write32(out,pos+12,size);write32(out,pos+16,offset);
 return out;
}
