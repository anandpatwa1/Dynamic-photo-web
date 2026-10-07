const n=()=>{const r=Math.floor(Date.now()/1e3).toString(16).padStart(8,"0");let t="";for(let o=0;o<16;o+=1)t+=Math.floor(Math.random()*16).toString(16);return r+t};export{n};
