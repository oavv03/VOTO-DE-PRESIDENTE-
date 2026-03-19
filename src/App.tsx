import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { ChevronDown, ChevronUp, Users, ClipboardList, Vote, BarChart3, MapPin, Globe } from 'lucide-react';
import { consolidateData, ElectionConsolidated, CircuitData, DistrictMayorData, CircuitDiputadoData } from './data/parser';
import { PROVINCE_METADATA } from './data/electionData';
import { cn } from './lib/utils';
import { CANDIDATE_PHOTOS, PARTY_LOGOS, CANDIDATE_TO_PARTIES, MAYOR_PROVINCE_IMAGES } from './constants';
import { ExportMenu } from './components/ExportMenu';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PROVINCE_ORDER = [
  "Bocas del Toro", "Coclé", "Colón", "Chiriquí", "Darién", "Herrera",
  "Los Santos", "Panamá", "Veraguas", "Comarca Kuna Yala",
  "Comarca Ngäbe Buglé", "Panamá Oeste", "Comarca Embera Wounaan",
  "Comarca Kuna de Madungandi", "Comarca Kuna de Wargandí", "Comarca Naso Tjër Di"
];

const CANDIDATE_COLORS = [
  '#003366', '#0055aa', '#4caf50', '#ffeb3b', '#f44336', '#9c27b0', '#ff9800', '#795548'
];

