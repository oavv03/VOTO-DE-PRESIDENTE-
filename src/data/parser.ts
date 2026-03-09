import Papa from 'papaparse';
import { DEF6_CSV, SEGUNDA_CSV } from './electionData';

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

export interface ProvinceData {
  [circuit: string]: CircuitData;
}

export interface ElectionConsolidated {
  [province: string]: ProvinceData;
}

function cleanNum(v: any): number {
  if (!v) return 0;
  return parseInt(v.toString().replace(/,/g, "")) || 0;
}

export function consolidateData(): ElectionConsolidated {
  const parseConfig = { 
    header: true, 
    skipEmptyLines: true,
    delimiter: ";"
  };
  
  const def6 = Papa.parse(DEF6_CSV, { ...parseConfig, transformHeader: (h) => h.trim() }).data as any[];
  const segunda = Papa.parse(SEGUNDA_CSV, { ...parseConfig, transformHeader: (h) => h.trim() }).data as any[];

  const res: ElectionConsolidated = {};

  const cleanCircuit = (c: any) => {
    if (!c) return "";
    return c.toString().replace(/Circuito/g, "").trim();
  };

  def6.forEach(f => {
    const p = f["Provincia"]?.trim();
    const c = cleanCircuit(f["Circuito"]);
    if (!p || !c) return;
    if (!res[p]) res[p] = {};
    if (!res[p][c]) {
      res[p][c] = {
        tec: { cen: 0, mes: 0, esc: 0, pad: 0, emi: 0, val: 0, bla: 0, nul: 0 },
        cand: {},
        party: {}
      };
    }

    const t = res[p][c].tec;
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
    const p = f["Provincia"]?.trim();
    const c = cleanCircuit(f["Comarca y Circuito Electoral"] || f["Circuito"]);
    if (res[p] && res[p][c]) {
      res[p][c].cand = {
        "Gaby": cleanNum(f["Gaby"]),
        "Mulino": cleanNum(f["Mulino"]),
        "Roux/Blandon": cleanNum(f["Blandon"] || f["Roux"]),
        "Lombana": cleanNum(f["LOMBANA"]),
        "Martin": cleanNum(f["MARTIN"]),
        "Meliton LP3": cleanNum(f["MELITON"]),
        "Zulay LP1": cleanNum(f["Zulay  LP1"]),
        "Maribel LP2": cleanNum(f["Maribel LP2"])
      };
      res[p][c].party = {
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

  return res;
}
