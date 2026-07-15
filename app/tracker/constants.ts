import type { AppState, Category, Instance } from "./types";

export const STORAGE_KEY = "ro_tracker_next_v1";

export const DB_INSTANCES: Instance[] = [
  { id: "maldicao_glastheim", name: "Curse of Glast Heim (OGH)", minLevel: 100, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Maldi%C3%A7%C3%A3o_de_Glastheim", coins: 5 },
  { id: "base_militar", name: "Military Base", minLevel: 125, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Base_Militar", coins: 7 },
  { id: "memorial_cor", name: "COR Memorial (District)", minLevel: 130, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Memorial_COR", coins: 7 },
  { id: "salao_ymir", name: "Ymir Hall", minLevel: 160, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Sal%C3%A3o_de_Ymir", coins: 5 },
  { id: "palacio_mag", name: "Ghost Palace", minLevel: 120, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Pal%C3%A1cio_das_M%C3%A1goas", coins: 5 },
  { id: "torneio_magia", name: "Geffen Tournament", minLevel: 99, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Torneio_de_Magia", coins: 5 },
  { id: "queda_glastheim_hard", name: "Fall of Glast Heim (Schmidt HARD)", minLevel: 130, cooldownCategory: "3_days", wiki: "https://browiki.org/wiki/Queda_de_Glastheim#hard" },
  { id: "fabrica_terror", name: "Horror Toy Factory", minLevel: 100, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/F%C3%A1brica_do_Terror", coins: 5 },
  { id: "edda_biolab", name: "Edda Biolab", minLevel: 170, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Edda_do_Biolaborat%C3%B3rio" },
  { id: "edda_gh", name: "Edda Glast Heim", minLevel: 160, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Edda_de_Glastheim" },
  { id: "ortus_aqua", name: "Floating Garden (17.2)", minLevel: 130, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Ortus_Aqua" },
  { id: "jardim_secreto", name: "Hidden Flower Garden (17.2)", minLevel: 100, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Jardim_Secreto" },
  { id: "fazenda_pitayas", name: "Pitaya Farm (17.2)", minLevel: 100, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Fazenda_de_Pitayas" },
  { id: "duelo_sweety", name: "Hey, Sweetie! (17.2)", minLevel: 100, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Duelo_com_Sweety" },
  { id: "purificacion_santuario", name: "Sanctuary Purification (18)", minLevel: 170, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Purifica%C3%A7%C3%A3o_do_Santu%C3%A1rio" },
  { id: "mansion_desilusion", name: "Villa of Deception Normal (18)", minLevel: 170, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Mans%C3%A3o_da_Desilus%C3%A3o" },
  { id: "mansion_desilusion_avanzado", name: "Villa of Deception Advanced (18)", minLevel: 200, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Mans%C3%A3o_da_Desilus%C3%A3o#Mec%C3%A2nicas_da_batalha" },
  { id: "memorias_thanatos", name: "Memories of Thanatos (Thanatos Tower Revamp)", minLevel: 180, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Mem%C3%B3rias_de_Thanatos" },
  { id: "batalha_orcs", name: "Orc's Memory", minLevel: 99, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Batalha_dos_Orcs", coins: 5 },
  { id: "memorias_sarah", name: "Sara's Memory", minLevel: 99, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Mem%C3%B3rias_de_Sarah", coins: 5 },
  { id: "hospital_abandonado", name: "Abandoned Hospital", minLevel: 100, cooldownCategory: "7_days", wiki: "https://browiki.org/wiki/Hospital_Abandonado", coins: 20 },
  { id: "aos_pes_rei", name: "Charleston Crisis", minLevel: 100, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Aos_P%C3%A9s_do_Rei", coins: 10 },
  { id: "sonho_sombrio", name: "Nightmarish Jitterbug", minLevel: 100, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Sonho_Sombrio", coins: 10 },
  { id: "covil_vermes", name: "Faceworm Nest", minLevel: 120, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Covil_de_Vermes", coins: 5 },
  { id: "sala_final", name: "Last Room", minLevel: 140, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Sala_Final", coins: 7 },
  { id: "ninho_nidhogg", name: "Nidhogg's Nest", minLevel: 120, cooldownCategory: "3_days", wiki: "https://browiki.org/wiki/Ninho_de_Nidhogg", coins: 20 },
  { id: "lago_bakonawa", name: "Bakonawa Lake", minLevel: 100, cooldownCategory: "7_days", wiki: "https://browiki.org/wiki/Lago_de_Bakonawa", coins: 20 },
  { id: "caverna_buwaya", name: "Buwaya Cave", minLevel: 100, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Caverna_de_Buwaya", coins: 5 },
  { id: "torre_demonio", name: "Devil's Tower", minLevel: 130, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Torre_do_Dem%C3%B4nio", coins: 5 },
  { id: "ilha_bios", name: "Bios Island", minLevel: 130, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Ilha_Bios", coins: 10 },
  { id: "templo_demonio_rei", name: "Temple of Demon God", minLevel: 140, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Templo_do_Dem%C3%B4nio_Rei", coins: 10 },
  { id: "lab_werner", name: "Werner Laboratory", minLevel: 160, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Laborat%C3%B3rio_Werner", coins: 5 },
  { id: "vila_porings", name: "Poring Village", minLevel: 100, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Vila_dos_Porings", coins: 5 },
  { id: "quarto_crescente", name: "Crescent Room", minLevel: 170, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Quarto_Crescente", coins: 10 },
  { id: "missao_os", name: "OS Mission", minLevel: 160, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Miss%C3%A3o_OS", coins: 7 },
  { id: "lab_wolfchev", name: "Wolfchev Laboratory", minLevel: 130, cooldownCategory: "3_days", wiki: "https://browiki.org/wiki/Laborat%C3%B3rio_de_Wolfchev", coins: 10 },
  { id: "caverna_mors", name: "Mors Cave", minLevel: 130, cooldownCategory: "1_day", wiki: "https://browiki.org/wiki/Caverna_de_Mors", coins: 7 },
  { id: "altar_selo", name: "Sealed Shrine", minLevel: 130, cooldownCategory: "12h", wiki: "https://browiki.org/wiki/Altar_do_Selo" },
  { id: "caverna_polvo", name: "Octopus Cave", minLevel: 100, cooldownCategory: "3h", wiki: "https://browiki.org/wiki/Caverna_do_Polvo", coins: 5 },
  { id: "sarah_fenrir", name: "Sarah vs Fenrir", minLevel: 99, cooldownCategory: "7_days", wiki: "https://browiki.org/wiki/Sarah_vs_Fenrir", coins: 20 },
  { id: "endless_tower", name: "Endless Tower", minLevel: 50, cooldownCategory: "7_days", wiki: "https://irowiki.org/wiki/Endless_Tower" },
  { id: "fortaleza_voadora", name: "Sky Fortress", minLevel: 160, cooldownCategory: "3_days", wiki: "https://browiki.org/wiki/Fortaleza_Voadora", coins: 7 },
  { id: "glastheim_infernal", name: "OGH Challenge", minLevel: 170, cooldownCategory: "3_days", wiki: "https://browiki.org/wiki/Glastheim_Infernal" },
];

export const BASE_CATEGORIES: Category[] = [
  {
    id: "cat_0",
    title: "Semanales / CD Largo",
    color: "var(--accent-strong)",
    items: [
      { id: "ogh_sombria", name: "OGH Hard", cd: 3 * 24 * 3600, cdLabel: "3 días", wiki: "https://browiki.org/wiki/Glastheim_Sombria", coins: 5 },
      { id: "glastheim_infernal", name: "OGH Challenge", cd: 3 * 24 * 3600, cdLabel: "3 días", wiki: "https://browiki.org/wiki/Glastheim_Infernal" },
    ],
  },
  {
    id: "cat_1",
    title: "Instancias Diarias",
    color: "var(--text)",
    items: [
      { id: "ogh", name: "OGH", cd: 24 * 3600, cdLabel: "1 día", wiki: "https://browiki.org/wiki/Maldi%C3%A7%C3%A3o_de_Glastheim", coins: 5 },
      { id: "fabrica", name: "Horror Toy Factory", cd: 24 * 3600, cdLabel: "1 día", wiki: "https://browiki.org/wiki/F%C3%A1brica_do_Terror", coins: 5 },
      { id: "ortus_aqua", name: "Floating Garden (17.2)", cd: 24 * 3600, cdLabel: "1 día", wiki: "https://browiki.org/wiki/Ortus_Aqua" },
      { id: "jardim_secreto", name: "Hidden Flower Garden (17.2)", cd: 24 * 3600, cdLabel: "1 día", wiki: "https://browiki.org/wiki/Jardim_Secreto" },
      { id: "fazenda_pitayas", name: "Pitaya Farm (17.2)", cd: 24 * 3600, cdLabel: "1 día", wiki: "https://browiki.org/wiki/Fazenda_de_Pitayas" },
      { id: "duelo_sweety", name: "Hey, Sweetie! (17.2)", cd: 24 * 3600, cdLabel: "1 día", wiki: "https://browiki.org/wiki/Duelo_com_Sweety" },
      { id: "edda_biolab", name: "Edda Biolab", cd: 24 * 3600, cdLabel: "1 día", wiki: "https://browiki.org/wiki/Edda_do_Biolaborat%C3%B3rio" },
      { id: "edda_glasheim", name: "Edda Glast Heim", cd: 24 * 3600, cdLabel: "1 día", wiki: "https://browiki.org/wiki/Edda_de_Glastheim" },
    ],
  },
  {
    id: "cat_2",
    title: "Monedas de Exploradores",
    color: "var(--accent)",
    items: [],
  },
];

export function getDefaultState(): AppState {
  return {
    activeChar: "c1",
    chars: [
      {
        id: "c1",
        name: "Personaje 1",
        instances: {},
        notes: {},
        custom: [],
        addedInstances: [],
        removedInstanceIds: [],
        collapsed: {},
        order: {},
      },
    ],
  };
}
