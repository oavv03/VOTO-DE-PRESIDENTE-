import Papa from 'papaparse';
import { DEF6_CSV, SEGUNDA_CSV, ALCALDE_DETALLE_CSV, ALCALDE_RESUMEN_CSV } from './electionData';

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
}

export interface MayorData {
  candidate: string;
  total: number;
  parties: PartyVotes;
}

export interface DistrictMayorData {
  [candidate: string]: MayorData;
}

export interface ProvinceData {
  circuits: { [circuit: string]: CircuitData };
  mayors: { [district: string]: DistrictMayorData };
  mayorSummary?: {
    mesas: number;
    validos: number;
    emitidos: number;
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
    "Ngabe Bugle": "Comarca Ngabe Bugle",
    "Embera Wounaan": "Comarca Embera Wounaan",
    "Kuna Yala": "Comarca Kuna Yala",
    "Comarca Emberá": "Comarca Embera Wounaan"
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

  const res: ElectionConsolidated = {};

  const cleanCircuit = (c: any) => {
    if (!c) return "";
    return c.toString().replace(/Circuito/g, "").trim();
  };

  def6.forEach(f => {
    const p = normalizeProvince(f["Provincia"]);
    const c = cleanCircuit(f["Circuito"]);
    if (!p || !c) return;
    if (!res[p]) res[p] = { circuits: {}, mayors: {} };
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

    if (!res[p]) res[p] = { circuits: {}, mayors: {} };
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
        count: Object.keys(res[p].mayors).length
      };
    }
  });

  return res;
}
