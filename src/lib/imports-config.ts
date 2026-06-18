/**
 * Mapping des arrivages / imports KOKPIT → fichier packing list.
 * Édite cette liste pour ajouter un nouvel onglet à /achat/previsionnel.
 *
 * Convention : `code` = nom d'onglet (ex: "IMP 618"), `dataFile` = JSON dans /public/data.
 */

export interface ImportArrival {
  code: string;
  label: string;
  containerNo: string;
  dataFile: string;
  /** Type de container (ex: "40ft", "40ft HC", "20ft"). Optionnel. */
  containerType?: string;
  /** Capacité utile en m³ pour la jauge de remplissage. Optionnel. */
  capacityM3?: number;
  /** Marqueur "prévisionnel / non final" affiché en UI. */
  previsionnel?: boolean;
}

export const IMPORTS: ImportArrival[] = [
  {
    code: "IMP-618",
    label: "IMP 618",
    containerNo: "CAAU9910103",
    dataFile: "container-caau9910103.json",
  },
  {
    code: "IMP-619",
    label: "IMP 619",
    containerNo: "À préciser",
    dataFile: "container-imp619.json",
    containerType: "40ft HC",
    capacityM3: 76.4,
    previsionnel: true,
  },
];
