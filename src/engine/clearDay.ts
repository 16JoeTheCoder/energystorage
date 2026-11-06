import data from '../data/clearDay.json';
import type { Cooling } from './types';

export interface ClearDay { source: string; hour: number[]; irr: number[]; tLand: number[]; tFloat: number[]; tFilm: number[]; tSpray: number[]; ref: { solar_MW: number[]; store_MWh: number[] }; }
export const clearDay = data as ClearDay;

export const tempSeries = (c: Cooling): number[] =>
  c === 'land' ? clearDay.tLand : c === 'float' ? clearDay.tFloat : c === 'film' ? clearDay.tFilm : clearDay.tSpray;
