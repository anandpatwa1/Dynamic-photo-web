/** ObjectId-shaped ids generated on the client so new entries/lines keep a stable id through autosave. */
export const newObjectId = () => {
  const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  let rand = '';
  for (let i = 0; i < 16; i += 1) rand += Math.floor(Math.random() * 16).toString(16);
  return ts + rand;
};
