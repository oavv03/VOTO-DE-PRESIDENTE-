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
import { consolidateData, ElectionConsolidated, CircuitData } from './data/parser';
import { PROVINCE_METADATA } from './data/electionData';
import { cn } from './lib/utils';
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
  "Comarca Ngabe Bugle", "Panamá Oeste"
];

const CANDIDATE_COLORS = [
  '#003366', '#0055aa', '#4caf50', '#ffeb3b', '#f44336', '#9c27b0', '#ff9800', '#795548'
];

const CircuitDetails = ({ circuit, data, province }: { circuit: string; data: CircuitData; province: string }) => {
  const participation = ((data.tec.emi / data.tec.pad) * 100).toFixed(2);
  const circuitSummary = {
    cen: data.tec.cen,
    mes: data.tec.mes,
    pad: data.tec.pad,
    val: data.tec.val,
    part: participation
  };

  const candidateLabels = Object.keys(data.cand);
  const candidateValues = Object.values(data.cand);

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
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                {candidateLabels.map(l => <th key={l} className="p-2 border border-gray-200">{l}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                {candidateValues.map((v, i) => <td key={i} className="p-2 border border-gray-200">{v.toLocaleString()}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 h-[400px] mb-8">
          <Bar
            data={candidateBarData}
            options={{
              indexAxis: 'y' as const,
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } }
            }}
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-blue-600 pl-2 bg-gray-100 py-1">
          Votos por Partido
        </h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                {Object.keys(data.party).map(l => <th key={l} className="p-2 border border-gray-200">{l}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.values(data.party).map((v, i) => <td key={i} className="p-2 border border-gray-200">{v.toLocaleString()}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 h-[300px]">
          <Bar
            data={{
              labels: Object.keys(data.party),
              datasets: [{
                label: 'Votos',
                data: Object.values(data.party),
                backgroundColor: '#475569',
              }]
            }}
            options={{
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

interface ProvinceCardProps {
  province: string;
  data: any;
  index: number;
  key?: string | number;
}

const ProvinceCard = ({ province, data, index }: ProvinceCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openCircuit, setOpenCircuit] = useState<string | null>(null);

  const summary = useMemo(() => {
    let t = { cen: 0, mes: 0, pad: 0, val: 0, emi: 0 };
    Object.values(data).forEach((c: any) => {
      t.cen += c.tec.cen; t.mes += c.tec.mes; t.pad += c.tec.pad;
      t.val += c.tec.val; t.emi += c.tec.emi;
    });
    const part = t.pad > 0 ? ((t.emi / t.pad) * 100).toFixed(2) : "0";
    return { ...t, part };
  }, [data]);

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
                <ExportMenu province={province} summary={summary} data={data} />
              </div>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Centros:</span> {summary.cen.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Mesas:</span> {summary.mes.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Padrón Electoral:</span> {summary.pad.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Válidos:</span> {summary.val.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <span className="font-bold">Participación:</span> {summary.part}%
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <MapPin className="text-blue-600" /> Circuitos Electorales
            </h3>
            <div className="space-y-2">
              {Object.keys(data).map((circ) => (
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
                    <CircuitDetails circuit={circ} data={data[circ]} province={province} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const data = useMemo(() => consolidateData(), []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="max-w-5xl mx-auto px-4 pt-8">
        {PROVINCE_ORDER.map((province, idx) => (
          data[province] && (
            <ProvinceCard
              key={province}
              province={province}
              data={data[province]}
              index={idx}
            />
          )
        ))}

        {/* Handle cases not in the predefined order if any */}
        {Object.keys(data).filter(p => !PROVINCE_ORDER.includes(p)).map((province, idx) => (
          <ProvinceCard
            key={province}
            province={province}
            data={data[province]}
            index={PROVINCE_ORDER.length + idx}
          />
        ))}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400 text-xs border-t border-gray-200 mt-12">
        <p>© 2024 Sistema de Visualización de Resultados Electorales</p>
        <p className="mt-2">Desarrollado para fines informativos basados en datos oficiales escrutados.</p>
      </footer>
    </div>
  );
}
