import { describe, it } from 'vitest';
import { generatePalette } from '@/lib/color/palette';
import type { ParameterVector } from '@/types/engine';
import { useMode, modeOklch, modeRgb, modeLrgb, modeLab65, converter, differenceCiede2000 } from 'culori/fn';
useMode(modeOklch); useMode(modeRgb); useMode(modeLrgb); useMode(modeLab65);
const toLab = converter('lab65');
const deltaE = differenceCiede2000();
function makeParams(overrides: Partial<ParameterVector> = {}): ParameterVector { return { complexity:0.5,warmth:0.5,symmetry:0.5,rhythm:0.5,energy:0.5,density:0.5,scaleVariation:0.5,curvature:0.5,saturation:0.5,contrast:0.5,layering:0.5,directionality:0.5,paletteSize:0.5,texture:0.5,regularity:0.5,...overrides }; }
describe('debug',()=>{
 it('logs',()=>{
  const cases = [
    ['baseline', makeParams({paletteSize:1}), 'test-seed-deterministic'],
    ['solar', makeParams({ warmth: 0.95, energy: 0.92, contrast: 0.82, saturation: 0.88, paletteSize: 0.8 }), 'diversity-solar'],
    ['lagoon', makeParams({ warmth: 0.12, energy: 0.18, contrast: 0.34, saturation: 0.58, paletteSize: 0.8 }), 'diversity-lagoon'],
    ['orchid', makeParams({ warmth: 0.66, energy: 0.46, contrast: 0.78, saturation: 0.74, paletteSize: 0.8 }), 'diversity-orchid'],
  ] as const;
  for (const [name, params, seed] of cases) {
    const result = generatePalette(params, seed);
    const avgHue = result.dark.reduce((s,c)=>s+c.oklch.h,0)/result.dark.length;
    let min = Infinity; let pair:any = null;
    for (let i=0;i<result.dark.length;i++) for (let j=i+1;j<result.dark.length;j++) { const a=toLab(result.dark[i].oklch); const b=toLab(result.dark[j].oklch); if(!a||!b) continue; const d=deltaE(a,b); if(d<min){min=d; pair=[i,j,d,result.dark[i].oklch,result.dark[j].oklch];}}
    console.log(name, result.familyId, 'avgHue', avgHue, 'min', pair, 'chromaDiffMax', Math.max(...result.dark.map((c,i)=>Math.abs(c.oklch.c-result.light[i].oklch.c))));
  }
 });
});