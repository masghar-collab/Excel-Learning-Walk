
export interface TeachingStrategies {
  miniWhiteboards: boolean;
  thinkPairShare: boolean;
  dumtums: boolean;
  coldCalling: boolean;
}

export type YearGroup = 'Year 7' | 'Year 8' | 'Year 9' | 'Year 10' | 'Year 11';

export interface Observation {
  id: string;
  dateTime: string;
  yearGroup: YearGroup | '';
  teacherName: string;
  observationNotes: string;
  strategies: TeachingStrategies;
}
