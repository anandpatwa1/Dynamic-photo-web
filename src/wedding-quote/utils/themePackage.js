/** Browser ZIP writer (STORE); no executable content, one theme per package. */
const encoder = new TextEncoder();
const crc32 = data => { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let i=0;i<8;i++) crc = (crc>>>1)^((crc&1)?0xedb88320:0); } return (crc^0xffffffff)>>>0; };
export const packageTheme = async (theme, textAssets = {}) => {
  const files = [{ name: 'theme.json', data: encoder.encode(JSON.stringify(theme.definition)) }];
  for (const asset of theme.assets ?? []) {
    const response = await fetch(asset.url);
    files.push({ name: asset.key, data: new Uint8Array(await response.arrayBuffer()) });
  }
  for (const [name, text] of Object.entries(textAssets)) files.push({ name, data: encoder.encode(text) });
  const locals=[], centrals=[]; let offset=0;
  for (const file of files) {
    const name=encoder.encode(file.name); const crc=crc32(file.data); const local=new Uint8Array(30); const l=new DataView(local.buffer);
    l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);l.setUint32(14,crc,true);l.setUint32(18,file.data.length,true);l.setUint32(22,file.data.length,true);l.setUint16(26,name.length,true);
    locals.push(local,name,file.data);const central=new Uint8Array(46);const c=new DataView(central.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);c.setUint32(20,file.data.length,true);c.setUint32(24,file.data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);centrals.push(central,name);offset+=30+name.length+file.data.length;
  }
  const centralSize=centrals.reduce((n,a)=>n+a.length,0);const end=new Uint8Array(22);const e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
  return new File([...locals,...centrals,end], 'theme.zip', {type:'application/zip'});
};
