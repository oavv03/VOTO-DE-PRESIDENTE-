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
import { ChevronDown, ChevronUp, Users, ClipboardList, Vote, BarChart3, MapPin } from 'lucide-react';
import { consolidateData, ElectionConsolidated, CircuitData, DistrictMayorData } from './data/parser';
import { PROVINCE_METADATA } from './data/electionData';
import { cn } from './lib/utils';
import { CANDIDATE_PHOTOS, PARTY_LOGOS, CANDIDATE_TO_PARTIES } from './constants';
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
  "Comarca Ngabe Bugle", "Comarca Embera Wounaan", "Panamá Oeste"
];

const CANDIDATE_COLORS = [
  '#003366', '#0055aa', '#4caf50', '#ffeb3b', '#f44336', '#9c27b0', '#ff9800', '#795548'
];

const MayorDetails = ({ district, data }: { district: string; data: DistrictMayorData }) => {
  const sortedCandidates = useMemo(() => {
    return Object.values(data).sort((a, b) => b.total - a.total);
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

const ProvinceCard = ({ province, data, index, category }: ProvinceCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openCircuit, setOpenCircuit] = useState<string | null>(null);
  const [openDistrict, setOpenDistrict] = useState<string | null>(null);

  const summary = useMemo(() => {
    let t = { cen: 0, mes: 0, pad: 0, val: 0, emi: 0, alc: 0, candCount: 0 };
    
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
    } else if (data.circuits) {
      Object.values(data.circuits).forEach((c: any) => {
        if (c.tec) {
          t.val += c.tec.val || 0;
          t.emi += c.tec.emi || 0;
        }
      });
    }

    const part = t.pad > 0 ? ((t.emi / t.pad) * 100).toFixed(2) : "0";
    return { ...t, part };
  }, [data, category]);

  const meta = PROVINCE_METADATA[province] || { number: index + 1, image: "", color: "from-blue-900 to-blue-700" };

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
                src={meta.image}
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
                  data={category === 'Alcalde' ? data.mayors : data.circuits} 
                />
              </div>
              <ul className="space-y-3 text-slate-700">
                {category !== 'Alcalde' && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                    <span className="font-bold">Centros:</span> {summary.cen.toLocaleString()}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Mesas:</span> {summary.mes.toLocaleString()}
                </li>
                {category !== 'Alcalde' && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                    <span className="font-bold">Padrón Electoral:</span> {summary.pad.toLocaleString()}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Válidos:</span> {summary.val.toLocaleString()}
                </li>
                {category !== 'Alcalde' && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                    <span className="font-bold">Participación:</span> {`${summary.part}%`}
                  </li>
                )}
                {category === 'Alcalde' && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                    <span className="font-bold">Candidatos:</span> {summary.candCount.toLocaleString()}
                  </li>
                )}
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
                      onClick={() => setOpenDistrict(openDistrict === district ? null : district)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 text-left font-semibold transition-colors",
                        openDistrict === district ? "bg-blue-50 text-blue-900" : "bg-white hover:bg-gray-50"
                      )}
                    >
                      <span>{district}</span>
                      {openDistrict === district ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {openDistrict === district && (
                      <MayorDetails district={district} data={data.mayors[district]} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <ClipboardList className="text-gray-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-400 uppercase tracking-tight mb-2">
                Información en Proceso
              </h3>
              <p className="text-gray-400 max-w-xs mx-auto text-sm">
                Los datos oficiales para la categoría de <span className="font-bold text-blue-900/40">{category}</span> en la provincia de <span className="font-bold text-blue-900/40">{province}</span> se están consolidando.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ELECTORAL_CATEGORIES = [
  { id: 'Presidente', label: 'Presidente', icon: <Vote size={20} /> },
  { id: 'Alcalde', label: 'Alcalde', icon: <Users size={20} /> },
  { id: 'Diputado', label: 'Diputado', icon: <ClipboardList size={20} /> },
  { id: 'Representante', label: 'Representante', icon: <MapPin size={20} /> },
  { id: 'Concejal', label: 'Concejal', icon: <BarChart3 size={20} /> },
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
                {cat.id === 'Alcalde' && <Users size={18} />}
                {cat.id === 'Diputado' && <ClipboardList size={18} />}
                {cat.id === 'Representante' && <MapPin size={18} />}
                {cat.id === 'Concejal' && <BarChart3 size={18} />}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-8">
        {PROVINCE_ORDER.map((province, idx) => (
          data[province] && (
            <ProvinceCard
              key={`${activeCategory}-${province}`}
              province={province}
              data={data[province]}
              index={idx}
              category={activeCategory}
            />
          )
        ))}

        {/* Handle cases not in the predefined order if any */}
        {Object.keys(data).filter(p => !PROVINCE_ORDER.includes(p)).map((province, idx) => (
          <ProvinceCard
            key={`${activeCategory}-${province}`}
            province={province}
            data={data[province]}
            index={PROVINCE_ORDER.length + idx}
            category={activeCategory}
          />
        ))}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400 text-xs border-t border-gray-200 mt-12">
        <p>© 2026 Centro de estadística electoral</p>
        <p className="mt-2">Desarrollado por CEMD para fines informativos basados en datos oficiales escrutados.</p>
      </footer>
    </div>
  );
}