const MayorDetails = ({ district, data, province }: { district: string; data: DistrictMayorData; province: string }) => {
  const sortedCandidates = useMemo(() => {
    return Object.values(data).sort((a, b) => b.total - a.total);
  }, [data]);

  const districtSummary = useMemo(() => {
    const totalValidos = Object.values(data).reduce((acc, c) => acc + c.total, 0);
    return {
      cen: 0, // Not available at district level in current data
      mes: 0,
      pad: 0,
      val: totalValidos,
      part: "0" // Not available
    };
  }, [data]);

  const exportData = useMemo(() => {
    const cand: Record<string, number> = {};
    Object.values(data).forEach(c => {
      cand[c.candidate] = c.total;
    });

    const party: Record<string, number> = {};
    Object.values(data).forEach(cand => {
      Object.entries(cand.parties).forEach(([p, v]) => {
        party[p] = (party[p] || 0) + (v as number);
      });
    });

    return { cand, party };
  }, [data]);

  const labels = sortedCandidates.map(c => c.candidate);
  const values = sortedCandidates.map(c => c.total);

  const barData = {
    labels,
    datasets: [{
      label: 'Votos',
      data: values,
      backgroundColor: '#0055aa',
    }]
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-blue-900 font-bold">
          <Users size={18} />
          <span>Detalles del Distrito {district}</span>
        </div>
        <ExportMenu 
          province={province} 
          summary={districtSummary} 
          data={exportData} 
          circuit={district} 
          label="Distrito" 
        />
      </div>
      <div className="mb-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-blue-600 pl-2 bg-gray-100 py-1">
          Votos por Candidato - {district}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          {sortedCandidates.map((c) => (
            <div key={c.candidate} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[100px]">
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {Object.entries(c.parties).filter(([, v]) => (v as number) > 0).map(([p]) => (
                  <img 
                    key={p}
                    src={PARTY_LOGOS[p]} 
                    alt={p} 
                    className="w-10 h-7 object-contain shadow-sm border border-gray-100 rounded-sm"
                    referrerPolicy="no-referrer"
                    title={p}
                  />
                ))}
              </div>
              <div className="text-lg font-black text-blue-900">
                {c.total.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 h-[300px]">
          <Bar
            data={barData}
            options={{
              indexAxis: 'y' as const,
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } }
            }}
          />
        </div>
      </div>
    </div>
  );
};

const CircuitDetails = ({ circuit, data, province }: { circuit: string; data: CircuitData; province: string }) => {
  const participation = ((data.tec.emi / data.tec.pad) * 100).toFixed(2);
  const circuitSummary = {
    cen: data.tec.cen,
    mes: data.tec.mes,
    pad: data.tec.pad,
    val: data.tec.val,
    part: participation
  };

  const sortedCandidates = useMemo(() => {
    return Object.entries(data.cand)
      .sort(([, a], [, b]) => b - a);
  }, [data.cand]);

  const candidateLabels = sortedCandidates.map(([l]) => l);
  const candidateValues = sortedCandidates.map(([, v]) => v);

  const sortedAlliances = useMemo(() => {
    return [
      { name: "PRD + MOLIRENA", parties: ["PRD", "MOLIRENA"] },
      { name: "RM + ALIANZA", parties: ["RM", "ALIANZA"] },
      { name: "CD + PANAMEÑISTA", parties: ["CD", "PANAMEÑISTA"] },
      { name: "MELINTON LP + PAIS", parties: ["LP3", "PAIS"] }
    ].map(alliance => ({
      ...alliance,
      votes: alliance.parties.reduce((acc, p) => acc + (data.party[p] || 0), 0)
    })).sort((a, b) => b.votes - a.votes);
  }, [data.party]);

  const sortedParties = useMemo(() => {
    return Object.entries(data.party)
      .sort(([, a], [, b]) => b - a);
  }, [data.party]);

  const partyLabels = sortedParties.map(([l]) => l);
  const partyValues = sortedParties.map(([, v]) => v);

  const candidateBarData = {
    labels: candidateLabels,
    datasets: [{
      label: 'Votos',
      data: candidateValues,
      backgroundColor: '#0055aa',
    }]
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-blue-900 font-bold">
          <Users size={18} />
          <span>Participación: {participation}%</span>
        </div>
        <ExportMenu province={province} summary={circuitSummary} data={data} circuit={circuit} />
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-blue-600 pl-2 bg-gray-100 py-1">
          Datos de Control
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="p-2 border border-gray-200">Escrutadas</th>
                <th className="p-2 border border-gray-200">Padrón</th>
                <th className="p-2 border border-gray-200">Válidos</th>
                <th className="p-2 border border-gray-200">Blancos</th>
                <th className="p-2 border border-gray-200">Nulos</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-gray-200">{data.tec.esc}</td>
                <td className="p-2 border border-gray-200">{data.tec.pad.toLocaleString()}</td>
                <td className="p-2 border border-gray-200">{data.tec.val.toLocaleString()}</td>
                <td className="p-2 border border-gray-200">{data.tec.bla.toLocaleString()}</td>
                <td className="p-2 border border-gray-200">{data.tec.nul.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-blue-600 pl-2 bg-gray-100 py-1">
          Votos por Candidato
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {sortedCandidates.map(([l, v]) => (
            <div key={l} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
              <div className="relative mb-2">
                {CANDIDATE_PHOTOS[l] ? (
                  <img 
                    src={CANDIDATE_PHOTOS[l]} 
                    alt={l} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                    <Users className="text-gray-400" size={24} />
                  </div>
                )}
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1 line-clamp-1">
                {l}
              </div>
              <div className="text-sm font-black text-blue-900">
                {v.toLocaleString()}
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {(CANDIDATE_TO_PARTIES[l] || []).map(p => (
                  <img 
                    key={p}
                    src={PARTY_LOGOS[p]} 
                    alt={p} 
                    className="w-6 h-4 object-contain"
                    referrerPolicy="no-referrer"
                    title={p}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 h-[300px] mb-8">
          <Bar
            data={candidateBarData}
            options={{
              indexAxis: 'y' as const,
              responsive: true,
              maintainAspectRatio: false,
              layout: {
                padding: {
                  left: 10
                }
              },
              scales: {
                y: {
                  ticks: {
                    padding: 10
                  }
                }
              },
              plugins: { 
                legend: { display: false },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: (context) => `Votos: ${context.parsed.x.toLocaleString()}`
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-blue-600 pl-2 bg-gray-100 py-1">
          Votos por Alianza
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {sortedAlliances.map((alliance) => {
            return (
              <div key={alliance.name} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                <div className="flex gap-1 justify-center items-center mb-2">
                  {alliance.parties.map((p, idx) => (
                    <img 
                      key={idx}
                      src={PARTY_LOGOS[p]} 
                      alt={p} 
                      className="w-10 h-8 object-contain border border-gray-100 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1 line-clamp-1">
                  {alliance.name}
                </div>
                <div className="text-sm font-black text-blue-900">
                  {alliance.votes.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-blue-600 pl-2 bg-gray-100 py-1">
          Votos por Partido
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-11 gap-3 mb-6">
          {sortedParties.map(([l, v]) => (
            <div key={l} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
              <div className="relative mb-2">
                {PARTY_LOGOS[l] ? (
                  <img 
                    src={PARTY_LOGOS[l]} 
                    alt={l} 
                    className="w-16 h-10 object-contain border border-gray-100 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-10 bg-gray-100 flex items-center justify-center border border-gray-200">
                    <Vote className="text-gray-400" size={20} />
                  </div>
                )}
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1 line-clamp-1">
                {l}
              </div>
              <div className="text-sm font-black text-blue-900">
                {v.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 h-[300px]">
          <Bar
            data={{
              labels: partyLabels,
              datasets: [{
                label: 'Votos',
                data: partyValues,
                backgroundColor: '#0055aa',
              }]
            }}
            options={{
              indexAxis: 'y' as const,
              responsive: true,
              maintainAspectRatio: false,
              layout: {
                padding: {
                  left: 10
                }
              },
              scales: {
                y: {
                  ticks: {
                    padding: 10
                  }
                }
              },
              plugins: { 
                legend: { display: false },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: (context) => `Votos: ${context.parsed.x.toLocaleString()}`
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface ProvinceCardProps {
  key?: string;
  province: string;
  data: any;
  index: number;
  category: string;
}

const DiputadoDetails = ({ circuit, data, province, fullCircuitData }: { circuit: string; data: CircuitDiputadoData; province: string; fullCircuitData: any }) => {
  const sortedCandidates = useMemo(() => {
    return Object.values(data).sort((a, b) => b.total - a.total);
  }, [data]);

  const circuitSummary = useMemo(() => {
    const totalValidos = Object.values(data).reduce((acc, c) => acc + c.total, 0);
    if (!fullCircuitData || !fullCircuitData.tec) {
      return {
        cen: 0,
        mes: 0,
        pad: 0,
        val: totalValidos,
        part: "0.00"
      };
    }
    const tec = fullCircuitData.tec;
    const emi = tec.val + tec.bla + tec.nul;
    const part = tec.pad > 0 ? ((emi / tec.pad) * 100).toFixed(2) : "0.00";
    
    return {
      cen: tec.cen || 0,
      mes: tec.mes || 0,
      pad: tec.pad || 0,
      val: totalValidos,
      part: part
    };
  }, [data, fullCircuitData]);

  const labels = sortedCandidates.map(c => c.candidate);
  const values = sortedCandidates.map(c => c.total);

  const barData = {
    labels,
    datasets: [{
      label: 'Votos',
      data: values,
      backgroundColor: '#0055aa',
    }]
  };

  // Calculate Party Votes
  const partyVotes: { [key: string]: number } = {};
  Object.values(data).forEach(cand => {
    Object.entries(cand.parties).forEach(([party, votes]) => {
      partyVotes[party] = (partyVotes[party] || 0) + (votes as number);
    });
  });

  const sortedParties = Object.entries(partyVotes)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const partyLabels = sortedParties.map(([p]) => p);
  const partyValues = sortedParties.map(([, v]) => v);

  const partyBarData = {
    labels: partyLabels,
    datasets: [{
      label: 'Votos por Partido',
      data: partyValues,
      backgroundColor: partyLabels.map(p => {
        const colors: { [key: string]: string } = {
          'PRD': '#ff0000',
          'PP': '#008000',
          'MOLIRENA': '#ffff00',
          'PANAMEÑISTA': '#800080',
          'CD': '#add8e6',
          'ALIANZA': '#ffa500',
          'RM': '#0000ff',
          'PAIS': '#00ced1',
          'MOCA': '#4b0082',
          'LP1': '#808080',
          'LP2': '#a9a9a9',
          'LP3': '#d3d3d3'
        };
        return colors[p] || '#0055aa';
      }),
    }]
  };

  const exportData = useMemo(() => {
    const cand: Record<string, number> = {};
    Object.values(data).forEach(c => {
      cand[c.candidate] = c.total;
    });

    const party: Record<string, number> = {};
    Object.values(data).forEach(cand => {
      Object.entries(cand.parties).forEach(([p, v]) => {
        party[p] = (party[p] || 0) + (v as number);
      });
    });

    return { cand, party };
  }, [data]);

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-blue-900 font-bold">
          <ClipboardList size={18} />
          <span>Detalles del Circuito {circuit}</span>
        </div>
        {circuitSummary && (
          <ExportMenu 
            province={province} 
            summary={circuitSummary} 
            data={exportData} 
            circuit={circuit} 
            label="Circuito" 
          />
        )}
      </div>

      <div className="mb-10">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-blue-600 pl-2 bg-gray-100 py-1">
          Votos por Candidato - Circuito {circuit}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          {sortedCandidates.map((c) => (
            <div key={c.candidate} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[120px]">
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {Object.entries(c.parties).filter(([, v]) => (v as number) > 0).map(([p]) => (
                  <img 
                    key={p}
                    src={PARTY_LOGOS[p]} 
                    alt={p} 
                    className="w-10 h-7 object-contain shadow-sm border border-gray-100 rounded-sm"
                    referrerPolicy="no-referrer"
                    title={p}
                  />
                ))}
              </div>
              <div className="text-[10px] font-bold text-gray-600 mb-2 line-clamp-2 h-8 flex items-center justify-center leading-tight">
                {c.candidate}
              </div>
              <div className="text-lg font-black text-blue-900">
                {c.total.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 h-[300px]">
          <Bar
            data={barData}
            options={{
              indexAxis: 'y' as const,
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => `Votos: ${context.parsed.x.toLocaleString()}`
                  }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => value.toLocaleString()
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-emerald-600 pl-2 bg-gray-100 py-1">
          Votos por Partido - Circuito {circuit}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 h-[350px]">
            <Bar
              data={partyBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `Votos: ${context.parsed.y.toLocaleString()}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => value.toLocaleString()
                    }
                  }
                }
              }}
            />
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 overflow-auto max-h-[350px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 font-bold uppercase text-[10px]">
                  <th className="text-left pb-2">Partido</th>
                  <th className="text-right pb-2">Votos</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedParties.map(([p, v]) => (
                  <tr key={p} className="hover:bg-gray-50">
                    <td className="py-2 flex items-center gap-2">
                      <img src={PARTY_LOGOS[p]} alt={p} className="w-6 h-4 object-contain" referrerPolicy="no-referrer" />
                      <span className="font-semibold">{p}</span>
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-blue-900">
                      {v.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const RepresentanteDetails = ({ district, data, province }: { district: string; data: DistrictMayorData; province: string }) => {
  const sortedCandidates = useMemo(() => {
    return Object.values(data).sort((a, b) => b.total - a.total);
  }, [data]);

  const districtSummary = useMemo(() => {
    const totalValidos = Object.values(data).reduce((acc, c) => acc + c.total, 0);
    return {
      cen: 0,
      mes: 0,
      pad: 0,
      val: totalValidos,
      part: "0"
    };
  }, [data]);

  const exportData = useMemo(() => {
    const cand: Record<string, number> = {};
    Object.values(data).forEach(c => {
      cand[c.candidate] = c.total;
    });

    const party: Record<string, number> = {};
    Object.values(data).forEach(cand => {
      Object.entries(cand.parties).forEach(([p, v]) => {
        party[p] = (party[p] || 0) + (v as number);
      });
    });

    return { cand, party };
  }, [data]);

  const labels = sortedCandidates.map(c => c.candidate);
  const values = sortedCandidates.map(c => c.total);

  const barData = {
    labels,
    datasets: [{
      label: 'Votos',
      data: values,
      backgroundColor: '#0055aa',
    }]
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-blue-900 font-bold">
          <MapPin size={18} />
          <span>Detalles del Corregimiento {district}</span>
        </div>
        <ExportMenu 
          province={province} 
          summary={districtSummary} 
          data={exportData} 
          circuit={district} 
          label="Corregimiento" 
        />
      </div>
      <div className="mb-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-blue-600 pl-2 bg-gray-100 py-1">
          Distribución de Votos
        </h4>
        <div className="h-[300px] w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <Bar 
            data={barData} 
            options={{ 
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedCandidates.map((c, i) => (
          <div key={c.candidate} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 bg-gray-50">
                <img 
                  src={CANDIDATE_PHOTOS[c.candidate] || `https://picsum.photos/seed/${c.candidate}/200`} 
                  alt={c.candidate}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-900 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                #{i + 1}
              </div>
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-gray-900 leading-tight mb-1">{c.candidate}</h5>
              <div className="flex items-center gap-2 mb-2">
                {Object.entries(c.parties).filter(([, v]) => (v as number) > 0).map(([p]) => (
                  <img 
                    key={p} 
                    src={PARTY_LOGOS[p]} 
                    alt={p} 
                    className="h-4 object-contain"
                    title={p}
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-blue-900">{c.total.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Votos</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProvinceCard = ({ province, data, index, category }: ProvinceCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openCircuit, setOpenCircuit] = useState<string | null>(null);
  const [openMayorDistrict, setOpenMayorDistrict] = useState<string | null>(null);
  const [openRepresentanteDistrict, setOpenRepresentanteDistrict] = useState<string | null>(null);
  const [openRepresentante, setOpenRepresentante] = useState<string | null>(null);
  const [openDiputadoCircuit, setOpenDiputadoCircuit] = useState<string | null>(null);
  const [diputadoFilter, setDiputadoFilter] = useState<'ALL' | 'UNI' | 'PLURI'>('ALL');

  const summary = useMemo(() => {
    let t = { cen: 0, mes: 0, pad: 0, val: 0, emi: 0, bla: 0, nul: 0, alc: 0, candCount: 0 };
    
    // Technical data (Centros, Mesas, Padrón) is always from circuits
    if (data && data.circuits) {
      Object.values(data.circuits).forEach((c: any) => {
        if (c.tec) {
          t.cen += c.tec.cen || 0;
          t.mes += c.tec.mes || 0;
          t.pad += c.tec.pad || 0;
        }
      });
    }

    // Válidos and Emitidos depend on category
    if (category === 'Alcalde') {
      if (data.mayorSummary) {
        t.mes = data.mayorSummary.mesas;
        t.val = data.mayorSummary.validos;
        t.emi = data.mayorSummary.emitidos;
        t.bla = data.mayorSummary.blancos;
        t.nul = data.mayorSummary.nulos;
        t.alc = data.mayorSummary.count;
      }
      
      if (data.mayors) {
        if (!data.mayorSummary) t.alc = Object.keys(data.mayors).length;
        Object.values(data.mayors).forEach((district: any) => {
          t.candCount += Object.keys(district).length;
          if (!data.mayorSummary) {
            Object.values(district).forEach((cand: any) => {
              t.val += cand.total || 0;
            });
          }
        });
        if (!data.mayorSummary) t.emi = t.val;
      }
    } else if (category === 'Representante') {
      if (data.representanteSummary) {
        t.mes = data.representanteSummary.mesas;
        t.val = data.representanteSummary.validos;
        t.emi = data.representanteSummary.emitidos;
        t.bla = data.representanteSummary.blancos;
        t.nul = data.representanteSummary.nulos;
        t.alc = data.representanteSummary.count;
      }
      
      if (data.representantes) {
        if (!data.representanteSummary) t.alc = Object.keys(data.representantes).length;
        Object.values(data.representantes).forEach((district: any) => {
          t.candCount += Object.keys(district).length;
          if (!data.representanteSummary) {
            Object.values(district).forEach((cand: any) => {
              t.val += cand.total || 0;
            });
          }
        });
        if (!data.representanteSummary) t.emi = t.val;
      }
    } else if (category === 'Diputado') {
      if (data.diputadoSummary) {
        t.mes = data.diputadoSummary.mesas;
        t.val = data.diputadoSummary.validos;
        t.emi = data.diputadoSummary.emitidos;
        t.bla = data.diputadoSummary.blancos;
        t.nul = data.diputadoSummary.nulos;
      }
      
      if (data.diputados) {
        Object.values(data.diputados).forEach((circuit: any) => {
          Object.values(circuit).forEach((cand: any) => {
            if (!data.diputadoSummary) t.val += cand.total || 0;
            t.candCount += 1;
          });
        });
        if (!data.diputadoSummary) t.emi = t.val;
      }
    } else if (data.circuits) {
      Object.values(data.circuits).forEach((c: any) => {
        if (c.tec) {
          t.val += c.tec.val || 0;
          t.emi += c.tec.emi || 0;
          t.bla += c.tec.bla || 0;
          t.nul += c.tec.nul || 0;
        }
      });
    }

    const part = t.pad > 0 ? ((t.emi / t.pad) * 100).toFixed(2) : "0";
    return { ...t, part };
  }, [data, category]);

  const meta = PROVINCE_METADATA[province] || { number: index + 1, image: "", color: "from-blue-900 to-blue-700" };
  const provinceImage = (category === 'Alcalde' && MAYOR_PROVINCE_IMAGES[province]) 
    ? MAYOR_PROVINCE_IMAGES[province] 
    : meta.image;

  return (
    <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 text-white transition-all hover:brightness-110 bg-gradient-to-r",
          meta.color
        )}
      >
        <span className="text-lg font-bold">{meta.number}. {province}</span>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </button>

      {isOpen && (
        <div className="p-6 animate-in fade-in duration-500">
          {/* Provincial Summary - Always at the top */}
          <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
            <div className="w-full md:w-[320px] flex-shrink-0">
              <img
                src={provinceImage}
                alt={province}
                className="w-full rounded-xl shadow-md border border-gray-100"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">Resumen Provincial</h3>
                <ExportMenu 
                  province={province} 
                  summary={summary} 
                  data={category === 'Alcalde' ? data.mayors : category === 'Diputado' ? data.diputados : category === 'Representante' ? data.representantes : data.circuits} 
                />
              </div>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Candidatos:</span> {summary.candCount.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Votos Válidos:</span> {summary.val.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Votos en Blanco:</span> {summary.bla.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Votos Nulos:</span> {summary.nul.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">
                    {category === 'Alcalde' ? 'Distritos:' : category === 'Representante' ? 'Corregimientos:' : 'Circuitos:'}
                  </span> {category === 'Diputado' ? Object.keys(data.diputados || {}).length : (category === 'Representante' || category === 'Alcalde') ? summary.alc : Object.keys(data.circuits || {}).length}
                </li>
              </ul>
            </div>
          </div>

          {/* Category Specific Content */}
          {category === 'Presidente' ? (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <MapPin className="text-blue-600" /> Circuitos Electorales
              </h3>
              <div className="space-y-2">
                {Object.keys(data.circuits).map((circ) => (
                  <div key={circ} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenCircuit(openCircuit === circ ? null : circ)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 text-left font-semibold transition-colors",
                        openCircuit === circ ? "bg-blue-50 text-blue-900" : "bg-white hover:bg-gray-50"
                      )}
                    >
                      <span>Circuito {circ}</span>
                      {openCircuit === circ ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {openCircuit === circ && (
                      <CircuitDetails circuit={circ} data={data.circuits[circ]} province={province} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : category === 'Alcalde' && data.mayors && Object.keys(data.mayors).length > 0 ? (
            <div className="mt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <Users className="text-blue-600" /> Distritos
              </h3>
              <div className="space-y-2">
                {Object.keys(data.mayors).map((district) => (
                  <div key={district} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenMayorDistrict(openMayorDistrict === district ? null : district)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 text-left font-semibold transition-colors",
                        openMayorDistrict === district ? "bg-blue-50 text-blue-900" : "bg-white hover:bg-gray-50"
                      )}
                    >
                      <span>{district}</span>
                      {openMayorDistrict === district ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {openMayorDistrict === district && (
                      <MayorDetails district={district} data={data.mayors[district]} province={province} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : category === 'Diputado' && data.diputados && Object.keys(data.diputados).length > 0 ? (
            <div className="mt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardList className="text-blue-600" /> Circuitos
                </h3>
                <div className="flex bg-gray-100 p-1 rounded-lg self-start">
                  {(['ALL', 'UNI', 'PLURI'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDiputadoFilter(f)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        diputadoFilter === f 
                          ? "bg-white text-blue-900 shadow-sm" 
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {f === 'ALL' ? 'Todos' : f === 'UNI' ? 'Uninominales' : 'Plurinominales'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {Object.keys(data.diputados)
                  .filter(circ => {
                    if (diputadoFilter === 'ALL') return true;
                    const circuitType = data.circuits[circ]?.type;
                    return circuitType === diputadoFilter;
                  })
                  .map((circ) => (
                    <div key={circ} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setOpenDiputadoCircuit(openDiputadoCircuit === circ ? null : circ)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 text-left font-semibold transition-colors",
                          openDiputadoCircuit === circ ? "bg-blue-50 text-blue-900" : "bg-white hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>Circuito {circ}</span>
                          {data.circuits[circ]?.type && (
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter font-black",
                              data.circuits[circ]?.type === 'UNI' ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
                            )}>
                              {data.circuits[circ]?.type}
                            </span>
                          )}
                        </div>
                        {openDiputadoCircuit === circ ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {openDiputadoCircuit === circ && (
                        <DiputadoDetails 
                          circuit={circ} 
                          data={data.diputados[circ]} 
                          province={province}
                          fullCircuitData={data.circuits[circ]}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : category === 'Representante' && data.representantes && Object.keys(data.representantes).length > 0 ? (
            <div className="mt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <MapPin className="text-blue-600" /> Distritos y Corregimientos
              </h3>
              <div className="space-y-4">
                {Object.keys(data.representantes).map((district) => (
                  <div key={district} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setOpenRepresentanteDistrict(openRepresentanteDistrict === district ? null : district)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 text-left font-bold transition-all",
                        openRepresentanteDistrict === district ? "bg-blue-900 text-white" : "bg-white hover:bg-gray-50 text-blue-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm",
                          openRepresentanteDistrict === district ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-700"
                        )}>
                          {Object.keys(data.representantes[district]).length}
                        </div>
                        <span>Distrito: {district}</span>
                      </div>
                      {openRepresentanteDistrict === district ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    
                    {openRepresentanteDistrict === district && (
                      <div className="p-4 bg-gray-50 space-y-2">
                        {Object.keys(data.representantes[district]).map((corregimiento) => (
                          <div key={corregimiento} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <button
                              onClick={() => setOpenRepresentante(openRepresentante === corregimiento ? null : corregimiento)}
                              className={cn(
                                "w-full flex items-center justify-between p-3 text-left font-semibold transition-colors",
                                openRepresentante === corregimiento ? "bg-blue-100 text-blue-900" : "bg-white hover:bg-gray-50"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-blue-600" />
                                <span>{corregimiento}</span>
                              </div>
                              {openRepresentante === corregimiento ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {openRepresentante === corregimiento && (
                              <RepresentanteDetails 
                                district={corregimiento} 
                                data={data.representantes[district][corregimiento]} 
                                province={province} 
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const ELECTORAL_CATEGORIES = [
  { id: 'Presidente', label: 'Presidente', icon: <Vote size={20} /> },
  { id: 'Diputado', label: 'Diputado', icon: <ClipboardList size={20} /> },
  { id: 'Alcalde', label: 'Alcalde', icon: <Users size={20} /> },
  { id: 'Representante', label: 'Representante', icon: <MapPin size={20} /> },
  { id: 'Concejal', label: 'Concejal', icon: <BarChart3 size={20} /> },
  { id: 'Parlacen', label: 'Parlacen', icon: <Globe size={20} /> },
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState('Presidente');
  const data = useMemo(() => consolidateData(), []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Category Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {ELECTORAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all duration-300 text-sm md:text-base",
                  activeCategory === cat.id
                    ? "bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-md scale-105"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.id === 'Presidente' && <Vote size={18} />}
                {cat.id === 'Diputado' && <ClipboardList size={18} />}
                {cat.id === 'Alcalde' && <Users size={18} />}
                {cat.id === 'Representante' && <MapPin size={18} />}
                {cat.id === 'Concejal' && <BarChart3 size={18} />}
                {cat.id === 'Parlacen' && <Globe size={18} />}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-8">
        {PROVINCE_ORDER.map((province, idx) => {
          const provinceData = data[province] || { circuits: {}, mayors: {}, diputados: {}, representantes: {} };

          // Check if there is data for the category
          let hasData = false;
          if (activeCategory === 'Presidente') {
            hasData = Object.keys(provinceData.circuits || {}).length > 0;
          } else if (activeCategory === 'Alcalde') {
            hasData = Object.keys(provinceData.mayors || {}).length > 0;
          } else if (activeCategory === 'Diputado') {
            hasData = Object.keys(provinceData.diputados || {}).length > 0;
          } else if (activeCategory === 'Representante' || activeCategory === 'Concejal' || activeCategory === 'Parlacen') {
            // Always show all provinces for these categories as requested
            hasData = true;
          }

          if (!hasData) return null;

          return (
            <ProvinceCard
              key={`${activeCategory}-${province}`}
              province={province}
              data={provinceData}
              index={idx}
              category={activeCategory}
            />
          );
        })}

        {/* Handle cases not in the predefined order if any */}
        {Object.keys(data).filter(p => !PROVINCE_ORDER.includes(p) && p !== "Comarca Embera Wounaan").map((province, idx) => {
          const provinceData = data[province];
          
          let hasData = false;
          if (activeCategory === 'Presidente') {
            hasData = Object.keys(provinceData.circuits || {}).length > 0;
          } else if (activeCategory === 'Alcalde') {
            hasData = Object.keys(provinceData.mayors || {}).length > 0;
          } else if (activeCategory === 'Diputado') {
            hasData = Object.keys(provinceData.diputados || {}).length > 0;
          } else if (activeCategory === 'Representante' || activeCategory === 'Concejal' || activeCategory === 'Parlacen') {
            // Always show all provinces for these categories as requested
            hasData = true;
          }

          if (!hasData) return null;

          return (
            <ProvinceCard
              key={`${activeCategory}-${province}`}
              province={province}
              data={provinceData}
              index={PROVINCE_ORDER.length + idx}
              category={activeCategory}
            />
          );
        })}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400 text-xs border-t border-gray-200 mt-12">
        <p>© 2026 Centro de estadística electoral</p>
        <p className="mt-2">Desarrollado por CEMD para fines informativos basados en datos oficiales escrutados.</p>
      </footer>
    </div>
  );
}
