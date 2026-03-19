import Papa from 'papaparse';
import { DEF6_CSV, SEGUNDA_CSV, ALCALDE_DETALLE_CSV, ALCALDE_RESUMEN_CSV, DIPUTADO_CSV, DIPUTADO_RESUMEN_CSV, REPRESENTANTE_DETALLE_CSV, REPRESENTANTE_RESUMEN_CSV } from './electionData';

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
  representantes: { [district: string]: { [corregimiento: string]: DistrictMayorData } };
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
  representanteSummary?: {
    mesas: number;
    validos: number;
    emitidos: number;
    blancos: number;
    nulos: number;
    count: number;
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
    "Comarca Ngäbe-Buglé": "Comarca Ngäbe Buglé",
    "Embera Wounaan": "Comarca Embera Wounaan",
    "Comarca Emberá": "Comarca Embera Wounaan",
    "Comarca Emberá Wounaán": "Comarca Embera Wounaan",
    "Kuna Yala": "Comarca Kuna Yala",
    "Comarca Kuna Yala": "Comarca Kuna Yala",
    "Comarca Kuna de Madungandi": "Comarca Kuna de Madungandi",
    "Comarca Kuna de Wargandí": "Comarca Kuna de Wargandí",
    "Comarca Naso Tjër Di": "Comarca Naso Tjër Di"
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
  const alcaldesResumen = Papa.parse(ALCALDE_RESUMEN_CSV, { header: true, skipEmptyLines: true, delimiter: ";" }).data as any[];
  const diputadosResumen = Papa.parse(DIPUTADO_RESUMEN_CSV, { header: true, skipEmptyLines: true, delimiter: ";" }).data as any[];
  const representantesResumen = Papa.parse(REPRESENTANTE_RESUMEN_CSV, { header: true, skipEmptyLines: true, delimiter: ";" }).data as any[];

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
    if (!res[p]) res[p] = { circuits: {}, mayors: {}, diputados: {}, representantes: {} };
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

  // Parse Hierarchical Alcalde Data
  const alcaldeRows = Papa.parse(ALCALDE_DETALLE_CSV, { delimiter: ";" }).data as string[][];
  let currentAlcaldeProv = "";
  let currentAlcaldeDist = "";

  alcaldeRows.forEach(row => {
    if (row.length === 0) return;
    
    const firstCol = row[0] || "";
    const trimmed = firstCol.trim();
    if (!trimmed || trimmed.startsWith("Provincia")) return;

    // Detect hierarchy based on leading spaces
    const leadingSpaces = firstCol.length - firstCol.trimStart().length;

    if (leadingSpaces === 0) {
      currentAlcaldeProv = normalizeProvince(trimmed);
      currentAlcaldeDist = "";
    } else if (leadingSpaces === 2) {
      currentAlcaldeDist = trimmed;
    } else if (leadingSpaces >= 4 && currentAlcaldeProv && currentAlcaldeDist) {
      const candName = trimmed;
      const total = cleanNum(row[1]);
      
      if (!res[currentAlcaldeProv]) res[currentAlcaldeProv] = { circuits: {}, mayors: {}, diputados: {}, representantes: {} };
      if (!res[currentAlcaldeProv].mayors[currentAlcaldeDist]) res[currentAlcaldeProv].mayors[currentAlcaldeDist] = {};

      res[currentAlcaldeProv].mayors[currentAlcaldeDist][candName] = {
        candidate: candName,
        total: total,
        parties: {
          "PRD": cleanNum(row[2]),
          "PP": cleanNum(row[3]),
          "MOLIRENA": cleanNum(row[4]),
          "PANAMEÑISTA": cleanNum(row[5]),
          "CD": cleanNum(row[6]),
          "ALIANZA": cleanNum(row[7]),
          "RM": cleanNum(row[8]),
          "PAIS": cleanNum(row[9]),
          "MOCA": cleanNum(row[10]),
          "LP1": cleanNum(row[11]),
          "LP2": cleanNum(row[12]),
          "LP3": cleanNum(row[13])
        }
      };
    }
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
      "Comarca Embera Wounaan", "Comarca Kuna de Madungandi", "Comarca Kuna de Wargandí", "Comarca Naso Tjër Di"
    ];
    
    if (knownProvinces.includes(possibleProvince)) {
      currentProvince = possibleProvince;
      if (!res[currentProvince]) res[currentProvince] = { circuits: {}, mayors: {}, diputados: {}, representantes: {} };
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

  // Parse Hierarchical Representante Data
  const representanteRows = Papa.parse(REPRESENTANTE_DETALLE_CSV, { 
    delimiter: "\t",
    skipEmptyLines: true
  }).data as string[][];
  
  let currentProv = "";
  let currentDist = "";
  let currentCorr = "";

  representanteRows.forEach(row => {
    if (row.length < 4) return;
    
    const prov = (row[0] || "").trim();
    const dist = (row[1] || "").trim();
    const corr = (row[2] || "").trim();
    const cand = (row[3] || "").trim();
    
    if (prov && prov !== "Provincia") {
      currentProv = normalizeProvince(prov);
    }
    
    if (dist) {
      currentDist = dist;
    }
    
    if (corr) {
      currentCorr = corr;
    }

    // If we have a candidate name and we are in a valid hierarchy
    if (cand && currentProv && currentDist && currentCorr) {
      const total = cleanNum(row[4]);
      
      if (!res[currentProv]) res[currentProv] = { circuits: {}, mayors: {}, diputados: {}, representantes: {} };
      if (!res[currentProv].representantes[currentDist]) res[currentProv].representantes[currentDist] = {};
      if (!res[currentProv].representantes[currentDist][currentCorr]) res[currentProv].representantes[currentDist][currentCorr] = {};

      res[currentProv].representantes[currentDist][currentCorr][cand] = {
        candidate: cand,
        total: total,
        parties: {
          "PRD": cleanNum(row[5]),
          "PP": cleanNum(row[6]),
          "MOLIRENA": cleanNum(row[7]),
          "PANAMEÑISTA": cleanNum(row[8]),
          "CD": cleanNum(row[9]),
          "ALIANZA": cleanNum(row[10]),
          "RM": cleanNum(row[11]),
          "PAIS": cleanNum(row[12]),
          "MOCA": cleanNum(row[13]),
          "LP1": cleanNum(row[14]),
          "LP2": cleanNum(row[15]),
          "LP3": cleanNum(row[16])
        }
      };
    }
  });

  representantesResumen.forEach(f => {
    const p = normalizeProvince(f["Provincia"]);
    if (!p || !res[p]) return;
    res[p].representanteSummary = {
      mesas: cleanNum(f["Mesas"]),
      validos: cleanNum(f["Votos Válidos"]),
      emitidos: cleanNum(f["Votos Emitidos"]),
      blancos: cleanNum(f["Votos en Blanco"]),
      nulos: cleanNum(f["Votos Nulos"]),
      count: cleanNum(f["Corregimientos"])
    };
  });

  return res;
}
