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
}

export const IMPORTS: ImportArrival[] = [
  {
    code: "IMP-618",
    label: "IMP 618",
    containerNo: "CAAU9910103",
    dataFile: "container-caau9910103.json",
  },
];
