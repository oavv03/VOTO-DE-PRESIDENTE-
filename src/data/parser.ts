import Papa from 'papaparse';
import { DEF6_CSV, SEGUNDA_CSV, ALCALDE_DETALLE_CSV, ALCALDE_RESUMEN_CSV, DIPUTADO_CSV, DIPUTADO_RESUMEN_CSV } from './electionData';

export interface TechData {
  cen: number;
  mes: number;
  esc: number;
  pad: number;
  emi: number;
  val: number;
  bla: number;
  nul: number;
}

export interface CandidateVotes {
  [key: string]: number;
}

export interface PartyVotes {
  [key: string]: number;
}

export interface CircuitData {
  tec: TechData;
  cand: CandidateVotes;
  party: PartyVotes;
  type?: 'UNI' | 'PLURI';
}

export interface MayorData {
  candidate: string;
  total: number;
  parties: PartyVotes;
}

export interface DistrictMayorData {
  [candidate: string]: MayorData;
}

export interface DiputadoData {
  candidate: string;
  total: number;
  parties: PartyVotes;
}

export interface CircuitDiputadoData {
  [candidate: string]: DiputadoData;
}

export interface ProvinceData {
  circuits: { [circuit: string]: CircuitData };
  mayors: { [district: string]: DistrictMayorData };
  diputados: { [circuit: string]: CircuitDiputadoData };
  mayorSummary?: {
    mesas: number;
    validos: number;
    emitidos: number;
    blancos: number;
    nulos: number;
    count: number;
  };
  diputadoSummary?: {
    mesas: number;
    validos: number;
    emitidos: number;
    blancos: number;
    nulos: number;
  };
}

export interface ElectionConsolidated {
  [province: string]: ProvinceData;
}

function cleanNum(v: any): number {
  if (!v) return 0;
  return parseInt(v.toString().replace(/,/g, "")) || 0;
}

function normalizeProvince(p: string): string {
  if (!p) return "";
  const normalized = p.trim();
  const mapping: { [key: string]: string } = {
    "Cocle": "Coclé",
    "Colon": "Colón",
    "Chiriqui": "Chiriquí",
    "Darien": "Darién",
    "Panama": "Panamá",
    "Panama Oeste": "Panamá Oeste",
    "Ngabe Bugle": "Comarca Ngäbe Buglé",
    "Embera Wounaan": "Comarca Embera Wounaan",
    "Kuna Yala": "Comarca Kuna Yala",
    "Comarca Emberá": "Comarca Embera Wounaan",
    "Comarca Ngabe Bugle": "Comarca Ngäbe Buglé"
  };
  return mapping[normalized] || normalized;
}

