import type { RegionArt } from './types';
import { REGION_ART_PNW } from './pnw';
import { REGION_ART_APPALACHIA } from './appalachia';
import { REGION_ART_GREATLAKES } from './greatlakes';
import { REGION_ART_SOUTHWEST } from './southwest';
import { REGION_ART_ATLANTIC } from './atlantic';

export { ICONS } from './icons';

export const REGION_ART: Record<string, RegionArt> = {
  pnw: REGION_ART_PNW,
  appalachia: REGION_ART_APPALACHIA,
  greatlakes: REGION_ART_GREATLAKES,
  southwest: REGION_ART_SOUTHWEST,
  atlantic: REGION_ART_ATLANTIC,
};
