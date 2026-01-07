
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Aggregate, SieveData } from '../types';

interface Props {
  aggregates: Aggregate[];
  combinedCurve: SieveData[];
  idealCurve: SieveData[];
}

const GrainCurveChart: React.FC<Props> = ({ aggregates, combinedCurve, idealCurve }) => {
  // Combine data for charting
  const sieveSizes = Array.from(new Set([
    ...combinedCurve.map(s => s.size),
    ...idealCurve.map(s => s.size),
    ...aggregates.flatMap(a => a.sieves.map(s => s.size))
  ])).sort((a, b) => a - b);

  const chartData = sieveSizes.map(size => {
    const dataPoint: any = { size };
    aggregates.forEach(agg => {
      const s = agg.sieves.find(sieve => sieve.size === size);
      if (s) dataPoint[agg.name] = s.passing;
    });
    
    const combined = combinedCurve.find(s => s.size === size);
    if (combined) dataPoint['Mélange'] = combined.passing;

    const ideal = idealCurve.find(s => s.size === size);
    if (ideal) dataPoint['Idéale'] = ideal.passing;

    return dataPoint;
  });

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Courbes Granulométriques</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} />
          <XAxis 
            dataKey="size" 
            scale="log" 
            domain={['auto', 'auto']} 
            type="number"
            label={{ value: 'Ouverture Tamis (mm)', position: 'insideBottomRight', offset: -10 }}
          />
          <YAxis 
            domain={[0, 100]} 
            label={{ value: 'Passant Cumulé (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend verticalAlign="top" height={36}/>
          
          {aggregates.map((agg) => (
            <Line 
              key={agg.id}
              type="monotone" 
              dataKey={agg.name} 
              stroke={agg.color} 
              dot={false}
              strokeWidth={1}
              opacity={0.5}
            />
          ))}
          
          <Line 
            type="monotone" 
            dataKey="Mélange" 
            stroke="#000" 
            strokeWidth={3}
            dot={{ r: 4 }}
          />
          
          <Line 
            type="monotone" 
            dataKey="Idéale" 
            stroke="#94a3b8" 
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrainCurveChart;
