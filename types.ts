
export interface SieveData {
  size: number;
  passing: number;
}

export interface Aggregate {
  id: string;
  name: string;
  realDensity: number; // kg/m3
  bulkDensity: number; // kg/m3
  moisture: number; // %
  absorption: number; // %
  sieves: SieveData[];
  proportion: number; // % (in the mix)
  color: string;
}

export interface FormulationParams {
  cementType: string;
  cementDensity: number;
  cementDosage: number; // kg/m3
  waterCementRatio: number;
  airContent: number; // %
  slumpTarget: 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
  vibrationLevel: 'Faible' | 'Normale' | 'Forte';
}

export interface FormulationResult {
  weights: {
    cement: number;
    waterTotal: number;
    waterEffective: number;
    aggregates: { name: string; weight: number }[];
    admixtures: number;
  };
  volumes: {
    cement: number;
    water: number;
    air: number;
    aggregates: { name: string; volume: number }[];
  };
}
