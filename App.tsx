
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BeakerIcon, 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  PlusIcon, 
  TrashIcon, 
  CalculatorIcon 
} from '@heroicons/react/24/outline';
import { Aggregate, FormulationParams, SieveData } from './types';
import { AGGREGATE_COLORS, STANDARD_SIEVES, SLUMP_CLASSES } from './constants';
import GrainCurveChart from './components/GrainCurveChart';
import { calculateCombinedCurve, calculateIdealCurve, performFormulation } from './services/dreuxLogic';

const App: React.FC = () => {
  // -- State --
  const [aggregates, setAggregates] = useState<Aggregate[]>([
    {
      id: '1',
      name: 'Sable 0/4',
      realDensity: 2650,
      bulkDensity: 1500,
      moisture: 3,
      absorption: 1,
      proportion: 40,
      color: AGGREGATE_COLORS[0],
      sieves: [
        { size: 0.063, passing: 2 },
        { size: 0.125, passing: 5 },
        { size: 0.25, passing: 15 },
        { size: 0.5, passing: 35 },
        { size: 1, passing: 60 },
        { size: 2, passing: 85 },
        { size: 4, passing: 100 }
      ]
    },
    {
      id: '2',
      name: 'Gravillon 4/20',
      realDensity: 2700,
      bulkDensity: 1450,
      moisture: 1,
      absorption: 0.5,
      proportion: 60,
      color: AGGREGATE_COLORS[1],
      sieves: [
        { size: 4, passing: 5 },
        { size: 8, passing: 30 },
        { size: 10, passing: 50 },
        { size: 16, passing: 90 },
        { size: 20, passing: 100 }
      ]
    }
  ]);

  const [params, setParams] = useState<FormulationParams>({
    cementType: 'CEM II 42.5',
    cementDensity: 3100,
    cementDosage: 350,
    waterCementRatio: 0.5,
    airContent: 2,
    slumpTarget: 'S3',
    vibrationLevel: 'Normale'
  });

  const [activeTab, setActiveTab] = useState<'data' | 'calc' | 'results'>('data');

  // -- Computed Values --
  const combinedCurve = useMemo(() => calculateCombinedCurve(aggregates), [aggregates]);
  
  const Dmax = useMemo(() => {
    const allSieves = aggregates.flatMap(a => a.sieves.filter(s => s.passing >= 95).map(s => s.size));
    return allSieves.length > 0 ? Math.max(...allSieves) : 20;
  }, [aggregates]);

  const idealCurve = useMemo(() => {
    // Basic K calculation simplified for example
    // In real Dreux, K depends on Dmax, slump, and angularity
    let K = params.slumpTarget === 'S1' ? -2 : params.slumpTarget === 'S3' ? 0 : 2;
    return calculateIdealCurve(Dmax, K);
  }, [Dmax, params.slumpTarget]);

  const results = useMemo(() => performFormulation(aggregates, params), [aggregates, params]);

  // -- Handlers --
  const addAggregate = () => {
    if (aggregates.length >= 5) return;
    const newAgg: Aggregate = {
      id: Date.now().toString(),
      name: `Nouveau Granulat`,
      realDensity: 2650,
      bulkDensity: 1500,
      moisture: 0,
      absorption: 0,
      proportion: 0,
      color: AGGREGATE_COLORS[aggregates.length],
      sieves: []
    };
    setAggregates([...aggregates, newAgg]);
  };

  const removeAggregate = (id: string) => {
    setAggregates(aggregates.filter(a => a.id !== id));
  };

  const updateAggregate = (id: string, field: keyof Aggregate, value: any) => {
    setAggregates(aggregates.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const updateSieve = (aggId: string, size: number, passing: number) => {
    setAggregates(aggregates.map(agg => {
      if (agg.id !== aggId) return agg;
      const existing = agg.sieves.find(s => s.size === size);
      const newSieves = existing 
        ? agg.sieves.map(s => s.size === size ? { ...s, passing } : s)
        : [...agg.sieves, { size, passing }].sort((a, b) => a.size - b.size);
      return { ...agg, sieves: newSieves };
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-2 rounded-lg">
              <BeakerIcon className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">BétonExpert <span className="font-light text-slate-400">| Dreux-Gorisse</span></h1>
          </div>
          <nav className="hidden md:flex gap-6">
            <button 
              onClick={() => setActiveTab('data')}
              className={`text-sm font-medium transition-colors ${activeTab === 'data' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}
            >
              Données Granulats
            </button>
            <button 
              onClick={() => setActiveTab('calc')}
              className={`text-sm font-medium transition-colors ${activeTab === 'calc' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}
            >
              Paramètres Mélange
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`text-sm font-medium transition-colors ${activeTab === 'results' ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}
            >
              Résultats & Formulation
            </button>
          </nav>
          <div className="flex gap-2">
             <button className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-all" title="Exporter PDF">
               <DocumentArrowDownIcon className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-4 lg:p-8 space-y-8">
        
        {/* Tab 1: Aggregate Data */}
        {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <GrainCurveChart 
                  aggregates={aggregates} 
                  combinedCurve={combinedCurve} 
                  idealCurve={idealCurve} 
                />
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Saisie Granulométrique</h2>
                    <button 
                      onClick={addAggregate}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-all"
                    >
                      <PlusIcon className="w-4 h-4" /> Ajouter
                    </button>
                  </div>
                  
                  <table className="w-full min-w-[800px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Tamis (mm)</th>
                        {aggregates.map(agg => (
                          <th key={agg.id} className="p-3 text-center group">
                            <div className="flex flex-col items-center">
                              <span style={{ color: agg.color }} className="text-sm font-bold">{agg.name}</span>
                              <button onClick={() => removeAggregate(agg.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <TrashIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {STANDARD_SIEVES.filter(s => s <= 40).map(sieveSize => (
                        <tr key={sieveSize} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-medium text-slate-700">{sieveSize}</td>
                          {aggregates.map(agg => (
                            <td key={agg.id} className="p-2 text-center">
                              <input 
                                type="number" 
                                min="0" 
                                max="100"
                                value={agg.sieves.find(s => s.size === sieveSize)?.passing || ''}
                                onChange={(e) => updateSieve(agg.id, sieveSize, parseFloat(e.target.value) || 0)}
                                className="w-16 p-1 text-center border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar: Characteristics */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Caractéristiques</h2>
                  <div className="space-y-6">
                    {aggregates.map(agg => (
                      <div key={agg.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50/30">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agg.color }}></div>
                          <input 
                            value={agg.name} 
                            onChange={(e) => updateAggregate(agg.id, 'name', e.target.value)}
                            className="bg-transparent font-semibold text-sm outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase mb-1">Densité Réelle</label>
                            <input 
                              type="number"
                              value={agg.realDensity}
                              onChange={(e) => updateAggregate(agg.id, 'realDensity', parseFloat(e.target.value))}
                              className="w-full p-2 text-sm border border-slate-200 rounded bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase mb-1">Humidité (%)</label>
                            <input 
                              type="number"
                              value={agg.moisture}
                              onChange={(e) => updateAggregate(agg.id, 'moisture', parseFloat(e.target.value))}
                              className="w-full p-2 text-sm border border-slate-200 rounded bg-white"
                            />
                          </div>
                          <div className="col-span-2">
                             <label className="block text-[10px] text-slate-500 uppercase mb-1">Proportion dans le mélange (%)</label>
                             <input 
                              type="range"
                              min="0"
                              max="100"
                              value={agg.proportion}
                              onChange={(e) => updateAggregate(agg.id, 'proportion', parseInt(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-right text-xs font-bold text-blue-600 mt-1">{agg.proportion}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Total Proportions:</span>
                        <span className={`font-bold ${aggregates.reduce((acc, a) => acc + a.proportion, 0) === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {aggregates.reduce((acc, a) => acc + a.proportion, 0)} %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Mix Parameters */}
        {activeTab === 'calc' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <CalculatorIcon className="w-8 h-8 text-blue-600" />
                Paramètres de Formulation
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Section Ciment */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Liant (Ciment)</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type de ciment</label>
                    <input 
                      type="text" 
                      value={params.cementType}
                      onChange={(e) => setParams({...params, cementType: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Densité (kg/m³)</label>
                      <input 
                        type="number" 
                        value={params.cementDensity}
                        onChange={(e) => setParams({...params, cementDensity: parseFloat(e.target.value)})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Dosage (kg/m³)</label>
                      <input 
                        type="number" 
                        value={params.cementDosage}
                        onChange={(e) => setParams({...params, cementDosage: parseFloat(e.target.value)})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Eau / Air */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Fluides & Air</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rapport E/C souhaité</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={params.waterCementRatio}
                      onChange={(e) => setParams({...params, waterCementRatio: parseFloat(e.target.value)})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teneur en Air (%)</label>
                    <input 
                      type="number" 
                      value={params.airContent}
                      onChange={(e) => setParams({...params, airContent: parseFloat(e.target.value)})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Section Béton Final */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Objectifs Béton</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Classe d'affaissement</label>
                    <select 
                      value={params.slumpTarget}
                      onChange={(e) => setParams({...params, slumpTarget: e.target.value as any})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {Object.entries(SLUMP_CLASSES).map(([key, label]) => (
                        <option key={key} value={key}>{key} : {label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vibration</label>
                    <select 
                      value={params.vibrationLevel}
                      onChange={(e) => setParams({...params, vibrationLevel: e.target.value as any})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Faible">Faible</option>
                      <option value="Normale">Normale</option>
                      <option value="Forte">Forte</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 flex justify-center">
                <button 
                  onClick={() => setActiveTab('results')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-2xl shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 transform hover:-translate-y-1"
                >
                  <ChartBarIcon className="w-6 h-6" />
                  Calculer la Formulation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Results */}
        {activeTab === 'results' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Formulation Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Composition Pondérale (kg/m³)</h2>
                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium">Ciment ({params.cementType})</span>
                    <span className="font-bold">{results.weights.cement.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium">Eau Totale (Théorique)</span>
                    <span className="font-bold">{results.weights.waterTotal.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-50 text-blue-700 rounded-xl ring-1 ring-blue-100">
                    <span className="font-bold italic">Eau à ajouter (Efficace)</span>
                    <span className="font-bold">{results.weights.waterEffective.toFixed(1)} L</span>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Granulats (Humides)</p>
                    {results.weights.aggregates.map((agg, idx) => (
                      <div key={idx} className="flex justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                        <span>{agg.name}</span>
                        <span className="font-bold">{agg.weight.toFixed(1)} kg</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 mt-6 border-t border-dashed border-slate-200">
                    <div className="flex justify-between text-lg font-black text-slate-800 uppercase tracking-tighter">
                      <span>Total Masse Volumique</span>
                      <span>
                        {(results.weights.cement + results.weights.waterTotal + results.weights.aggregates.reduce((acc, a) => acc + a.weight, 0)).toFixed(0)} kg/m³
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volumetric Results */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Analyse Volumétrique (L/m³)</h2>
                <div className="h-[300px] flex items-end gap-2 mb-6 pt-4">
                  {/* Bar Chart Mockup with CSS */}
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-slate-200 rounded-t-lg transition-all" style={{ height: `${results.volumes.cement / 10}%` }}></div>
                    <span className="text-[10px] mt-2 text-slate-500 font-bold uppercase">Ciment</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-blue-400 rounded-t-lg transition-all" style={{ height: `${results.volumes.water / 10}%` }}></div>
                    <span className="text-[10px] mt-2 text-slate-500 font-bold uppercase">Eau</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-red-400 rounded-t-lg transition-all" style={{ height: `${results.volumes.air / 10}%` }}></div>
                    <span className="text-[10px] mt-2 text-slate-500 font-bold uppercase">Air</span>
                  </div>
                  {results.volumes.aggregates.map((agg, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-emerald-500 rounded-t-lg transition-all" style={{ height: `${agg.volume / 10}%` }}></div>
                      <span className="text-[10px] mt-2 text-slate-500 font-bold uppercase truncate w-full text-center px-1">{agg.name}</span>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 uppercase">Volume Liant</div>
                    <div className="text-xl font-bold">{results.volumes.cement.toFixed(1)} L</div>
                  </div>
                   <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 uppercase">Volume Eau</div>
                    <div className="text-xl font-bold">{results.volumes.water.toFixed(1)} L</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 uppercase">Volume Air</div>
                    <div className="text-xl font-bold">{results.volumes.air.toFixed(1)} L</div>
                  </div>
                   <div className="p-4 bg-blue-600 text-white rounded-xl">
                    <div className="text-xs text-blue-200 uppercase">Total Squelette</div>
                    <div className="text-xl font-bold">{(1000 - results.volumes.cement - results.volumes.water - results.volumes.air).toFixed(1)} L</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Curves */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-slate-900">Validation Granulaire</h2>
                 <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-black rounded"></div> Mélange</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 border-2 border-slate-300 border-dashed rounded"></div> Théorie</div>
                 </div>
               </div>
               <GrainCurveChart 
                  aggregates={aggregates} 
                  combinedCurve={combinedCurve} 
                  idealCurve={idealCurve} 
                />
            </div>
          </div>
        )}
      </main>

      {/* Footer / Status Bar */}
      <footer className="bg-white border-t border-slate-200 p-4 text-slate-500 text-xs text-center">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2025 BétonExpert - Outil pédagogique de formulation Dreux-Gorisse</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Calculs OK</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Squelette saturé</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
