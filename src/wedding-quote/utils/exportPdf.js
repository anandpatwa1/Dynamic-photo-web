/** One full-poster PDF page; embeds the same JPEG pixels as image export. */
export const canvasToPdf = async (canvas) => {
  const jpeg = await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PDF image failed')),'image/jpeg',.98));
  const image=new Uint8Array(await jpeg.arrayBuffer()), enc=new TextEncoder();
  const pageW=595.28,pageH=pageW*canvas.height/canvas.width;
  const content=enc.encode(`q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`);
  const parts=[enc.encode('%PDF-1.4\n')],offsets=[0];let length=parts[0].length;
  const append=part=>{parts.push(part);length+=part.length};
  const object=(id,pieces)=>{offsets[id]=length;append(enc.encode(`${id} 0 obj\n`));for(const p of pieces)append(typeof p==='string'?enc.encode(p):p);append(enc.encode('\nendobj\n'));};
  object(1,['<< /Type /Catalog /Pages 2 0 R >>']);
  object(2,['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  object(3,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`]);
  object(4,[`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,image,'\nendstream']);
  object(5,[`<< /Length ${content.length} >>\nstream\n`,content,'\nendstream']);
  const xref=length;append(enc.encode(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
  return new Blob(parts,{type:'application/pdf'});
};
