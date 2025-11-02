
import type { TeachingStrategies, YearGroup } from './types';

export const YEAR_GROUPS: YearGroup[] = [
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
];

export const STRATEGY_KEYS: (keyof TeachingStrategies)[] = [
  'miniWhiteboards',
  'thinkPairShare',
  'dumtums',
  'coldCalling',
];

export const STRATEGY_LABELS: Record<keyof TeachingStrategies, string> = {
  miniWhiteboards: 'Use of mini whiteboards',
  thinkPairShare: 'Think-Pair-Share',
  dumtums: 'DUMTUMS',
  coldCalling: 'Cold calling',
};
