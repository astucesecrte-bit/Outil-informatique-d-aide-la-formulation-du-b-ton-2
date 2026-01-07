
import { Aggregate, FormulationParams, SieveData } from '../types';

/**
 * Calculates the combined granulometric curve based on proportions
 */
export const calculateCombinedCurve = (aggregates: Aggregate[]): SieveData[] => {
  const sieveSizes = Array.from(new Set(aggregates.flatMap(a => a.sieves.map(s => s.size)))).sort((a, b) => a - b);
  
  return sieveSizes.map(size => {
    let combinedPassing = 0;
    let totalProp = aggregates.reduce((acc, curr) => acc + curr.proportion, 0);
    
    if (totalProp === 0) return { size, passing: 0 };

    aggregates.forEach(agg => {
      const sieve = agg.sieves.find(s => s.size === size);
      if (sieve) {
        combinedPassing += sieve.passing * (agg.proportion / totalProp);
      }
    });
    
    return { size, passing: combinedPassing };
  });
};

/**
 * Generates the theoretical Dreux-Gorisse ideal curve points
 */
export const calculateIdealCurve = (Dmax: number, K: number): SieveData[] => {
  // Typical points for Dreux: 0, D/2, D
  // Y at D/2 is 50 + K + Correction
  const yAtDhalf = 50 + K;
  
  return [
    { size: 0.001, passing: 0 },
    { size: Dmax / 2, passing: yAtDhalf },
    { size: Dmax, passing: 100 }
  ];
};

/**
 * Main formulation calculation
 */
export const performFormulation = (aggregates: Aggregate[], params: FormulationParams) => {
  // 1. Volumes
  const vCement = params.cementDosage / params.cementDensity; // L/m3
  const vWater = params.cementDosage * params.waterCementRatio; // L/m3
  const vAir = params.airContent * 10; // 1% = 10L/m3
  
  const vAvailableForAgg = 1000 - vCement - vWater - vAir;
  
  // 2. Aggregate Volumes and Weights
  const totalProportion = aggregates.reduce((acc, a) => acc + a.proportion, 0) || 100;
  
  const aggResults = aggregates.map(agg => {
    const vol = vAvailableForAgg * (agg.proportion / totalProportion);
    const weightDry = vol * (agg.realDensity / 1000); // kg
    
    // Correction for moisture
    const waterInAgg = weightDry * (agg.moisture / 100);
    const weightWet = weightDry + waterInAgg;
    
    return {
      name: agg.name,
      volume: vol,
      weightDry: weightDry,
      weightWet: weightWet,
      waterInAgg: waterInAgg
    };
  });
  
  const totalWaterFromAgg = aggResults.reduce((acc, a) => acc + a.waterInAgg, 0);
  const effectiveWaterToAdd = vWater - totalWaterFromAgg;

  return {
    volumes: {
      cement: vCement,
      water: vWater,
      air: vAir,
      aggregates: aggResults.map(a => ({ name: a.name, volume: a.volume }))
    },
    weights: {
      cement: params.cementDosage,
      waterTotal: vWater,
      waterEffective: effectiveWaterToAdd,
      aggregates: aggResults.map(a => ({ name: a.name, weight: a.weightWet }))
    }
  };
};
