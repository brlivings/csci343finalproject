// HTTP requests to the free PubChem PUG REST API (no key required).
const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name';

export const structureImageUrl = (name, size = 300) =>
  `${BASE}/${encodeURIComponent(name)}/PNG?image_size=${size}x${size}`;

export async function fetchCompoundProperties(name, { signal } = {}) {
  const url = `${BASE}/${encodeURIComponent(
    name
  )}/property/MolecularFormula,MolecularWeight,IUPACName,XLogP/JSON`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`PubChem responded with ${res.status}`);
  const json = await res.json();
  const props = json?.PropertyTable?.Properties?.[0];
  if (!props) throw new Error('No data found');
  return {
    cid: props.CID,
    formula: props.MolecularFormula,
    weight: props.MolecularWeight ? Number(props.MolecularWeight).toFixed(2) : null,
    iupac: props.IUPACName,
    xlogp: props.XLogP ?? null,
  };
}