export function consolidateData(): ElectionConsolidated {
  const parseConfig = { 
    header: true, 
    skipEmptyLines: true,
    delimiter: ";"
  };
  
  const def6 = Papa.parse(DEF6_CSV, { ...parseConfig, transformHeader: (h) => h.trim() }).data as any[];
  const segunda = Papa.parse(SEGUNDA_CSV, { ...parseConfig, transformHeader: (h) => h.trim() }).data as any[];
  const alcaldes = Papa.parse(ALCALDE_DETALLE_CSV, { header: true, skipEmptyLines: true, delimiter: "," }).data as any[];
  const alcaldesResumen = Papa.parse(ALCALDE_RESUMEN_CSV, { header: true, skipEmptyLines: true, delimiter: ";" }).data as any[];
  const diputadosResumen = Papa.parse(DIPUTADO_RESUMEN_CSV, { header: true, skipEmptyLines: true, delimiter: ";" }).data as any[];

  const res: ElectionConsolidated = {};

  const cleanCircuit = (c: any) => {
    if (!c) return "";
    const cleaned = c.toString().replace(/Circuito/g, "").trim();
    return cleaned.split(/[\s\t]+/)[0];
  };

  def6.forEach(f => {
    const p = normalizeProvince(f["Provincia"]);
    const c = cleanCircuit(f["Circuito"]);
    if (!p || !c) return;
    if (!res[p]) res[p] = { circuits: {}, mayors: {}, diputados: {} };
    if (!res[p].circuits[c]) {
      res[p].circuits[c] = {
        tec: { cen: 0, mes: 0, esc: 0, pad: 0, emi: 0, val: 0, bla: 0, nul: 0 },
        cand: {},
        party: {}
      };
    }

    const t = res[p].circuits[c].tec;
    t.cen += cleanNum(f["Centro"]);
    t.mes += cleanNum(f["Mesa"]);
    t.esc += cleanNum(f["Escrutadas"]);
    t.pad += cleanNum(f["Padrón Electoral"] || f["Padrn Electoral"]);
    t.emi += cleanNum(f["Emitidos"]);
    t.val += cleanNum(f["Válidos"] || f["Vlidos"]);
    t.bla += cleanNum(f["Blancos"]);
    t.nul += cleanNum(f["Nulos"]);

    // Classify circuit type
    const uniCircuits = [
      "2.2", "2.3", "2.4", "3.2", "4.2", "4.4", "4.5", "4.6", "5.1", "5.2", 
      "6.1", "6.2", "6.3", "7.1", "7.2", "8.1", "9.2", "9.3", "9.4", 
      "10.1", "10.2", "12.1", "12.2", "12.3", "13.2", "13.3"
    ];
    const pluriCircuits = [
      "1.1", "2.1", "3.1", "4.1", "4.3", "8.2", "8.3", "8.4", "8.5", "8.6", 
      "9.1", "13.1", "13.4"
    ];

    if (uniCircuits.includes(c)) {
      res[p].circuits[c].type = 'UNI';
    } else if (pluriCircuits.includes(c)) {
      res[p].circuits[c].type = 'PLURI';
    }
  });

  segunda.forEach(f => {
    const p = normalizeProvince(f["Provincia"]);
    const c = cleanCircuit(f["Comarca y Circuito Electoral"] || f["Circuito"]);
    if (res[p] && res[p].circuits[c]) {
      res[p].circuits[c].cand = {
        "Gaby": cleanNum(f["Gaby"]),
        "Mulino": cleanNum(f["Mulino"]),
        "Roux/Blandon": cleanNum(f["Blandon"] || f["Roux"]),
        "Lombana": cleanNum(f["LOMBANA"]),
        "Martin": cleanNum(f["MARTIN"]),
        "Meliton LP3": cleanNum(f["MELITON"]),
        "Zulay LP1": cleanNum(f["Zulay  LP1"]),
        "Maribel LP2": cleanNum(f["Maribel LP2"])
      };
      res[p].circuits[c].party = {
        "PRD": cleanNum(f["PRD"]),
        "MOLIRENA": cleanNum(f["MOLIRENA"]),
        "RM": cleanNum(f["RM"]),
        "ALIANZA": cleanNum(f["ALIANZA"]),
        "CD": cleanNum(f["CD"]),
        "PANAMEÑISTA": cleanNum(f["PANAMEÑISTA"] || f["PANAMEISTA"]),
        "PAIS": cleanNum(f["PAIS"]),
        "PP": cleanNum(f["MARTIN"]),
        "LP1": cleanNum(f["Zulay  LP1"]),
        "LP2": cleanNum(f["Maribel LP2"]),
        "LP3": cleanNum(f["LP3"])
      };
    }
  });

  alcaldes.forEach(f => {
    const p = normalizeProvince(f["Provincia"]);
    const d = f["Distrito"]?.trim();
    const candName = f["Candidato"]?.trim();
    if (!p || !d || !candName) return;

    if (!res[p]) res[p] = { circuits: {}, mayors: {}, diputados: {} };
    if (!res[p].mayors[d]) res[p].mayors[d] = {};

    res[p].mayors[d][candName] = {
      candidate: candName,
      total: cleanNum(f["Total_Votos"]),
      parties: {
        "PRD": cleanNum(f["PRD"]),
        "PP": cleanNum(f["P_Popular"]),
        "MOLIRENA": cleanNum(f["MOLIRENA"]),
        "PANAMEÑISTA": cleanNum(f["P_Panamenista"]),
        "CD": cleanNum(f["CD"]),
        "ALIANZA": cleanNum(f["P_Alianza"]),
        "RM": cleanNum(f["Realizando_Metas"]),
        "PAIS": cleanNum(f["PAIS"]),
        "MOCA": cleanNum(f["Movimiento_Otro_Camino"]),
        "LP1": cleanNum(f["Libre_Postulacion_1"]),
        "LP2": cleanNum(f["Libre_Postulacion_2"]),
        "LP3": cleanNum(f["Libre_Postulacion_3"])
      }
    };
  });

  alcaldesResumen.forEach(f => {
    const p = normalizeProvince(f["Provincia Y Distrito"]);
    if (res[p]) {
      res[p].mayorSummary = {
        mesas: cleanNum(f["mesas Total"]),
        validos: cleanNum(f["Total de Votos Válidos"]),
        emitidos: cleanNum(f["Total de votos emitidos"]),
        blancos: cleanNum(f["Votos en Blanco"]),
        nulos: cleanNum(f["Votos Nulos"]),
        count: Object.keys(res[p].mayors).length
      };
    }
  });

  diputadosResumen.forEach(f => {
    const p = normalizeProvince(f["Provincia, Comarca y Circuito Electoral"]);
    if (res[p]) {
      res[p].diputadoSummary = {
        mesas: cleanNum(f["Total de Mesas"]),
        validos: cleanNum(f["Total de Votos Válidos"]),
        emitidos: cleanNum(f["Total de votos Emitidos"]),
        blancos: cleanNum(f["Votos en Blanco"]),
        nulos: cleanNum(f["Votos Nulos"])
      };
    }
  });

  // Parse Diputado Data
  const diputadoLines = DIPUTADO_CSV.split('\n');
  let currentProvince = "";
  let currentCircuit = "";

  const partyNames = [
    "PRD", "PP", "MOLIRENA", "PANAMEÑISTA", "CD", "ALIANZA", "RM", "PAIS", "MOCA", "LP1", "LP2", "LP3"
  ];

  diputadoLines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if it's a province name (no tabs, or just the name)
    const parts = line.split('\t');
    
    if (trimmed.startsWith("Circuito Electoral y Candidato")) return; // Header

    if (trimmed.startsWith("Circuito")) {
      currentCircuit = cleanCircuit(trimmed);
      return;
    }

    // If it's a single word or a known province name
    const possibleProvince = normalizeProvince(trimmed);
    const knownProvinces = [
      "Bocas del Toro", "Coclé", "Colón", "Chiriquí", "Darién", "Herrera", "Los Santos", 
      "Panamá", "Veraguas", "Comarca Kuna Yala", "Comarca Ngäbe Buglé", "Panamá Oeste",
      "Comarca Embera Wounaan"
    ];
    
    if (knownProvinces.includes(possibleProvince)) {
      currentProvince = possibleProvince;
      if (!res[currentProvince]) res[currentProvince] = { circuits: {}, mayors: {}, diputados: {} };
      return;
    }

    // Candidate row
    if (currentProvince && currentCircuit && parts.length > 1) {
      const candidate = parts[0].trim();
      const total = cleanNum(parts[1]);
      
      if (!res[currentProvince].diputados[currentCircuit]) {
        res[currentProvince].diputados[currentCircuit] = {};
      }

      res[currentProvince].diputados[currentCircuit][candidate] = {
        candidate,
        total,
        parties: {
          "PRD": cleanNum(parts[2]),
          "PP": cleanNum(parts[3]),
          "MOLIRENA": cleanNum(parts[4]),
          "PANAMEÑISTA": cleanNum(parts[5]),
          "CD": cleanNum(parts[6]),
          "ALIANZA": cleanNum(parts[7]),
          "RM": cleanNum(parts[8]),
          "PAIS": cleanNum(parts[9]),
          "MOCA": cleanNum(parts[10]),
          "LP1": cleanNum(parts[11]),
          "LP2": cleanNum(parts[12]),
          "LP3": cleanNum(parts[13])
        }
      };
    }
  });

  return res;
}
