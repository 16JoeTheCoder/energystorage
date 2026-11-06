import { BRIEF } from '../../data/paramsMeta';
import type { Params } from '../types';
export const P = (o: Partial<Params> = {}): Params => ({ ...BRIEF, ...o });
