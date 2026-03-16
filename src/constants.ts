export const CANDIDATE_PHOTOS: Record<string, string> = {
  'Mulino': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/MULINO.jpg&w=200&h=200&fit=cover',
  'Roux/Blandon': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/ROMULO.jpg&w=200&h=200&fit=cover',
  'Zulay LP1': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/ZULAY.jpg&w=200&h=200&fit=cover',
  'Gaby': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/CARRIZO.jpg&w=200&h=200&fit=cover',
  'Lombana': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/LOMBANA.jpg&w=200&h=200&fit=cover',
  'Martin': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/martin.jpeg&w=200&h=200&fit=cover',
  'Maribel LP2': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/MARIBEL.png&w=200&h=200&fit=cover',
  'Meliton LP3': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/MELITON.jpg&w=200&h=200&fit=cover',
};

export const PARTY_LOGOS: Record<string, string> = {
  'PRD': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/bandera-prd.webp&w=100',
  'MOLIRENA': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/molirena-600x409-1.webp&w=100',
  'RM': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/rm.webp&w=100',
  'CD': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/banera-cambio-democratico.webp&w=100',
  'PANAMEÑISTA': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/bandera-partido-panamenista.webp&w=100',
  'P. Panameñista': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/bandera-partido-panamenista.webp&w=100',
  'PAIS': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/Logo_of_the_Independent_Social_Alternative_Party.svg-scaled.png&w=100',
  'PP': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/bandera-partido-popular.webp&w=100',
  'ALIANZA': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/LOGO-PARTIDO-ALIANZA-2023-2-1-600x395-1.webp&w=100',
  'P. Alianza': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/LOGO-PARTIDO-ALIANZA-2023-2-1-600x395-1.webp&w=100',
  'MOCA': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/WhatsApp-Image-2022-07-04-at-2.webp&w=100',
  'Libre Postulación': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/12-mar-2026-09_56_43.png&w=100',
  'LP1': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/12-mar-2026-09_56_43.png&w=100',
  'LP2': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/12-mar-2026-09_56_43.png&w=100',
  'LP3': 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2026/03/12-mar-2026-09_56_43.png&w=100',
};

export const MAYOR_PROVINCE_IMAGES: Record<string, string> = {
  "Bocas del Toro": "https://plagel2024.com/wp-content/uploads/2026/03/Bocas-del-Toro.png",
  "Coclé": "https://plagel2024.com/wp-content/uploads/2026/03/Cocle.png",
  "Colón": "https://plagel2024.com/wp-content/uploads/2026/03/Colon.png",
  "Chiriquí": "https://plagel2024.com/wp-content/uploads/2026/03/Chiriqui.png",
  "Darién": "https://plagel2024.com/wp-content/uploads/2026/03/Darien.png",
  "Herrera": "https://plagel2024.com/wp-content/uploads/2026/03/Herrera.png",
  "Los Santos": "https://plagel2024.com/wp-content/uploads/2026/03/Los-Santos.png",
  "Panamá": "https://plagel2024.com/wp-content/uploads/2026/03/Panama.png",
  "Veraguas": "https://plagel2024.com/wp-content/uploads/2026/03/Veraguas-1.png",
  "Comarca Ngäbe Buglé": "https://plagel2024.com/wp-content/uploads/2026/03/ngabe-bugle.png",
  "Panamá Oeste": "https://plagel2024.com/wp-content/uploads/2026/03/Panama-Oeste.png"
};

export const CANDIDATE_TO_PARTIES: Record<string, string[]> = {
  'Mulino': ['RM', 'ALIANZA'],
  'Roux/Blandon': ['CD', 'PANAMEÑISTA'],
  'Gaby': ['PRD', 'MOLIRENA'],
  'Lombana': ['MOCA'],
  'Martin': ['PP'],
  'Zulay LP1': ['LP1'],
  'Maribel LP2': ['LP2'],
  'Meliton LP3': ['LP3', 'PAIS'],
};

export const ELECTION_ALLIANCES = [
  { name: "RM + ALIANZA", parties: ["RM", "ALIANZA", "P_Alianza", "P. Alianza", "Realizando_Metas"] },
  { name: "CD + PANAMEÑISTA", parties: ["CD", "PANAMEÑISTA", "P_Panamenista", "P. Panameñista"] },
  { name: "PRD + MOLIRENA", parties: ["PRD", "MOLIRENA"] },
  { name: "MOCA", parties: ["MOCA", "Movimiento_Otro_Camino"] },
  { name: "PP", parties: ["PP", "P_Popular", "P. Popular"] },
  { name: "ZULAY LP1", parties: ["LP1", "Libre_Postulacion_1"] },
  { name: "MARIBEL LP2", parties: ["LP2", "Libre_Postulacion_2"] },
  { name: "MELINTON LP + PAIS", parties: ["LP3", "PAIS", "Libre_Postulacion_3"] }
];
