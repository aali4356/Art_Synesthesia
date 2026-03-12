import { generatePalette } from '@/lib/color/palette';
import type { ParameterVector } from '@/types/engine';
import { converter, differenceCiede2000, useMode, modeOklch, modeRgb, modeLrgb, modeLab65 } from 'culori/fn';
useMode(modeOklch); useMode(modeRgb); useMode(modeLrgb); useMode(modeLab65);
const toLab = converter('lab65');
const deltaE = differenceCiede2000();
function makeParams(overrides: Partial<ParameterVector> = {}): ParameterVector { return { complexity:0.5,warmth:0.5,symmetry:0.5,rhythm:0.5,energy:0.5,density:0.5,scaleVariation:0.5,curvature:0.5,saturation:0.5,contrast:0.5,layering:0.5,directionality:0.5,paletteSize:0.5,texture:0.5,regularity:0.5,...overrides }; }
const cases:[string,ParameterVector,string][] = [
 ['baseline', makeParams({paletteSize:1}), 'test-seed-deterministic'],
 ['solar', makeParams({ warmth: 0.95, energy: 0.92, contrast: 0.82, saturation: 0.88, paletteSize: 0.8 }), 'diversity-solar'],
 ['lagoon', makeParams({ warmth: 0.12, energy: 0.18, contrast: 0.34, saturation: 0.58, paletteSize: 0.8 }), 'diversity-lagoon'],
 ['orchid', makeParams({ warmth: 0.66, energy: 0.46, contrast: 0.78, saturation: 0.74, paletteSize: 0.8 }), 'diversity-orchid'],
];
for (const [name, params, seed] of cases) {
 const result = generatePalette(params, seed);
 console.log('\nCASE', name, result.familyId, result.count);
 let min = Infinity, pair:[number,number,number]|null = null;
 for (let i=0;i<result.dark.length;i++) for (let j=i+1;j<result.dark.length;j++) {
   const a=toLab(result.dark[i].oklch), b=toLab(result.dark[j].oklch); if (!a||!b) continue;
   const d=deltaE(a,b); if (d<min) { min=d; pair=[i,j,d]; }
 }
 console.log('min dark deltaE', pair);
 console.log('max chroma diff', Math.max(...result.dark.map((c,i)=>Math.abs(c.oklch.c-result.light[i].oklch.c))));
 console.log(result.dark.map((c,i)=>({i,h:+c.oklch.h.toFixed(1),c:+c.oklch.c.toFixed(3),l:+c.oklch.l.toFixed(3), lc:+result.light[i].oklch.c.toFixed(3)})));
}
