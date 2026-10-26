import React from 'react';
import { createRoot } from 'react-dom/client';
import { QuoteCanvas } from '../components/QuoteCanvas';
import { buildSampleQuote, SAMPLE_STUDIO } from './sampleQuote';
import { registerBundledFonts, registerThemeFonts } from './fonts';
import { rasterize } from './exportJpg';

/** Always use sample data: library thumbnails must never capture a customer's quote. */
export const createThemeThumbnail = async theme => {
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-20000px;top:0;width:1080px;pointer-events:none';document.body.append(host);
  const root=createRoot(host);
  try{
    await Promise.all([registerBundledFonts(),registerThemeFonts(theme)]);
    root.render(<QuoteCanvas quote={buildSampleQuote(3)} theme={theme} studio={SAMPLE_STUDIO}/>);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const node=host.querySelector('[data-wq-canvas]');if(!node)return undefined;
    const height=parseFloat(node.style.height);const width=240;const canvas=await rasterize(node,{width:1080,height,outW:width,outH:Math.round(height*width/1080),theme,background:theme.definition.canvas.bg});
    return canvas.toDataURL('image/jpeg',.7);
  }finally{root.unmount();host.remove();}
};
