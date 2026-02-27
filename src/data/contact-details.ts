export interface ContactDetails {
  consents: {
    offre: boolean;
    newsletter: boolean;
    invitation: boolean;
    devis: boolean;
  };
  requests: {
    meuble: string;
    date: string | null;
    message: string | null;
  }[];
}

export const contactDetailsData: Record<string, ContactDetails> = {
  "p.laurence140297@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre avec vitre déco _ Miel",
        "date": "03/02/2026",
        "message": "Bonjour, désolé j’avais cassé ! je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Coiffeuse Yogy _ Brut, 1 _ Cassandre avec vitre déco _ Miel",
        "date": "03/02/2026",
        "message": "Bonjour, désolé j’avais cassé ! je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CONSOLE LAURA DAMIER _  ; 1 _ Ensemble Grace _ Cérusé Noir ; 1 _ ULUWATU _ Miel",
        "date": "01/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Oblique",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Oasis",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Ensemble Grace",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "TEST",
        "date": null,
        "message": "TEST"
      },
      {
        "meuble": "AMBALONG 2 PORTES, Chaise Julia",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Tabouret Boro _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Tabouret Boro _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "del_riviere@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Palu _ Cérusé Blanc ; 1 _ Mahira _ Cérusé Blanc",
        "date": "27/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "JAPAN AVEC TDN",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ? Existe t-il en teck brut?"
      },
      {
        "meuble": "Zigzag",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "SUEB",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Chaise Sandi",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      }
    ]
  },
  "annabelle.zettor@sfr.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Fauteuil June _ Miel",
        "date": "03/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "MEUBLE A CHAUSSURES KREYPIAK",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?ainsi que les dimensions"
      },
      {
        "meuble": "CONSOLE STRUCTURE METAL",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Buffet Evolia 4P Bloc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Buffet Evolia 4P Bloc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "ml.nativel68@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Baya",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "1 _ Colonne pour machine à laver _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "deveaux.christelle@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Krepyak _ Miel,Cérusé Noir ; 1 _ OLANDA GM _ Miel",
        "date": "11/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table de nuit  Minimalis",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      }
    ]
  },
  "vincentlebon20@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Evolia _ Miel",
        "date": "08/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants , ainsi que sa disponibilité."
      },
      {
        "meuble": "Table de nuit Ubud",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Evolia 2P Bloc",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Buffet Blokus",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Buffet Evolia 2P Bloc, Buffet Hexagonal",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "dali.maillot@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Sandi _  ; 1 _ Table Carrée Slats _ Miel",
        "date": "03/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Evolia 2P Bloc",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?\n Pourriez vous m'indiquer si vous avez le même meuble en 3 portes et me communiquer son prix également."
      },
      {
        "meuble": "Chaise Kondé, Chaise Lono",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "metro.stephanie@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 3P _ Brut ; 1 _ Etagère Kolum _ Brut ; 1 _ MEUBLE TV SCANDINAVIAN _ Brut ; 1 _ Table basse laquée blanc _ Brut ; 1 _ Bibliothèque Evolia _ Brut",
        "date": "19/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Seko _ Miel",
        "date": "21/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Réalisation d'une cuisine en teck",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Chaise Sandi",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Sherry à suspendre",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Commode Vintage",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Table de nuit Ubud",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "TABLE BASSE MINIMALIS",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Etagère Kolum, Buffet Evolia 3P Bloc, Buffet Evolia 4P Bloc, Buffet Blokus, Chaise Sandi, Colonne pour machine à laver, Mikha 90 cm, Sherry sur pied, Table Nature, SUN",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "elodie.ramy-sepou@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc ; 1 _ Table Marbella _ Cérusé Blanc",
        "date": "29/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Exposition de la cuisine en magasin",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "JULIANA GM, ARMOIRE ROSA, Table de nuit Ubud, Evolia 1P Kreypiak, Table basse minimalis à tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table Aura",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table Aura",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Colonne pour machine à laver _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clara.fontaine974@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table de nuit Ubud",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Cassandre à suspendre",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Brut ; 1 _ Bibliothèque Lounge 4 portes _ Brut ; 1 _ Bibliothèque Seminyak _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hoareaujeanmax@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cassandre à suspendre",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "1 _ OLANDA GM _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table Scandivian _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gigant.florence@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table Nature",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ? Avec les chaises ainsi que ces dimensions ! Merci"
      },
      {
        "meuble": "1 _ Coffeuse Kauwage _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "publicite973@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Blanc",
        "date": "06/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "NATURE",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      }
    ]
  },
  "lysa.hoarau@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry sur pied 2P/1T _ Cérusé Blanc",
        "date": "11/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Evolia 2P Bloc",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      }
    ]
  },
  "caralf.c@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Lounge 4 portes _ Miel ; 1 _ Bureau Eddy _ Miel ; 3 _ Chaise Julia _ Miel ; 1 _ Ensemble Riviéra _ Miel ; 1 _ Table Aura _ Miel",
        "date": "16/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Kuta 100",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ? Livraison ?"
      },
      {
        "meuble": "Etagère Kolum",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Bibliothèque Lounge 4 portes",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "valerie.loni@outlook.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "SUEB GAYA A - 2 tiroirs",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "2 _ TANGGA _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marc.lafaye.run@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Goa _ Brut",
        "date": "24/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "EDDY",
        "date": null,
        "message": "Bonjour, quel est le prix de ce meuble s'il vous plaît ?"
      },
      {
        "meuble": "Meuble salle de bain sous vasque",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "nabila.issop@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "MEUBLE A CHAUSSURES KREYPIAK",
        "date": null,
        "message": "Bonjour, je souhaite un devis et dimensions pour les meubles suivants"
      },
      {
        "meuble": "1 _ Meuble à chaussures Jail _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Etagère Kolum _ Brut ; 1 _ Meuble à chaussures Jail _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ncohou@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "MEUBLE A CHAUSSURES KREYPIAK",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants ainsi que ses dimensions SVP.\nJe vous remercie."
      },
      {
        "meuble": "1 _ Commode Damier _ Miel,Brut ; 1 _ Commode Petite Evolia _ Miel,Brut ; 1 _ OLANDA GM _ Miel,Brut ; 1 _ TANGGA _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "im.fa@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse minimalis à tiroirs _ Miel",
        "date": "12/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "CONSOLE LAURA DAMIER, JULIANA Cérusé blanc, Table Minimalis, Chaise Sandi",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "ludovic.aime@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible ovale _ Cérusé Blanc",
        "date": "17/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Palu",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Ensemble Grace _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ydonia@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Pinter _ Cérusé Noir",
        "date": "16/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table basse Gigogne",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table basse pieds métal",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants. Ca existe en plusieurs dimensions?"
      }
    ]
  },
  "smam308@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "JULIANA Brut, SUEB GAYA A - 3 tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "peralingapalama@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Commode",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Cassandre sur pied, Kuta 60, Kuta 80",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "ARMOIRE BLOCK 2 PORTES, Bureau MINIMALIS, Commode New, Meuble à chaussures Jail",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Console Aubépine",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "SEKO, Armoire Sherry, Chaise Sandi",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "aureliecalaya@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Mikha 90 cm, PRJ, Slats 120 cm, Mikha 125 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Mikha 90 cm, PRJ, Slats 120 cm, Mikha 125 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Slats Rattan _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite savoir si les paniers existent en d'autres couleurs"
      }
    ]
  },
  "bri.lambert974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Bunga _",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Kuta 80",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "fred.possession@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Zigzag",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc ; 1 _ JAPAN AVEC TDN _ Cérusé Blanc ; 2 _ Table de nuit  Minimalis _ Cérusé Blanc ; 2 _ Table de nuit Jail _ Cérusé Blanc ; 2 _ Table de nuit Kreypiak _ Cérusé Blanc ; 2 _ Table de nuit Madiun _ Cérusé Blanc ; 2 _ Table de nuit Ubud _ Cérusé Blanc ; 1 _ UBUD _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants et leurs disponiblités"
      }
    ]
  },
  "laline.cf@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Exposition de la cuisine en magasin  _ Brut",
        "date": "13/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Bibliothèque 12 casiers",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "seb.vergoz@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cassandre à suspendre, Sherry à suspendre, Table basse Gigogne",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "10 _ FAUTEUIL MARINA _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aureliekibio.974@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Lara _ Cérusé Blanc",
        "date": "11/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Bibliothèque Seminyak en finition miel.",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "rick.laurent1@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Chaise Marina noir en finition naturelle x4",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Buffet Evolia 4P Bloc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en finition brut"
      },
      {
        "meuble": "Fauteuil Cozy Rattan",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour 4 meubles suivants"
      },
      {
        "meuble": "Buffet Blokus, Fauteuil Cozy Rattan, FAUTEUIL MARINA",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "mariechloeedefaud@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "CANGGU",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Meuble TV NATURE",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ OLANDA GM _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "doroaudrey@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Lara _ Brut",
        "date": "07/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Cassandre sur pied, Oblique",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Cassandre sur pied, Oblique",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants\nMerci"
      },
      {
        "meuble": "Bureau MINIMALIS",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "aurore_laquia@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "OLANDA GM",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Table de nuit  Minimalis _ Cérusé Blanc ; 1 _ Table de nuit Sherry _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "3 _ Table de nuit  Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "angelmurat@msn.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "JAPAN AVEC TDN, Table de nuit Kreypiak, Meuble à chaussures Jail",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "JULIANA Brut, OLANDA GM",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Coiffeuse Yogy _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "andersonpayet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Meuble à chaussures Jail",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Console 3 tiroirs et pieds en métal _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexia1586@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table basse laquée blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "MEUBLE TV SCANDINAVIAN, Table basse laquée blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Buffet Blokus, Table basse laquée blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants, et j’aimerais que le buffet blokus sois un style scandinavian avec du blanc dedans comme la table basse laqué blanc"
      },
      {
        "meuble": "Buffet Evolia 2P Kreypiak",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Chaise Sandi",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "CANGGU, LIT SLATS 3 NEW",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "MEUBLE A CHAUSSURES KREYPIAK",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pomme974@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Bain de Soleil",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "2 _ Commode 7 tiroirs _ Brut ; 1 _ Commode Chevron _  ;  _  _ Brut ; 1 _ Commode Sculptée _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fernand.saint-alme@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Meuble à chaussures Jail _ Cérusé Blanc",
        "date": "16/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Cassandre à suspendre",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Table Aura _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurie.masse@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Marina ecrues. En vous remerçiant",
        "date": null,
        "message": "Bonjour, je souhaite un devis et des informations sur les dimensions pour les meubles suivants:"
      },
      {
        "meuble": "1 _ DB 33 _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "te.phane@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Meuble TV NATURE",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Meuble TV NATURE",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Table basse pieds métal _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nosbe.laetitia@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Sherry sur pied _ Cérusé Blanc,Brut",
        "date": "12/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table de nuit Sherry",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants 2 tables de xhevet"
      },
      {
        "meuble": "2 _ Cassandre sur pied _ Brut ; 1 _ PRJ _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "audrey.capounda@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Brut _  ; 1 _ SUEB S _ Brut ; 1 _ Table de nuit  Minimalis _ Brut",
        "date": "15/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "SUEB S 100",
        "date": null,
        "message": "Bonjour, je souhaite réserver le meuble suivant :"
      },
      {
        "meuble": "JULIANA Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ CONSOLE LAURA DAMIER _  ; 1 _ JULIANA Brut _  ; 1 _ Table basse minimalis à tiroirs _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clain.robin17@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cassandre à suspendre",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Palu",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants:"
      },
      {
        "meuble": "1 _ Lontan _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maellalehouerou@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE 3 TIROIRS _",
        "date": "26/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table Aura",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants\nMerci"
      }
    ]
  },
  "adrienneahhu@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oblique _",
        "date": "14/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Commode Petite Evolia, Commode Sherry",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants.\nMerci"
      },
      {
        "meuble": "Zigzag 3 tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "crenn.anne-gaelle@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Bureau MINIMALIS",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "TANGGA",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en blanc cérusé. Est il possible d'avoir les dimensions svp. Merci"
      },
      {
        "meuble": "SUEB S",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants. \nAvec les dimensions svp"
      },
      {
        "meuble": "Table a manger ronde",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants ainsi que le diamètre de la table. Il me faudrait 120 cm de diamètre."
      },
      {
        "meuble": "Table Aura",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en 120 cm de diamètre svp."
      },
      {
        "meuble": "Console Aubépine, Buffet Evolia 1P Kreypiak, Buffet Evolia 2P Kreypiak",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Console Aubépine, Buffet Evolia 1P Kreypiak, Buffet Evolia 2P Kreypiak",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Commode Petite Evolia _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "denise.velia974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Console Aubépine",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Milano _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants  en 125x125"
      }
    ]
  },
  "rachelwallaert7@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ OLANDA PM _ Cérusé Blanc",
        "date": "27/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "CORDOBA",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "CANGGU, Lit EVOLIA, LIT SLATS 3 NEW, UBUD",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _  ; 1 _ SUEB S _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "philogene.vanessa@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Fauteuil Elisabeth, FAUTEUIL HIRO",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ UBUD _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "souprayenloic@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cassandre à suspendre, Oasis à suspendre, Zigzag, Colonne pour machine à laver",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurore.cazanove@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "UBUD",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Cassandre à suspendre, UBUD",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Cassandre à suspendre",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "4 _ Chaise Nagasaki _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Chaise Julia _ Brut ; 4 _ Chaise Nagasaki _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "chrislene.ramassamy@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise de bar Yeni _",
        "date": "29/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Commode Vintage",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour le meuble suivant finition naturel, cordialement."
      },
      {
        "meuble": "2 _ Chaise Julia _ Brut ; 3 _ FAUTEUIL HIRO _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "p.steimetz@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode New _ Cérusé Noir",
        "date": "26/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Cérusé Blanc ; 1 _ Commode New _ Cérusé Noir ; 1 _ Dressing sur mesure _ Cérusé Noir",
        "date": "26/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Kuta 60",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Kuta 60",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Kuta 100, Stickley",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "begue-wilfried@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Miel ; 1 _ Bibliothèque Seminyak _ Miel ; 10 _ Chaise de Jardin Hampton _ Miel ; 1 _ Commode Damier _ Miel ; 1 _ CORDOBA _ Miel ; 1 _ Ensemble Riviéra _  ; 1 _ Exposition de la cuisine en magasin  _ Miel ; 1 _ Jimbaran _ Miel ; 1 _ MANTIGGAN _ Miel ; 1 _ MEUBLE A CHAUSSURES KREPYAK _ Miel ; 1 _ Table de jardin extensible ovale _ Miel ; 2 _ Tabouret Boro _",
        "date": "19/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Buffet Blokus",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "noever974@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Nagasaki _ Miel, 1 _ Fauteuil June _ Miel",
        "date": "07/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Console Séga _ Miel, 1 _ AMBALONG 2 PORTES _ Miel, 1 _ Padang _ Miel",
        "date": "05/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Console Séga _ Miel, 1 _ AMBALONG 2 PORTES _ Miel, 1 _ Chaise Nagasaki _ Brut, 1 _ Padang _ Miel, 1 _ Fauteuil June _ Miel",
        "date": "05/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "DB 33",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "grondinsandra@laposte.net": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Ensemble Riviéra",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Ensemble Riviéra",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Table de jardin extensible ovale _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurence.payet@dimexoi.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis _ Miel",
        "date": "13/12/2024",
        "message": "Test"
      },
      {
        "meuble": "test",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 Cassandre à suspendre Miel,Cérusé Blanc,Brut, 6 Chaise Julia Cérusé Blanc,Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Oasis _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit  Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit  Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cneuvillers@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Kuta 60 KUTA 100 KUTA 120",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Bain de Soleil _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "doris.domitin15@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _  ; 1 _ Sherry sur pied _ Miel ; 1 _ Zigzag 3 tiroirs _ Cérusé Blanc ; 1 _ TOLITOLI PETIT _ Cérusé Blanc ; 1 _ Nusa _ Brut ; 1 _ Padi _ Miel",
        "date": "03/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Baya",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Baya, Oasis, Slats 140 cm, Slats Rattan",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants réponse par mail svp merci"
      },
      {
        "meuble": "Baya",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "laura.chevreau@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Meuble sous vasque ( double vasque )",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Oasis à suspendre",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Zigzag",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Slats 140 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table basse Minimalis",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en ceruse blanc svp"
      },
      {
        "meuble": "CORDOBA",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "CORDOBA, LIT SLATS 3 NEW, UBUD",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Table basse Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maryse_was@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Nagasaki _ Brut ; 4 _ FAUTEUIL MARINA _ Brut ; 1 _ Table Aura _ Brut ; 4 _ Fauteuil June _ Brut",
        "date": "13/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Meuble sous vasque avec pieds Gattaga",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants\nMerci"
      }
    ]
  },
  "titirose1@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Minimalis _ Cérusé Blanc",
        "date": "05/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 meuble sous evier de 80cm avec 2 portes\n1 meuble lave vaisselle tout intégrable + porte \n1 caisson de 60cm pour four\n1 caisson de 80 cm avec 1 tiroir couvert et 1 casserolier \n1 caisson de 80 cm 1 porte\n1 caisson de 60 cm 1 porte\n1 colonne 1 porte et 4 tiroirs interieur\n1 meuble haut de 45*80 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "locamarie.a@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Bain de Soleil, Ensemble Sofa K",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Bain de Soleil, Ensemble Sofa K",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Table de nuit  Minimalis _ Cérusé Blanc ; 1 _ Table de nuit Kreypiak _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc ; 1 _ Table de nuit  Minimalis _ Cérusé Blanc ; 1 _ Table de nuit Kreypiak _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "claire.cbc@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Hexagonal _ Cérusé Blanc",
        "date": "01/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants .\n\nL’avez vous en 3 ou 5 portes svp ?"
      },
      {
        "meuble": "Commode 7 tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants \nJ’ai vu qu’il était sur commode . Cb de temps d’attente svp ?"
      },
      {
        "meuble": "1 _ Table Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "auriane.rim@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Bureau MINIMALIS, CANGGU, Chaise Stockholm (JAYA), LIT SLATS 3 NEW, Table de nuit Ubud",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants (les lits en 160cm)"
      },
      {
        "meuble": "1 _ Commode Petite Evolia _  ; 1 _ LIT SLATS 3 NEW _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rodolphetortel@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Nabul _ Brut",
        "date": "26/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _  ;  _  _ Miel ; 4 _ LIT SLATS 3 NEW _ Miel ; 1 _ MEUBLE A CHAUSSURES KREPYAK _  ; 1 _ Table Mountain _",
        "date": "17/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Ensemble Grace",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Bain de Soleil, Ensemble Grace",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "dmnmaillot@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Meuble TV NATURE _ Cérusé Blanc",
        "date": "07/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "BUREAU PENDERIE",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants et je ne peux pas vous appeler car je suis sourd. Pouvez vous écrire un SMS ou mail merci."
      }
    ]
  },
  "mahevah07@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Commode Damier",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Commode Damier",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Jampi _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "juanito.lavergne@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Meuble TV NATURE",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Meuble TV NATURE, Buffet Evolia 2P Bloc, Buffet Evolia 3P Bloc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants\n(Pourriez-vous me donner les différentes colonies ?)"
      },
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Miel ; 1 _ Meuble TV NATURE _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : (ainsi que leurs dimensions meubles + tarif de livraison sur l'étang salé, adresse : 6 Impasse Célimène Gaudieux 97427 Etang Salé)"
      }
    ]
  },
  "karine.payet97430@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Miel,Cérusé Blanc,Cérusé Noir ; 1 _ Bibliothèque Evolia _ Miel",
        "date": "10/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Armoire Rosa _ Miel,Cérusé Noir",
        "date": "21/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "BUREAU INFORMATIQUE, Commode Chevron, CONSOLE MINIMALIS, PINTER",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "didierzadire0@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Zigzag",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Colonne pour machine à laver",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "2 Lit EVOLIA, Ensemble Riviéra",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "4 _ Chaise Henry _ Miel ; 1 _ Table Aura _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurelie.10@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "FAUTEUIL MARINA",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants, pourriez vous me communiquer le devis par mail svp"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _  ; 1 _ MANTIGGAN _  ; 1 _ SYDNEY _  ; 1 _ TANGGA _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jessica.govindama@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Sherry à suspendre, Zigzag 90, SUN, Zigzag 3 tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "6 _ Chaise Ruji _ Cérusé Noir ; 1 _ Table Scandivian _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "betty.sarpedon974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Armoires",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "2 _ Bureau Eddy _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "julia.clef@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cassandre à suspendre, Oasis à suspendre",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "2 _ Table de nuit  Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hafsa786@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cassandre à suspendre, Oasis à suspendre, OLANDA GM, Zigzag",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Baya _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "abaraudrey@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Zigzag",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "2 _ Chaise Nagasaki _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "xav.mj.juju.974@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ Bureau Naya _ Cérusé Blanc",
        "date": "03/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Seko _ Brut",
        "date": "03/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "UBUD",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "damourmaeva.margane@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Ubut lit",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Oblique",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Oasis 100 cm _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 80cm svp"
      }
    ]
  },
  "barouti.romain@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cassandre à suspendre",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants.\nJ’ai également vu d’autres modèles mais je souhaite avoir de la visibilité pour le moment\nPourriez vous m’indiquer sous quel délai une livraison est possible si nous validons la proposition. \nVous remerciant pour votre réponse \nRomain"
      },
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jfrancois.grondin2@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Cérusé Noir",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Ensemble Riviera avec table ronde uniquement \nCousins gris anthracite si possible \nMerci",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "chatoona82@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Sofa K _ Miel,Cérusé Blanc",
        "date": "26/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table basse pieds métal",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Chaise Nagasaki",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "anna.morvezen@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zig-zag 100 _ Miel",
        "date": "03/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Fauteuil Cozy Rattan",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "chantalabolet@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Commode",
        "date": "01/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Commode",
        "date": "01/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Commode Sherry _ Cérusé Blanc",
        "date": "01/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Commode Sherry _ Cérusé Blanc ; 1 _ Table de nuit Krepyak _ Cérusé Blanc",
        "date": "01/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Dressing sur mesure _ Cérusé Blanc",
        "date": "01/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "CANGGU",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "lefevre.so@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Brut",
        "date": "02/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "ARMOIRE ROSA, Mikha 90 cm, Slats Rattan",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Armoire Rosa _ Brut ; 1 _ Bibliothèque 12 casiers _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jerezchristophe13@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Buffet Evolia 3P Bloc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table basse Minimalis",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "MANTIGGAN, SUEB GAYA A - 3 tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Table basse minimalis à tiroirs _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jowax974@outlook.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Chaise Sandi, FAUTEUIL HIRO, FAUTEUIL MARINA, Sherry sur pied (120cm)",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants svp. Merci."
      },
      {
        "meuble": "1 _ FAUTEUIL HIRO _ Cérusé Noir ; 1 _ Sherry sur pied 2P/1T _ Cérusé Noir ; 1 _ TOLITOLI _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nadiatecher974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Chaise Rattan",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants pour 4 chaises. Svp"
      },
      {
        "meuble": "4 _ Chaise Rattan _ Miel ; 1 _ Sherry à suspendre _ Cérusé Blanc ; 1 _ Colonne Laura Krepyak _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "raphael.azais@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TABLE BASSE MINIMALIS _ Brut ; 1 _ Table Minimalis _ Brut ; 1 _ Table basse Floride _ Brut",
        "date": "27/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Gattaga",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "gla.maillot@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "ARMOIRE BLOCK 2 PORTES, ARMOIRE ROSA",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Lave-mains en teck _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "julianeriviere@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": "27/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : ce type de meuble mais en 160 cm s'il vous plait"
      },
      {
        "meuble": "Buffet Evolia 2P Bloc, Buffet Evolia 4P Bloc, MANTIGGAN",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "yhnel13@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Meuble à chaussures Jail, MEUBLE A CHAUSSURES KREYPIAK",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "x.bocquillet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "lit",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : Lit Slats 3, Miel, 160cm"
      },
      {
        "meuble": "LIT SLATS 3 NEW, Meuble TV NATURE, Table de nuit  Minimalis",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "amelie.balencourt@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _  ; 1 _ Armoire Sherry _ Miel ; 1 _ Commode Sherry _ Miel",
        "date": "29/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "LIT SLATS 3 NEW",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "LIT SLATS 3 NEW",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants."
      }
    ]
  },
  "luigibenard029@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre sur pied _ Miel,Brut",
        "date": "06/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Console Séga",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "juliadijoux@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Zigzag 90, Zigzag 3 tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants. Aussi pourriez-vous m'indiquer s'ils sont en stock. En vous remerciant"
      },
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en diamètre 100 ou 110. Merci"
      }
    ]
  },
  "virginie.reha@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise de bar Yeni _ Cérusé Noir",
        "date": "26/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Chaise Lono",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table Carrée",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table Aura",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Chaise Dowel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Table Aura _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ SUEB GAYA A - 2 tiroirs _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "_  _ Cérusé Noir ; 1 _ Table Minimalis _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "robert.anaelle92@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Fauteuil Adèle _ Cérusé Blanc",
        "date": "10/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Meuble TV NATURE _ Cérusé Blanc, 4 _ FAUTEUIL MARINA _ Cérusé Blanc",
        "date": "10/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Oasis à suspendre, Palu",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants\nProposez  vous des vasques également? Je ne les retrouve pas sur l'application"
      }
    ]
  },
  "marie.domitin@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Mikha 90 cm _ Miel",
        "date": "28/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Baya",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "charlybegood06@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Miroir Maja _ Brut",
        "date": "21/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Miroir Candi _ Brut ; 1 _ Miroir Maja _ Brut",
        "date": "21/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Miroir Candi",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "saminadin.jean@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Echelle pour salle de bains _ Miel ; 1 _ Miroir Candi _ Miel",
        "date": "30/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Buffet Blokus",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table basse en suar, Buffet Blokus",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Miroir Candi",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "3 _ Miroir Maja _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Colonne Evolia 2P _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "suzanne.gay280290@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table Scandivian",
        "date": null,
        "message": "Bonjour, nous cherchons plusieurs types de meubles, et souhaitons connaitre votre ordre de prix pour une table de ce type longueur 1,80m, Cordialement"
      },
      {
        "meuble": "2 _ Table basse Baliti _ finition",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : bois cérusé noir"
      }
    ]
  },
  "virginie.grosdemouge@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Sherry _ Cérusé Blanc",
        "date": "27/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Table de nuit Sherry _ Cérusé Blanc ; 2 _ Table de nuit Ubud _ Cérusé Blanc",
        "date": "27/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "BUREAU INFORMATIQUE",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "BUREAU INFORMATIQUE",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "anthony.volia.av@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc ; 1 _ Buffet Hexagonal _ Cérusé Blanc ; 1 _ DB 33 _ Cérusé Blanc ; 1 _ MANTIGGAN _ Cérusé Blanc ; 1 _ OLANDA GM _ Cérusé Blanc ; 1 _ OLANDA PM _ Cérusé Blanc",
        "date": "06/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Baya, Cassandre à suspendre, Seville Kreypiak, Slats 140 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants uniquement par mail. Je ne suis pas joignable par téléphone."
      }
    ]
  },
  "pierre.rieul@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Bibliothèque 12 casiers",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "2 _ Buffet Evolia 2P Kreypiak _ Miel,Cérusé Blanc,Brut ; 1 _ Echelle pour salle de bains _ Cérusé Blanc ; 1 _ OLANDA GM _ Cérusé Blanc ; 1 _ SUEB GAYA A - 3 tiroirs _ Brut ; 1 _ Table de nuit Madiun _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants et savoir si une fois les éléments de devis validés, s'il est possible de réaliser le paiement par virement bancaire. Merci pour votre aide. \n\nPierre"
      }
    ]
  },
  "techerjean5@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Non spécifié",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Non spécifié",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Chaise Damier",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Chaise Jaya _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 8 chaises"
      }
    ]
  },
  "gladysomnes@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table de nuit Alkmaar",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table de nuit Alkmaar, Table de nuit Kreypiak",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "amelie.gerville@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Palu, Zigzag 3 tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Cassandre à suspendre",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en 1m svp"
      },
      {
        "meuble": "1 _ Meuble TV NATURE _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Meuble TV NATURE _ Brut ; 1 _ MIRIH _ Brut ; 1 _ TANGGA _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mickael.bijoux@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table de nuit Alkmaar",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en couleur miel"
      },
      {
        "meuble": "Bureau EDDY, NABUL, SEKO",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "_  _ Miel ; 1 _ Colonne Minimalis Damier _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse Minimalis _ Cérusé Noir ;  _  _ Miel ;  _  _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Chaise Julia _ Cérusé Noir ;  _  _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "neptisliberti@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "ARMOIRE BLOCK 2 PORTES, Commode New",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ MANTIGGAN _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gtaochy@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cassandre à suspendre",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour le meuble suivant , en 120cm et 100cm svp."
      },
      {
        "meuble": "2 _ SYDNEY _ Cérusé Blanc,Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "csophieviorney@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Brut",
        "date": "01/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "SUEB GAYA A - 2 tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ SUEB GAYA A - 2 tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "taverne.claire@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Chaise Jaya",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Commode Petite Evolia _ Miel ; 2 _ Dressing sur mesure _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ramshamila@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Miel ; 1 _ SUEB GAYA A - 2 tiroirs _ Miel",
        "date": "16/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Meuble TV NATURE _",
        "date": "15/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table basse minimalis à tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ OLANDA PM _ Miel ; 2 _ SUEB S _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\nEn dimension 120 et 140 cm de longueur svp (si possible de faire sur mesure)\nPourriez vous m indiquer également svp les dimensions de chaque meuble: hauteur/profondeur\nMerci"
      },
      {
        "meuble": "1 _ OLANDA GM _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Meuble TV NATURE _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maeva.begue0209@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Kuta 80, Mikha 125 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants svp"
      },
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Cérusé Blanc ; 1 _ Buffet Evolia 4P Bloc _ Miel,Cérusé Blanc ; 1 _ JAPAN AVEC TDN _ Miel ; 1 _ JULIANA Brut _ Cérusé Blanc ; 1 _ SUEB S _ Cérusé Blanc ; 1 _ Table de nuit Alkmaar _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "megane680@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Brut _ Brut",
        "date": "25/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "CORDOBA",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour ce lit en 140x190cm. \nÉventuellement savoir si vous faites des facilités de paiement. \n\nBien à vous"
      },
      {
        "meuble": "1 _ Commode Petite Evolia _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "valerymarieg@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "DB 33",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "DB 33, Table basse Minimalis",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "DB 33, Lit EVOLIA, Table basse Minimalis",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Lit EVOLIA",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ DB 33 _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ DB 33 _  ; 1 _ Table Nature _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Lit EVOLIA _ Miel 90 x 190 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anna.ambrosetti@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Buffet Evolia 4P Bloc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ EVO _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "herve.degard@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Baya",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants Baja sous vasques"
      },
      {
        "meuble": "2 _ Gattaga _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :et les dimensions svp merci"
      },
      {
        "meuble": "1 _ Slats 140 cm _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Lit EVOLIA _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "tipo974@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TABLE BASSE MINIMALIS _ Miel",
        "date": "17/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Armoire Isabelle",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Armoire Isabelle, Armoire Sherry",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "Table de nuit Kreypiak",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "caroline.aussedat@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "CANGGU, Lit EVOLIA, UBUD",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "ARMOIRE KREYPIAK, Coiffeuse Yogy, Table de nuit  Minimalis",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Armoire Block _  ; 1 _ Armoire Krepyak _  ; 1 _ Armoire Isabelle Minimalis _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants. Y aura-t-il des soldes sur un des meubles ? Merci beaucoup"
      }
    ]
  },
  "joan.cros@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Alkmaar _ Brut",
        "date": "16/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "ensemble sofa",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "emmanuellemussard@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table carre ou rectangulaire petit dimension",
        "date": "31/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Meuble teck machine à laver",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "2 _ Table basse minimalis à tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "foliobrice@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Luma _ Brut",
        "date": "03/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Dressing sur mesure _",
        "date": "03/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "PINTER, Etagère Kolum",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "nalet.jessica@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Sherry à suspendre, Zigzag, Zigzag 3 tiroirs",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants. Les meubles simple vasque en 90cm + le double vasque. Merci"
      },
      {
        "meuble": "1 _ Sherry à suspendre _ Brut ; 1 _ Slats 140 cm _ Brut ; 1 _ Zigzag _ Brut ; 1 _ Zigzag 3 tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "diana.hoareau13@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Chaise de bar Eve _ Cérusé Noir",
        "date": "27/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Chaise de bar Eve _ Cérusé Noir ; 1 _ Chaise de bar Andara _ Miel,Brut",
        "date": "27/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "6 chaises",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "nehouag@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel",
        "date": "05/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 140x190"
      },
      {
        "meuble": "1 _ Ensemble Sofa K _ Miel",
        "date": "02/07/2025",
        "message": "Bonjour, je souhaite un devis et la disponibilité pour le meuble suivants, en vous remerciant par avance :"
      },
      {
        "meuble": "Lit EVOLIA en 140x190",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      },
      {
        "meuble": "1 _ Chaise Nagasaki _ Miel ou brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit  Minimalis _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "contact@poterie.re": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Chaise Julia",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "JE VEUX DES MEUBLES EN TECK",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "LOL",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table basse Baliti, Chaise Nagasaki",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table basse Baliti, Chaise Nagasaki",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "6 Chaise Nagasaki Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 Chaise Nagasaki Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CORDOBA _ Miel,Cérusé Blanc ; 2 _ Table de nuit Alkmaar _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "3 _ AMBALONG 1 PORTE _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "3 _ AMBALONG 1 PORTE _ Miel ; 1 _ Echelle pour salle de bains _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Commode 7 tiroirs _ Miel,Cérusé Blanc,Brut,Cérusé Noir ; 2 _ Commode Chevron _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel,Cérusé Blanc ; 2 _ Table basse Baliti _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Oasis 100 cm _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Exposition de la cuisine en magasin  _ Cérusé Noir ; 1 _ Oasis 100 cm _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _  ; 1 _ Chaise Nagasaki _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Cérusé Blanc ; 1 _ Exposition de la cuisine en magasin  _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel,Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel,Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Dressing sur mesure _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Dressing sur mesure _ Miel,Cérusé Blanc ; 1 _ MEUBLE A CHAUSSURES KREYPIAK _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Dressing sur mesure _ Miel,Cérusé Blanc ; 1 _ MEUBLE A CHAUSSURES KREYPIAK _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Dressing sur mesure _ Miel,Cérusé Blanc ; 1 _ MEUBLE A CHAUSSURES KREYPIAK _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Dressing sur mesure _ Miel,Cérusé Blanc ; 1 _ MEUBLE A CHAUSSURES KREYPIAK _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fournisseur@dimexoi.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "TESTOU",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "COUCOU",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "CASSANDRE AVEC UN MIROIR",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table basse Baliti, Chaise Nagasaki",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sarene.sr@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Zigzag",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Oasis 100 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurelie_girardeau@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Meuble à chaussures Jail",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Lit EVOLIA _ Cérusé Blanc ; 1 _ UBUD _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants ( pour un matelas de 160cm sur 200cm)"
      }
    ]
  },
  "valérie.dambreville3008@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "SEKO",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mae.siampirave@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Sherry sur pied",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "msaintleu@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Bain de Soleil",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pauline.hyy@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table Scandivian",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marialargeau@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Oasis 100 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "romane.gabriel1501@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Chaise Nagasaki _ Brut ; 1 _ Commode Vintage _ Cérusé Blanc ; 1 _ CONSOLE MINIMALIS _ Cérusé Blanc ; 1 _ FAUTEUIL HIRO _ Cérusé Blanc ; 1 _ Sherry à suspendre _ Cérusé Blanc ; 1 _ Table basse Gigogne en granite _ Brut ; 1 _ Table de nuit Sherry _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stephanemaillot91@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse pieds métal _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "saladelice23@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "15 _ Chaise Julia _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "st.basque@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Noir ; 1 _ JAPAN AVEC TDN _ Cérusé Noir ; 1 _ UBUD _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "celine.brandner@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 60 _ Miel ; 1 _ Lave-mains en teck _ Miel ; 1 _ Zigzag 3 tiroirs _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anna.boyer@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "10 _ FAUTEUIL HIRO _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "a.dhawotal@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Sandi _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marie.verrou@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Coiffeuse Yogy _ Brut ; 1 _ LAWANG _ Cérusé Blanc ; 1 _ OLANDA GM _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "icepickbonk@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "e.mily974@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "otonaguado@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "flo.curdy@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ Armoire Rosa _ Brut ; 2 _ Armoire Sherry _  ; 1 _ Armoire Isabelle Minimalis _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexandra.pareau@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Console Séga _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lioni.v@hormail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Scandivian _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mmerarin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maikandanie@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Chevron _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "celine.griffe@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry à suspendre _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en longeur 100cm"
      }
    ]
  },
  "juliie.been@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ FAUTEUIL HIRO _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "adolphegisele974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Nature _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vincentlolita1@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "m.raspiller@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible ovale _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "deborahely310113@outlook.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table Aura _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hoarauemilie12@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SUEB GAYA A - 3 tiroirs _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Meuble TV NATURE _ Cérusé Blanc ; \n\n1 _ SYDNEY _ Cérusé Blanc ;\n\n 1 _ TANGGA _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit  Minimalis _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marieleperlier@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "salma.randera@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Etagère Kolum _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "onenn 974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Alkmaar _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "olivier.a.piveteau@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Gattaga _ Miel en taille 150cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : taille 150"
      }
    ]
  },
  "montusclatc@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Nagasaki _ Cérusé Blanc ; 2 _ FAUTEUIL HIRO _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "yowane86@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Julia _ Cérusé Noir ; 1 _ Table Aura _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "c.victorine@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "chris.somarandy@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Gigogne en granite _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "esery257@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Alkmaar _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurelieleveneur974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Armoire Sherry _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "florian.idmont@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Brut 160x200",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "camillelegros12@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ FAUTEUIL HIRO _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "contact@keepkaz.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ FAUTEUIL HIRO _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elo97441@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Chaise Nagasaki _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "frederikmayo@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry sur pied 120 cm _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sabineguichaman@yahoo.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Seko _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "juliette.futhazar@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Jodya _ Cérusé Noir ; 2 _ Mikha 125 cm _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "prescilla.adrien@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Coffeuse Kauwage _ Miel ;  _  _  ; 1 _ Commode Damier _ Miel ; 1 _ Commode Petite Evolia _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emma.abmont@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table ronde pied conique",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "huetcindy3@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Chaise Nagasaki _ Miel,2 chaise Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jessie.darty@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Jaya _ Cérusé Blanc ; 1 _ Chaise Upin _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "caroleregnault@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "muriel.peron05@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Carrée _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sbarcatoula@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Baliti _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elodiesouton425@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mluciejj@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "killiamtessa@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Julia _ Cérusé Blanc ; 1 _ Chaise Nagasaki _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "agouyer@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "manon.sian@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc ; 4 _ Chaise Julia _ Cérusé Blanc ; 1 _ Table Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vertenora@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Coffeuse Kauwage _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Coffeuse Kauwage _ Brut ; 1 _ Coiffeuse Yogy _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gis.aless@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Nagasaki _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "4 _ Chaise de Jardin Hampton _ Cérusé Blanc ; 4 _ Chaise Nagasaki _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "patriciahoury@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Eddy _ Miel,Brut ; 1 _ Bureau Seko _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "christine.martin@gbh.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "f.polder@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jessica_leon@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _ Cérusé Blanc,Brut",
        "date": "26/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Commode Sculptée _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "omahira.coutin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Dessin de cuisine en teck _ Miel \nUn linéaire comprenant \n- deux meubles colonne avec tiroirs \n- un meuble pour lave vaisselle \n- un meuble sous evier \n- une colonne avec four et micro-ondes \n\nEst-ce possible d'avoir frigo encastrable/integrable ?\n\nUn ilot avec meuble casserolier +épicier au minimum \n\nOn aimerait un plan de travail en céramique \nUn autre meuble casserolier \n\nEn vous remerciant \nBien cordialement",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marie1149@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Nature _ Miel ; 1 _ Table Scandivian _ Miel ; 1 _ Table Mountain _  en 2m de longueur merci",
        "date": "28/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Meuble à chaussures Jail _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Tewah 2P _ Miel ; 1 _ Meuble à chaussures Jail _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Armoire Krepyak _ Cérusé Blanc ; 1 _ Buffet Tewah 2P _ Miel ; 1 _ Meuble à chaussures Jail _ Brut ; 1 _ Table de jardin extensible _ Miel ; 1 _ Table Scandivian _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "la-iqah.madi@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Sandi _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stephanieteyssere@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Bain de Soleil _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "valerie.farcy@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pierrebussiere55@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 3P _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "miss.ep@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anne-so.66@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Oblique _ Cérusé Blanc ; 1 _ Sherry à suspendre _ Cérusé Blanc ; 2 _ Sherry sur pied _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jeanpicoelho@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Cérusé Noir ; 1 _ JAPAN AVEC TDN _ Cérusé Noir ; 1 _ Lit EVOLIA _ Miel ; 1 _ Table basse minimalis à tiroirs _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "felixsylvine@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MIRIH _ Cérusé Noir 200cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "murielleolivier.hoarau@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eric498.jeannette@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Blanc ; 1 _ Palu _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fclastreslecolier@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jodya _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "wong.ophelie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cathalina.rivierebjp2019@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 80 _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "robmobil04@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode 7 tiroirs _ Cérusé Noir ;  _  _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "celia.mery@sfr.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Kreypiak _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : est-il possible d'avoir ce modèle en 3 ou 4 portes svp?"
      }
    ]
  },
  "virginie.crescence@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Miel ; 1 _ Ensemble Riviéra _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stephevan@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre sur pied _ Brut",
        "date": "27/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse Gigogne _ Miel,Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lydiesuzanne1@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Brut ; 1 _ LIT SLATS 3 NEW _ Brut 149x190",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emmanuelle.murat@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Nagasaki _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eurydice.lallemand@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Julia _ Brut,Cérusé Blanc ; 1 _ Chaise Nagasaki _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "a.bonardin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Grace _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "krystel.d974.cd@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Julia _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "beamamindy@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _  ; 1 _ CORDOBA _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en 160/200 :"
      }
    ]
  },
  "jeremyn500@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alphonse.grosset@icloud.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Eddy _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cks.beatrice@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Kreypiak _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mnnkoenig@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MIRIH _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 120cm"
      }
    ]
  },
  "julien.cadoret08@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Bunga _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "oldericj@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel ; 1 _ Commode Chevron _ Miel ; 1 _ Lave-mains en teck _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "romainpayet90@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Miel ; 1 _ AMBALONG 2 PORTES _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nelsongaelle@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lave-mains en teck _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hoarau.christophe0@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lu.andiere@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel,Cérusé BlancB",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour le meuble suivant en 160x200cm. Merci et bonne journée"
      },
      {
        "meuble": "1 _ Buffet Evolia 2P Bloc _ Miel ; 1 _ Buffet Evolia 3P Bloc _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "reneeguedama@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "majujupayet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc ; 1 _ Lit EVOLIA _ Cérusé Blanc ; 1 _ UBUD _ Cérusé Blanc,Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : dimension 140 x 190"
      }
    ]
  },
  "narbe.jessica@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Kondé _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "leon.julie110@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Nagasaki _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "smounou974@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Lounge 4 portes _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "coupouchetty.christopher@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Gattaga _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sarrun974@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 3P _ Miel,Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\nAuriez vous un visuel du meuble pour chacune de ces finitions svp?"
      }
    ]
  },
  "severinebertaux@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Kondé _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "valinraina423@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ FAUTEUIL MARINA _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "e.narayanin@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "edmond.julie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Kreypiak _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "claink974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Miroir Maja _ Miel,Brut,Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "viramavanessa@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mariedaniellejalasson@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sorresjeanyves@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MEUBLE A CHAUSSURES KREYPIAK _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "grondin.emilie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Jaya _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "juliehuillet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marine97430@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis 100 cm _  ; 1 _ Palu _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "adelinebazin9@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Meuble TV NATURE _ Cérusé Blanc ; 1 _ TABLE BASSE MINIMALIS _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fionabergheau@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ FAUTEUIL HIRO _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "reineprune@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Cérusé Blanc ; 1 _ Armoire Isabelle Minimalis _ Cérusé Blanc ; 1 _ Commode 7 tiroirs _  ; 1 _ Commode New _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "brenda.dijoux@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Kondé _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "volceyaika@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Kondé _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jesskabicek@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "faustin1016@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne pour machine à laver _ Brut ;  _  _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "valerielarisson24@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laeti2507@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Hampton _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "makiagence@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Pinter _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lydia.balaya@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emiliechan.86@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marineadele13@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 100 _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "isahoa@icloud.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Madiun _ Miel,Brut ; 2 _ Table de nuit Sherry _ Miel,Brut",
        "date": "19/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Table de nuit Sherry _ Brut",
        "date": "11/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit Madiun _ Brut ; 2 _ Table de nuit Sherry _ Brut",
        "date": "11/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ JULIANA Brut _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "delgsabine@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode 7 tiroirs _  ; 1 _ Commode New _  ; 1 _ Table basse Gigogne _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "didi.faconnier@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "payetfabien07@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Rattan _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eanaick": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eanaick@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Chevron _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "olivier.taland@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lave-mains en teck _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurore.cazanove@glail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ Chaise Julia _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eclipse.decoration@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Nature _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis avec les dimensions suivantes pour la table : L250cm x P100cm"
      }
    ]
  },
  "sabrinahohang@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ CANGGU _ Miel ; 2 _ JAPAN AVEC TDN _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "yvan974@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Block _  ; 1 _ Armoire Sherry _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "tiovelia@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 100"
      }
    ]
  },
  "nkmarand@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jasmin.bertrand85@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clemale@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hoarau.cedric.re@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "achjeremy@aol.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Miel,Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marion.boyer0405@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants svp :"
      }
    ]
  },
  "jean-hubert.meyer@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bain de Soleil _ Brut ; 1 _ Buffet Evolia 4P Bloc _ Brut ;  _  _  ; 1 _ Cassandre à suspendre _ Brut ; 1 _ CONSOLE 3 TIROIRS _ Brut ; 1 _ Echelle pour salle de bains _ Brut ; 1 _ Lave-mains en teck _ Brut ; 2 _ Zig-zag 100 _ Brut ;  _  _  ; 1 _ Zigzag 3 tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "payetclodoal@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "loulou97425@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "braultjonathand.g@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "encule974@yopmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nicobornot@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kimberly7691@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lontan _ Brut ; 1 _ PRJ _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marieanneincana@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode 7 tiroirs _ Cérusé Blanc ; 1 _ Commode Chevron _ Cérusé Blanc ; 1 _ Commode New _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "riviere.lucierose@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Damier _  ; 1 _ Commode New _ Brut ; 1 _ Commode Petite Evolia _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "morelluc02@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pothinanabelle@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anaisriviere61@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : car je suis intéressé pour le prendre svp"
      }
    ]
  },
  "christine97601@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ LAWANG _ Miel ; 1 _ Table Scandivian _ Cérusé Noir ;  _  _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sam.ramidge@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre avec vitre déco _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ EVO _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurence.moutiapoulle@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse en suar _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marinette1345@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Damier _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "loljeeh.shanty@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rolandantiphan@outlook.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table basse laquée blanc _ Brut ; 1 _ Jampi _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexe.marie@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stevy97427@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "annechristellequitano@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Etagère Kolum _ Miel",
        "date": "04/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Oasis à suspendre _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ TOLITOLI _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Slats 140 cm _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Oasis _ Miel ; 1 _ Slats 140 cm _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Zigzag _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ EVO _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ UBUD _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : dimension 140*190"
      },
      {
        "meuble": "1 _ Table de nuit Ubud _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit Madiun _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Commode Sculptée _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse Gigogne _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sandrinesomer557@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Miel ;  _  _ Miel ; 1 _ JULIANA GM _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "boris974974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Lave-mains en teck _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emiliegigant@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "axelle.lembert@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elisabethfrederique97412@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "isop.damienpro@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _  ; 1 _ Hampton _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants s’il vous plait, et j’aimerais avoir les dimensions svp. Merci par avance;"
      }
    ]
  },
  "ackerwilliam83@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry à suspendre _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maeva.plante@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel ; 4 _ Chaise haute jardin _ Miel ; 1 _ Coffeuse Kauwage _ Miel ; 1 _ JAPAN AVEC TDN _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : sachant que j’ai une remise avec le COGOHR car je travaille au CHU"
      },
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _  ; 1 _ JAPAN AVEC TDN _  ; 1 _ Miroir Candi _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anca.birsan@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour un meuble sous vasque d'environ 40 cm de profondeur et entre 60 et 100 cm (max) de largeur. Merci beaucoup"
      }
    ]
  },
  "wendy_zitte@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oblique _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Oblique _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "carolascoux@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc en 160",
        "date": null,
        "message": "Bonjour, je souhaite deux devis svp :\n- un pour le meuble suivant de votre catalogue en 160*200\n- un pour le même meuble mais seulement en encadrement (sans le sommier) avec toujours la tête de lit"
      }
    ]
  },
  "nathalie.calpetard @wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "betsy.th@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TABLE BASSE MINIMALIS _ Miel ; 1 _ Jampi _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fisio.galan@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 125 cm _ Miel,Cérusé Blanc ; 1 _ Oasis à suspendre _  ; 1 _ Palu _ Cérusé Blanc ; 1 _ Sherry à suspendre _  ; 1 _ SUN _ Cérusé Blanc,Brut ; 1 _ Zigzag _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Echelle pour salle de bains _ Brut ; 1 _ Oasis 100 cm _ Brut ; 1 _ PRJ _ Brut ; 1 _ SUN _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "thomas.haure@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eddy.armou@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Hexagonal _  ; 1 _ Padang _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "shaykho-03@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Nature _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "celine.pose@outlook.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ JAPAN AVEC TDN _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :en 160"
      }
    ]
  },
  "chaneyothu.margot@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Meuble TV JAMPI",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laila-h974@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Kuta 60 _ Cérusé Blanc ; 2 _ Mikha 90 cm _ Miel ;  _  _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vavelin.laurine@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ OLANDA PM _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jmorel.69640@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padoda 90 _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour le meuble ci dessous en finition brut, version plus grande, trois tiroirs si possible 120 de largeur. Ce serait top si vous avez une photo du rendu avec tiroirs 👍\nMerci 😊"
      }
    ]
  },
  "ah_maryline@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE STRUCTURE METAL _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dmipepin@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis à suspendre _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gourama.sebastien@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ EVO _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alisayaf5@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Eddy _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "label430@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Blokus _ Cérusé Blanc",
        "date": "29/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Padoda 90 _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mylene.soucramanien@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zig-zag 100 _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "motetchristophe@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alizeecauvin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Noir ; 6 _ Chaise Ruji _ Cérusé Noir ; 1 _ Table Scandivian _ Cérusé Noir ; 4 _ Tabouret Boro _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "julie-payet@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ DB 33 _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "beni97148@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ EVO _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sim.tr@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Block _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "tchloe974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nnancycorbi@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Kreypiak _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nancycorbi@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Miel ; 1 _ Table de nuit Kreypiak _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "duda-maryline@bbox.fr": {
    "consents": {
      "offre": false,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "j.huet@rt-iut.re": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Console Aubépine _ Cérusé Noir ; 1 _ CONSOLE STRUCTURE METAL _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "guillaume_caudron@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ DB 33 _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Seko _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "caroline@calamansi-designs.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jimbaran _ Cérusé Noir ; 1 _ Mikha 90 cm _ Cérusé Noir ; 1 _ Sherry à suspendre _ Cérusé Noir ; 1 _ Sherry sur pied 120 cm _ Cérusé Noir ; 1 _ TOLITOLI _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "murielhenry@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bain de Soleil _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gossent@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "beaudemoulinjosian@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Miel ; 1 _ SYDNEY _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laetitiapayet171212@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Hexagonal _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 2P Kreypiak _ Cérusé Blanc ; 1 _ Buffet Hexagonal _ Cérusé Blanc ; 1 _ UBUD _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elodie.custine0610@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Nagasaki _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Chaise Nagasaki _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "felyakian@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Rivièra _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "danyagaelle@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "8 _ FAUTEUIL HIRO _ Cérusé Blanc ; 1 _ Table Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "apoline.thermea@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "_  _ Miel ; 1 _ Modélisation d'une cuisine en teck _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "soanclarisse52@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Nagasaki _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sandrinesinama@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 3P _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ingridmourouvin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _  ; 1 _ DB 33 _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "abufera.roseline@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ FAUTEUIL HIRO _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bain de Soleil _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "evennoulaurence@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _  ; 1 _ Armoire Sherry _  ; 1 _ Armoire Isabelle Minimalis _  ; 1 _ Commode New _  ; 1 _ Padang _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jessica.coquelet@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "philippeschmisser@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Nature _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "filkris974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TOLITOLI PETIT _ Brut",
        "date": "22/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :tolitoli petit brut"
      },
      {
        "meuble": "1 _ Kuta 80 _ Brut ; 1 _ TOLITOLI PETIT _ Brut",
        "date": "22/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ ULUWATU _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "baret.vir@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ GAYA _ Brut ; 1 _ LIT SLATS 3 NEW _ Brut ; 1 _ TABLE BASSE MINIMALIS _ Brut ; 1 _ Table Carrée _ Brut ; 1 _ Table de nuit  Minimalis _ Brut ; 1 _ Table Minimalis _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ FAUTEUIL HIRO _  ; 1 _ GAYA _ Brut ; 1 _ LIT SLATS 3 NEW _ Brut ; 1 _ TABLE BASSE MINIMALIS _ Brut ; 1 _ Table Carrée _ Brut ; 1 _ Table de nuit  Minimalis _ Brut ; 1 _ Table Minimalis _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "liviagasiglia@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 100 _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rhisla.filo@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 100 _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "chantal.galliot@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kaimie.gardebien@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Padang _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "preinelaure@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Ubud _ Brut ; 1 _ UBUD _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "katia.dick@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Eddy _  ; 1 _ UBUD _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lauret.armelle@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Jaya _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "firmgiivanhoe@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Zigzag _ Miel ; 5 _ EVO _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gatsu80@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag 3 tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "helenesam.prof@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Brut _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\nPour un linéaire de 2m10 (en 1 ou 2 meubles à juxtaposer)"
      }
    ]
  },
  "patricia.havez @sfr.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Baliti _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "manon.ccs@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "budelerica@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Blanc ; 2 _ JAPAN AVEC TDN _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "noetaochy974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "delphine.riviere1991@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Padang _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emmanuelle-r@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Alkmaar _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emmanuel.francoise1@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ DB 33 _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gladysbdlp@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Sandi _  ; 1 _ Commode Sherry _  ; 1 _ CORDOBA _  ; 1 _ Table basse Baliti _  ; 1 _ UBUD _  ; 1 _ Padang _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "isaturpin108@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Table de nuit  Minimalis _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "christianetmarina@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Julia _  ; 1 _ Miroir Candi _ Brut ; 1 _ Table Aura _ Brut ; 1 _ Table Carrée _  ; 1 _ Table Nature _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "olivier.rubellin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Nabul _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour le bureau Nabul sur mesure faisant 1m de largeur x 55 cm de profondeur.\nPossible d'avoir des photos du modèle meruser blanc ?\nMerci d'avance"
      }
    ]
  },
  "sophie.samuel974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Miel ; 1 _ Cassandre à suspendre _ Miel ; 1 _ Chaise Nagasaki _ Miel ; 1 _ Commode Vintage _ Miel ; 1 _ Padoda 90 _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elodie.chabot@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SUEB GAYA A - 2 tiroirs _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "giselecalteau@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Stockholm (JAYA) _ Miel",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Penderie _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ingridstephanie.bertil@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Brut _ Brut ; 1 _ MANTIGGAN _ Brut ; 1 _ OLANDA GM _ Cérusé Blanc,Brut ; 1 _ SUEB GAYA A - 3 tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vanhove.adele@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _ Miel,Cérusé Blanc,Brut,Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lucien-marcel.laude97417@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "delphinedelorme974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Kuta 60 _ Cérusé Blanc ; 1 _ Slats 120 cm _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "denise.michel2000@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mlinsay3@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _  ; 1 _ Bibliothèque Seminyak _  ; 1 _ Buffet Blokus _  ; 1 _ Buffet Hexagonal _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis détaillé pour les meubles suivants+ le tarif de la livraison pour le secteur de la montagne, 15eme km.\n\nMaillot Linsay"
      }
    ]
  },
  "maisonvanille @laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Brut ; 2 _ Palu _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "faridahosenally@yahoo.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc\n\nLits dimension 140 par 190 cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anadia.issoufaly@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "10 _ Chaise Sandi _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jenmus974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Seville Kreypiak _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "swalihah.dulull@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "angelique.baillif@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Coffeuse Kauwage _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Coffeuse Kauwage _ Cérusé Blanc ; 1 _ Tabouret Boro _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "molly.rassaby@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Miroir Candi _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "brenda.turpin@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel,Cérusé Blanc,Brut",
        "date": "22/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel,Cérusé Blanc,Brut",
        "date": "22/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Zigzag _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Cassandre à suspendre _ Brut ; 1 _ Zigzag _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "claire.loree@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Nagasaki _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "annaelle.adolphe@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre avec vitre déco _ Cérusé Blanc ; 1 _ Miroir Maja _ Miel ; 1 _ SUN _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "christine625@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Cérusé blanc _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ac.phalaris@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TABLE BASSE MINIMALIS _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "prunetille@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ OLANDA GM _ Brut ; 1 _ Seville Kreypiak _ Miel ; 1 _ Slats 120 cm _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ana.sharmila@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kiaha25@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anais.tim@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 90, en 140 et en 160 svp"
      }
    ]
  },
  "gabivitry@yahoo.co.uk": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode 7 tiroirs _ Cérusé Blanc ; 1 _ Commode Damier _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sableon9070@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Nagasaki _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sasmaditin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Pinter _ Miel,Brut ; 1 _ Cassandre avec vitre déco _ Miel,Brut ; 2 _ Kuta 100 _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sandrinemartinfichora@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Pinter _ Miel",
        "date": "22/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Pinter _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "barmmja@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurencecordonin@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Bloc _  ; 1 _ Buffet Tewah 1P _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laetitia.gesbert@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Miel,Cérusé Blanc ; 1 _ Table basse Gigogne _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mvictoire1997@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bibliothèque 12 casiers _  ;  _  _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurelie.essentielle@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : (en 180cm)"
      }
    ]
  },
  "dimitri.tailamee@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Milano _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "manu.vincent@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Milano _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hoareaumaries@icloud.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ FAUTEUIL MARINA _ Cérusé Blanc ; 1 _ Table Aura _  ; 2 _ Fauteuil June _ Cérusé Blanc ; 1 _ Fauteuil Rossolin _ Cérusé Blanc",
        "date": "10/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Milano _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "abernard32@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Gigogne _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nicolas.incana@groupe-incana.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel ; 1 _ Bureau Informatique _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants ainsi qu\"un mirroir :"
      }
    ]
  },
  "lumilaadras@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laetitia.lg50@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne pour machine à laver _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nathalie.ognard@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Fauteuil Cozy Rattan _  ; 1 _ FAUTEUIL MARINA _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "morinegrondin8@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Nagasaki _ Miel,Cérusé Blanc,Brut,Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "murat.corine@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants et connaître la disponibilité"
      }
    ]
  },
  "george.lucie7@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lave-mains en teck _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gerardfran423@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sergemoellon@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Sherry _",
        "date": "08/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Colonne Evolia 2P _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "r_myrella@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Slats 140 cm _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Baya _ Cérusé Blanc ; 1 _ Slats 140 cm _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ccoutin@welcomevacances.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Julia _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "karinegrondin33@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eric_hamon@hotamil.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "bettyfk@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Fauteuil Elisabeth _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Fauteuil Cozy Rattan _ Cérusé Noir ; 1 _ Fauteuil Elisabeth _ Cérusé Noir ; 1 _ FAUTEUIL MARINA _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rubinregel@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "contact@isledebourbon.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Bureau Pinter _ Miel ; 6 _ CONSOLE MINIMALIS _ Miel ; 6 _ Fauteuil Cozy Rattan _ Miel ; 12 _ Fauteuil Elisabeth _ Miel ; 12 _ Table de nuit  Minimalis _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kobusinskisyl@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TABLE BASSE MINIMALIS _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mcedric3@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emelinemaelys2011@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag 3 tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Sherry à suspendre _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexdesideespleinlatete@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Block _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Armoire Block _ Cérusé Noir ; 1 _ Chaise Nagasaki _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "yannh@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse en suar _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vale_boyer@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Minimalis _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dampastureau@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "camille.carpin@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Seville Krepyak _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ulysse.419@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Cérusé Blanc ; 1 _ SUEB S _ Miel ; 1 _ Table basse laquée blanc _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jessica-riviere@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Nagasaki _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dianaetheve34@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ FAUTEUIL HIRO _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "julien.josephine@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Cérusé Blanc ; 1 _ Table basse minimalis à tiroirs _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "v.glandier974@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : Pouvez vous s il vous plaît m indiquer les dimensions ? Merci"
      }
    ]
  },
  "claudiagrava@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Telur _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clara.xavier@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Cérusé Blanc\n\n2 _ CORDOBA _ Cérusé Blanc ; \n\nIl me faudrait donc quatre devis : dimension souhaitée : 200 x 200 cm et 180 x 200 cm.",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sarah.randera@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Pinter _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nadinehaffidhou@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 80 _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurencemanoela@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jean.tell@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MIRIH _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 200 cm"
      }
    ]
  },
  "francoisepenent97@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry sur pied _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eve-sellier@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Miel ; 1 _ JULIANA Brut _ Brut ; 1 _ SUEB S _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis et les dimensions pour les meubles suivants :"
      }
    ]
  },
  "mariejuliegrondin33@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Blokus _  ; 1 _ Colonne Evolia 2P _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fredlucilly@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MEUBLE A CHAUSSURES KREPYAK _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stephanie.eclapier@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MEUBLE A CHAUSSURES KREPYAK _ Cérusé Noir ; 1 _ Table basse Gigogne _ Cérusé Noir ; 1 _ Table basse Gigogne en granite _  ; 1 _ Table de nuit Alkmaar _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jenni.grondin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Meuble à chaussures Jail _ Cérusé Noir ; 1 _ MEUBLE A CHAUSSURES KREPYAK _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "julieriviere12@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "autret.maiwenn@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Brut ; 1 _ Padang _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gambiers.samantha@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse pieds métal _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : quantité 6"
      }
    ]
  },
  "sophieannehubert974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ OLANDA PM _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "miniamavadivel.voisin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Pinter _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "constancedechomereau@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ DB 33 _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "legallc974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "josee.payet97490@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Julia _  ; 1 _ Chaise Rivièra _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "natmiva@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag 3 tiroirs _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "audreyli2009@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Seko _ Brut ; 1 _ CANGGU _ Cérusé Blanc ; 1 _ Palu _ Brut ; 1 _ Sherry à suspendre _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sarita7_87@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Cérusé Blanc,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "judithnelly97@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Rattan _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jessy.viranin@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "samantha.atache00@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Alkmaar _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit  Minimalis _ Cérusé Blanc ; 1 _ Table de nuit Alkmaar _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "annelyse.argence@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Evolia 2P _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Colonne Slats _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "khaoula92.13@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Julia _ Cérusé Blanc,Miel ; 1 _ Chaise Nagasaki _ Miel,Cérusé Blanc ; 1 _ Chaise Sandi _ Miel,Cérusé Blanc ; 1 _ Meuble à chaussures Jail _ Miel,Cérusé Blanc ; 1 _ MEUBLE A CHAUSSURES KREPYAK _ Miel,Cérusé Blanc ; 1 _ Table Aura _ Miel,Cérusé Blanc ; 1 _ UBUD _ Miel,Cérusé Blanc ; 1 _ Colonne Laura Krepyak _ Cérusé Blanc,Miel ; 1 _ Colonne Minimalis Damier _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elodiedelarichaudy2@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "grd.raphaelle@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ FAUTEUIL MARINA _ Cérusé Blanc ; 1 _ JULIANA Cérusé blanc _ Cérusé Blanc ; 1 _ Meuble à chaussures Jail _ Cérusé Blanc ; 1 _ Table basse Minimalis _ Cérusé Blanc ; 2 _ Table de nuit  Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "claudiephalaris@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ Commode Sherry _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anyssa.samy30@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse minimalis à tiroirs _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse Gigogne _ Cérusé Blanc ; 1 _ Table basse minimalis à tiroirs _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sabrina.taochy@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Nagasaki _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Ensemble Grace _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "idemercier974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Milano _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "annabelle.albany@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ LAWANG _  ;  _  _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurenceritner974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ketty97439@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis à suspendre _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "zoelleart@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Seko _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "apayag.sandrine@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Gattaga _  ; 2 _ Mikha 125 cm _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jerome.sevamy@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table extérieure pour 10 ou 12 personnes",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "valerie.brevier974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _ Cérusé Noir ; 6 _ Chaise Upin _ Cérusé Blanc ; 1 _ Table Minimalis _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "saminadin.jean@irange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Evolia 2P _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pmondon.974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rivieresomayya@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ OLANDA PM _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "epayet12@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _  ; 2 _ Colonne Evolia 2P _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pattivalerie5@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurelie-leroy1307@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "julieorboin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ OLANDA GM _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ingar_soraya@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "manuel.spartonrodriguez@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "guchpe@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "flo.victoire@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Brut ; 1 _ LIT SLATS 3 NEW _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "katiana.t@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lave-mains en teck _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Blanc ; 1 _ Lave-mains en teck _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "a.dijoux9@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne pour machine à laver _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mathildeessou4@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 1 PORTE _  ; 1 _ Table basse Minimalis _  ; 1 _ Table basse minimalis à tiroirs _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "didierchruscicka@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "erika.duchemann@societe-edg.re": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis à suspendre _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sinaretty.meena@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SUN _ Miel ; 1 _ TOLITOLI _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "audrey_tm@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis 100 cm _ Brut ; 1 _ Oblique _ Brut ; 1 _ Palu _ Brut ; 1 _ Zigzag 3 tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurelie.coupama@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _  ;  _  _  ; 1 _ Buffet Hexagonal _  ; 1 _ FAUTEUIL HIRO _  ; 1 _ Table de jardin extensible _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "tmaitenaz@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 80 _ Miel,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "geremy.delacroix@laposte.net": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : cassandre a suspendre 120cm"
      }
    ]
  },
  "priscillafontaine@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Kuta 80 cm ceruse blanc \nSherry sur pied 80 cm ceruse blanc\n\nJe vous remercie d'avance",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurentventurini@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "t.laurent97434@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Armoire Krepyak _  ; 1 _ Armoire Sherry _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Informatique _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "angelflo_n@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants.\nConcernant le lit je voudrais le devis pour celui mesurant 90x190.\nMerci d’avance"
      }
    ]
  },
  "carla.aubras@glail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : (taille 160*200)"
      }
    ]
  },
  "annesophie.liagre@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants ainsi que les dimensions :"
      }
    ]
  },
  "paulineparis43@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Sandi _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "6 _ Chaise Sandi _ Miel ; 6 _ FAUTEUIL HIRO _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "6 _ Chaise Sandi _ Miel ; 6 _ Chaise Upin _ Miel ; 6 _ FAUTEUIL HIRO _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "iris2bail@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _  ; 1 _ Chaise Nagasaki _  ; 1 _ Table Scandivian _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laetitia.varaine61@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Upin _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexandre-collet@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _ Brut ; 1 _ Table basse laquée blanc _ Brut ; 1 _ Table basse minimalis à tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "julie.huan974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Hexagonal _ Cérusé Blanc ; 2 _ GAYA _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "yasminelegros21@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ UBUD _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "arenesinanmoutou@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne pour machine à laver _ Cérusé Blanc ; 1 _ Colonne Evolia 2P _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clair78170@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lea.gerbaux@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TANGGA _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ DB 33 _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Console Aubépine _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "annelaure.juret@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "robin.frederique974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _ Brut,Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "severine.piout@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Nabul _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cazalanna@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : la table Aura"
      }
    ]
  },
  "marjolainevetter@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Miel ; 1 _ Lit EVOLIA _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : pour un matelas 180,X200 merci"
      }
    ]
  },
  "aurelia.aymard@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants et serait il possible d'avoir les mesures du meuble, merci beaucoup."
      }
    ]
  },
  "samaburter9@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "angel.morgane.archi@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Scandivian _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "s.grondin26@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Block _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sheanazemm@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Slats _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Colonne Slats _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Brut ;  _  _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Brut ; 1 _ Table basse minimalis à tiroirs _ Brut ;  _  _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ac.runagencement@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _  ; 1 _ Bureau Pinter _  ; 1 _ DB 33 _",
        "date": null,
        "message": "Bonjour, je travail actuellement sur un projet de bureaux à st pierre et je souhaiterai un devis pour les meubles suivants :"
      }
    ]
  },
  "fsiozard@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Miel ; 1 _ Table Minimalis _ Miel ; 1 _ TEXAS _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "suziep022@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Rasint _ Brut ; 1 _ Chaise Ruji _ Miel ; 1 _ Chaise Sandi _ Miel ; 1 _ FAUTEUIL HIRO _ Brut ; 1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clrobic@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bain de Soleil _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "patrick.poitou@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Armoire Krepyak _  ;  _  _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "j.pedase@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Gigogne _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ SYDNEY _ Cérusé Noir ; 1 _ Table basse Gigogne _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stevenbodiou@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 3P _ Brut ; 1 _ Table Aura _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sarah.panchebaya@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kettydafreville@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Pinter _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mati97418@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Hexagonal _ Cérusé Blanc ; 1 _ Chaise Dowel _ Cérusé Blanc ; 1 _ Table Nature _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\n\n1 table,\n6 chaises\n1 buffet"
      }
    ]
  },
  "beafredric@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _  ; 1 _ LAWANG _  ; 1 _ Jampi _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sylvie.lerouxchancegal@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MEUBLE A CHAUSSURES KREPYAK _",
        "date": null,
        "message": "Bonjour, je souhaite un devis avec dimensions pour les meubles suivants :"
      }
    ]
  },
  "vince_gandolas @ hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vince_gandolas@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Cérusé Blanc ; 1 _ UBUD _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en 140 de large. Merci bien !"
      }
    ]
  },
  "valtoch@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nadia.ghanty@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anthony.nugues@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bain de Soleil _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "roxane.derobillard@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gaeldefab@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode 7 tiroirs _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mariellederosi@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Meuble TV NATURE _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Commode Damier _ Brut ; 1 _ Meuble TV NATURE _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rosaliedavid97421@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Slats Rattan _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "guillaume.mathis@pm.me": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE STRUCTURE METAL _ Brut,Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "barretnadine951@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _  ; 1 _ Bibliothèque Lounge 4 portes _  ;  _  _  ; 1 _ Bureau Eddy _  ; 1 _ Bureau Informatique _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pascaltl@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Ubud _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "filflojujo@wanadoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Nature _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anneperego@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fabienbeauson@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Lit Japan (tdn) _ Cérusé Noir",
        "date": "19/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 1 lit 180 ou 200 x 200, les 3 autres en 160 x200.\nCordialement"
      },
      {
        "meuble": "4 _ Lit Japan (tdn) _ Cérusé Noir, 5 _ MEUBLE A CHAUSSURES KREPYAK _ Cérusé Noir",
        "date": "19/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : j'aimerai aussi connaître les dimensions.\nCordialement"
      },
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "delphine.ger@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel ; 1 _ Padang _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel ; 1 _ FAUTEUIL HIRO _ Miel ; 1 _ Padang _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "katiabonga@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Sofa K _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "florencehoarau@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ Commode Sherry _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "4 _ Commode Sherry _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "4 _ Commode Sherry _ Cérusé Blanc ; 2 _ Table de nuit Sherry _ Cérusé Blanc,Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "smnvct@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 60 _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "_  _ Cérusé Noir ; 1 _ Kuta 80 _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurentsevagamy@msn.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible ovale _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "carole.lauret@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Brut ; 1 _ Armoire Rosa _  ; 1 _ Bibliothèque 12 casiers _ Brut ; 1 _ FAUTEUIL HIRO _ Miel ; 1 _ Table de nuit  Minimalis _ Brut ; 1 _ Table de nuit Sherry _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cecile.vedelago@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ FAUTEUIL MARINA _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "florence.fabre763@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Lono _ Miel ; 1 _ GAYA _ Miel ; 1 _ OLANDA PM _ Cérusé Blanc ; 2 _ SUEB S _ Cérusé Blanc ; 1 _ Table Carrée _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "charlotte@ravaiau.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse laquée blanc _ Miel,Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kevin.labenne.03@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Lounge 4 portes _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pauline.fontaine974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "4 _ FAUTEUIL MARINA _ Brut ; 1 _ Table Aura _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pasmau4@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : avez-vous de  disponible en magasin."
      }
    ]
  },
  "deboisvilliersjulie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut ; 1 _ Jampi _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ln.vidal@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 140 de large"
      }
    ]
  },
  "noelda.sabat@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Chaise plan de travail",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : j’ai un exemple à  vous envoyer"
      }
    ]
  },
  "jo_benar@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _  ; 1 _ Buffet Evolia 4P Bloc _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gaelleassam@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel ; 1 _ LAWANG _  ; 1 _ MEUBLE TV SCANDINAVIAN _  ; 1 _ SUEB GAYA A - 3 tiroirs _  ; 1 _ SYDNEY _",
        "date": "03/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Padoda 90 _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lebon.nicolas.ln@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Brut ; 1 _ Buffet Tewah 2P _ Brut ; 1 _ Buffet Tewah 3P _ Brut ; 1 _ Meuble TV NATURE _ Brut ; 1 _ Table Aura _ Brut ; 1 _ Table Nature _ Brut ; 1 _ TANGGA _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emilie.dijoux@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Brut 90x190",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ramdhaneenalini@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "je.capron974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode 7 tiroirs _ Miel ; 1 _ Commode Damier _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emilie.tcs@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Damier _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lesliehoareau1@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Chaise Nagasaki _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "catherinedijoux@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode 7 tiroirs _ Cérusé Blanc ; 1 _ Commode Sherry _",
        "date": "07/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Commode 7 tiroirs _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marie.josee.gonthier@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padang _ Brut",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ JAPAN AVEC TDN _ Cérusé Blanc 1.40 x 1.90m ; 2 _ Table basse Gigogne _  ; 4 _ Table basse pieds métal _ Miel ; 2 _ TEXAS _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "j.paumier@laposte.net": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut",
        "date": "27/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "thomas--l@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurore.dabbadie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "grondinmarguerite@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Upin _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "martinetsg@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Armoire Rosa _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cadetnadia@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Damier _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gilerot.courtois@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :200*200 et en 160*200"
      }
    ]
  },
  "raissa.samy@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Gigogne _",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse Gigogne _",
        "date": "28/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ MEUBLE A CHAUSSURES KREPYAK _ Miel ; 4 _ SUEB GAYA A - 2 tiroirs _ Miel ; 2 _ Table basse Gigogne _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sandrine.lusinier@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cedric.moutou@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Miel ; 1 _ Colonne Evolia 2P _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\n\nEst-il possible de rajouter des étagères svp?"
      }
    ]
  },
  "nadiatecher974": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry à suspendre _ Cérusé Blanc ; 1 _ Colonne Laura Krepyak _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "frederiquedeboisvilliers@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ FAUTEUIL MARINA _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laetitiadijoux@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "isarobene@icloud.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 3P _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "danae.delonglee@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode New _ Cérusé Noir",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gege.virapin@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Miel ; 2 _ LIT SLATS 3 NEW _ Miel,Cérusé Blanc ;  _  _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jasmine.carron@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "camalon.ludmilla@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Laura Krepyak _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "baleinier.eloise@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elma.sebastien@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ PRJ _ Brut",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ TOLITOLI _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elisa.francommepinot@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gla10.mu@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry à suspendre _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "florenceburguiere974@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gally750@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Gattaga _ Brut ; 1 _ Mikha 125 cm _ Brut ; 1 _ PRJ _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Gattaga _ Brut ; 1 _ PRJ _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vanessa.celeste@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "minatchymarie@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lave-mains en teck _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "f-vaubourg@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag _  ;  _  _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "somarandybernard@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padoda 150 _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "coca.bulle@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Miel",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emanuel.vincent@sfr.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Milano _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hemavady.as@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Sculptée _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Commode Chevron _ Miel ; 1 _ Commode Sculptée _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sabinediorflar@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 3P _ Brut ; 1 _ Ensemble Riviéra _ Brut ; 1 _ JULIANA Brut _ Brut ; 1 _ Table basse Baliti _ Brut ; 1 _ Padang _ Brut ; 1 _ Padoda 150 _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pascal.foucard@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gigi_974@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Brut ; 1 _ CORDOBA _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "adrasisabelle2@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _  ; 2 _ Armoire Rosa _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alison.boursault@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Carrée _ Cérusé Blanc 90x90cm",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "majo974@live.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ EVO _",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "triciahokam@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ FAUTEUIL HIRO _ Brut",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sylvielamy.67@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc",
        "date": null,
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hoareau.mlaurence@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _  ; 1 _ LAWANG _ Miel ; 1 _ Table basse pieds métal _ Miel",
        "date": "14/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laikonv@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry sur pied _",
        "date": "14/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "payet.marie-vincente@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode New _ Cérusé Blanc ; 1 _ CORDOBA _ Cérusé Blanc ; 1 _ Table de nuit  Minimalis _",
        "date": "14/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nellecourtois@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Slats _ Brut",
        "date": "14/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "bertrand.lissonde@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _ Brut ; 1 _ CANGGU _ Brut ; 4 _ Chaise Jaya _ Brut ; 1 _ Chaise Nagasaki _ Miel ; 2 _ Chaise Stockholm (JAYA) _ Brut ; 1 _ Table Scandivian _ Brut",
        "date": "14/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\nLit en 160x200"
      }
    ]
  },
  "louloutigel@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SUEB S _ Brut",
        "date": "15/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "leperlier.gilles@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Bain de Soleil _ Brut",
        "date": "16/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants  et le délais de livraison svp"
      }
    ]
  },
  "savriamapriscilla49@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Damier _ Miel",
        "date": "16/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hilary.vpb@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ FAUTEUIL HIRO _ Brut",
        "date": "16/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "colette.dubhoarau@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel 160 m",
        "date": "17/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : \nPlus 2 chevets\nUne commande \nUn dressing de 2 m40"
      }
    ]
  },
  "morelbeatrice33@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SYDNEY _ Miel",
        "date": "18/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "grondin.anais02@icloud.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise haute jardin _",
        "date": "18/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants  et est ce la seul chaise que vous avez ?"
      }
    ]
  },
  "rogerlemery@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bain de Soleil _ Cérusé Blanc",
        "date": "19/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ip.24@icloud.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 2P _ Miel ; 4 _ Chaise Henry _ Miel ; 4 _ Table de nuit Jail _ Miel ; 1 _ Table Scandivian _ Cérusé Noir",
        "date": "19/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rambouille.francelise@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Brut",
        "date": "21/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "evaturpin@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Cérusé Blanc",
        "date": "21/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "avril_luc@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Cérusé Blanc",
        "date": "22/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurelie.amayem@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Bloc _ Cérusé Blanc,Brut",
        "date": "22/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 2P Bloc _ Cérusé Blanc,Brut ; 1 _ Bureau Informatique _",
        "date": "22/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rousseausandrine948@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel",
        "date": "25/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "audrey.laravine@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible _  ; 1 _ Table de jardin extensible ovale _  et chaises également",
        "date": "27/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sabrina.mahadzere@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Etagère Kolum _ Miel",
        "date": "27/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Pinter _ Miel",
        "date": "30/12/2024",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gilboire.f@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Nabul _ Brut",
        "date": "03/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hugues.payet974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ PRJ _ Cérusé Blanc",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mireille_klein@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Cérusé Blanc",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "boquet_stephanne@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Miel ; 1 _ Bibliothèque Lounge 4 portes _",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "s.cheron97@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ PRJ _ Miel",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "martinelin@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Fauteuil Cozy Rattan _ Brut ; 4 _ FAUTEUIL MARINA _ Brut ; 1 _ Table Aura _ Brut ; 1 _ Milano _ Brut",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexandra.versini@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Miel,Brut",
        "date": "25/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Jodya _  ; 1 _ Stickley _",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eblancardentre2@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oblique _ Miel",
        "date": "23/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Kuta 80 _ Miel ; 1 _ Oblique _ Miel ; 1 _ Sherry sur pied _ Miel",
        "date": "23/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Kuta 80 _",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Kuta 80 _ Miel ; 1 _ Oblique _ Miel",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marion.thesee@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Gattaga _",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "izabelle974.richard@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Minimalis Damier _ Miel",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "info@maisonsdamis.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Brut ; 1 _ Commode Petite Evolia _ Brut ; 1 _ Ensemble Grace _ Brut ; 1 _ FAUTEUIL HIRO _ Brut ; 1 _ Table basse Minimalis _ Brut ; 4 _ Table de nuit  Minimalis _ Brut",
        "date": "04/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants et serait il possible de detailler l'ensemble Grace ( fauteuil 1 place ou deux places ) merci"
      }
    ]
  },
  "hannagrondin@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Miel",
        "date": "05/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "malagasy20@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Nagasaki _ Miel ; 1 _ Mikha 90 cm _ Brut ;  _  _  ; 1 _ Sherry sur pied _ Cérusé Blanc,Brut",
        "date": "05/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "valerie.clary974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ PRJ _ Cérusé Blanc",
        "date": "06/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "riviere.pauline974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Seko _ Miel",
        "date": "06/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "claudine.dupuy@cr-reunion.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Jail _ Miel",
        "date": "06/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "audreeprisca@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Dowel _ Miel",
        "date": "06/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "saykellylauret@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lontan _ Cérusé Blanc ; 1 _ Oasis à suspendre _ Cérusé Blanc",
        "date": "06/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marieclaudethomas97420@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Oasis _ Cérusé Noir",
        "date": "21/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Miroir Candi _ Cérusé Noir ; 2 _ Oasis _ Cérusé Noir",
        "date": "21/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Miroir Candi _ Cérusé Noir ; 2 _ Oasis _ Cérusé Noir ; 2 _ Seville Krepyak _ Cérusé Noir",
        "date": "21/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ PRJ _ Cérusé Noir",
        "date": "06/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "francisetheve240783@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ UBUD _ Miel",
        "date": "07/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en 160 x 200"
      }
    ]
  },
  "michellefrancois62@yahoo.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse en suar _ Cérusé Blanc",
        "date": "08/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pablo.solano@sigemat.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _  ; 1 _ Armoire Sherry _ Brut ; 1 _ Armoire Isabelle Minimalis _ Brut ; 1 _ MEUBLE A CHAUSSURES KREPYAK _ Brut",
        "date": "08/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nathae974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ PRJ _ Cérusé Blanc",
        "date": "09/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emmanuelle.sartre@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Ubud _ Cérusé Blanc",
        "date": "09/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gladyslegros.gl@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _",
        "date": "10/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "morgane97410@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Sherry _ Miel,Cérusé Noir",
        "date": "13/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vina.techer@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Miel",
        "date": "05/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Mikha 90 cm _ Cérusé Blanc",
        "date": "13/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "annarivi@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Miel",
        "date": "13/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "damour.2909@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Blanc,Brut",
        "date": "25/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Shogun _ Cérusé Blanc,Cérusé Noir",
        "date": "14/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pacome.leon@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": "17/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse Gigogne _ Cérusé Noir",
        "date": "15/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurelievianie@icloud.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Réalisation d'une cuisine en teck _ Cérusé Blanc",
        "date": "17/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "olivia.simorel@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padoda 90 _ Miel",
        "date": "17/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "s.annelaure17@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Sculptée _ Miel",
        "date": "17/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gitebellevue.97419@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Laura Krepyak _ Miel",
        "date": "17/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "timbouyannis@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Baya _ Brut",
        "date": "18/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Baya _ Cérusé Blanc ; 1 _ Colonne Laura Krepyak _ Cérusé Blanc",
        "date": "18/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Baya _ Cérusé Blanc ; 1 _ JULIANA Cérusé blanc _ Cérusé Blanc ; 1 _ Cavàvin _ Cérusé Blanc ; 1 _ Colonne Laura Krepyak _ Cérusé Blanc",
        "date": "18/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sdinnewil@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel,Brut",
        "date": "18/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurariquier@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Blanc",
        "date": "18/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "buchle.elise@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis 100 cm _ Cérusé Noir ; 1 _ Padoda 90 _ Brut ; 1 _ Colonne Slats _ Brut,Cérusé Noir",
        "date": "18/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jasmine.endelin@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Brut",
        "date": "19/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mallaurie.turpinn@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc",
        "date": "20/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _  ; 1 _ Bibliothèque 12 casiers _  ; 1 _ Bibliothèque Seminyak _ Cérusé Blanc ; 1 _ CORDOBA _ Cérusé Blanc ; 2 _ FAUTEUIL HIRO _  ; 2 _ Table Aura _  ; 2 _ Table basse Telur _",
        "date": "20/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dieusolage": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Sandi _ Cérusé Blanc ; 1 _ CORDOBA _ Cérusé Blanc ; 1 _ Ensemble Riviéra _ Cérusé Blanc ; 1 _ Table Nature _ Cérusé Blanc",
        "date": "22/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "meliloo2017@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Baya _ Cérusé Noir",
        "date": "23/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fems.ef@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ GAYA _ Cérusé Blanc ; 1 _ MANTIGGAN _ Miel",
        "date": "23/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "arnaud.severin@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Baya _ Miel",
        "date": "23/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nadine.lemoigne@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel",
        "date": "24/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "amandine.boyer97435@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Zigzag cérusé blanc",
        "date": "24/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vanessa.ligdamis@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis 100 cm _ Miel ; 1 _ Slats Rattan _ Miel ; 1 _ SUN _ Miel",
        "date": "24/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anaïs.grondin@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc",
        "date": "25/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "auriane974.rimlinger@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Meuble TV NATURE _ Brut",
        "date": "25/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ SUEB GAYA A - 3 tiroirs _ Brut",
        "date": "25/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Chaise Jaya _ Brut ;  _  _ Brut ;  _  _ Brut ;  _  _ Brut",
        "date": "25/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "auriane974.rimlinger@gmail.col": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Brut ;  _  _ Brut ; 1 _ Jampi _ Brut",
        "date": "25/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emeric.narayanin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Oasis 100 cm _ Miel ; 2 _ SUEB GAYA A - 3 tiroirs _ Miel ; 1 _ SYDNEY _ Miel ; 2 _ Table basse minimalis à tiroirs _ Miel ; 2 _ Colonne Slats _ Miel",
        "date": "26/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "shazz.cie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Pinter _ Miel",
        "date": "26/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "patricelivia1@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TEXAS _ Brut",
        "date": "26/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexandrino.mathilde@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ DB 33 _ Cérusé Blanc",
        "date": "26/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Armoire Krepyak _ Cérusé Blanc ; 1 _ DB 33 _ Cérusé Blanc ; 1 _ Table Carrée _ Cérusé Blanc",
        "date": "26/01/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jean-michel.payet0181@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Brut",
        "date": "29/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 140x190"
      },
      {
        "meuble": "1 _ JULIANA Cérusé blanc _ Cérusé Blanc",
        "date": "13/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ JULIANA Brut _ Brut ; 1 _ JULIANA Cérusé blanc _ Cérusé Blanc",
        "date": "13/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ JULIANA Brut _ Brut ; 1 _ JULIANA Cérusé blanc _ Cérusé Blanc ; 1 _ SUEB S _ Brut",
        "date": "13/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ JULIANA Brut _ Brut ; 1 _ JULIANA Cérusé blanc _ Cérusé Blanc ; 1 _ MEUBLE TV SCANDINAVIAN _ Brut ; 1 _ SUEB S _ Brut",
        "date": "13/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Brut ; 1 _ JULIANA Brut _ Brut ; 1 _ JULIANA Cérusé blanc _ Cérusé Blanc ; 1 _ MEUBLE TV SCANDINAVIAN _ Brut ; 1 _ SUEB S _ Brut",
        "date": "13/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cbanholtzer@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": "13/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "veroandoche@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag _ Brut",
        "date": "13/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ac.berthelemy@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry sur pied _ Brut,Cérusé Noir",
        "date": "13/02/2025",
        "message": "Bonjour, je souhaite un devis pour le meubles suivants :\nNous le souhaitons en 1m de large, soit brut soit creusé noir\nMerci d'avance"
      }
    ]
  },
  "julienpages7@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Seville Krepyak _ Miel",
        "date": "14/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "magalidenis14@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Lounge 4 portes _ Cérusé Noir",
        "date": "14/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jeanmichelcabooter@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ FAUTEUIL HIRO _ Brut",
        "date": "14/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "manon.rohrmaier@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "9 _ Chaise Nagasaki _ Miel ; 3 _ Table Aura _ Miel",
        "date": "15/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "daniela9€4@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Damier _ Cérusé Blanc",
        "date": "16/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marysette19@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Carrée _ Miel",
        "date": "17/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "h_lylie@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc",
        "date": "19/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fa.collet974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "10 _ Armoire Krepyak _ Miel,Brut ;  _  _ Brut ;  _  _ Brut ; 22 _ Chaise Jaya _ Brut ; 22 _ Chaise Stockholm (JAYA) _ Brut ; 4 _ Coffeuse Kauwage _ Miel ; 4 _ Colonne pour machine à laver _ Brut,Miel ; 2 _ Console Aubépine _ Brut ; 2 _ CONSOLE STRUCTURE METAL _ Brut ; 22 _ FAUTEUIL MARINA _ Brut ; 2 _ Seville Krepyak _ Miel ; 4 _ Table basse Minimalis _ Miel,Brut ; 8 _ Table de nuit Krepyak _ Brut,Miel ; 2 _ Zigzag _ Brut ; 4 _ Jampi _ Brut,Miel ; 8 _ Colonne Laura Krepyak _ Brut,Miel",
        "date": "19/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sylvine.hoarau@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ CORDOBA _ Miel ; 1 _ UBUD _ Miel,Cérusé Blanc",
        "date": "21/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en 140x190."
      }
    ]
  },
  "anneclaire.sinaretty@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _ Miel ; 1 _ LIT SLATS 3 NEW _ Miel en 160x200",
        "date": "23/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Informatique _ Miel ; 1 _ Bureau Seko _ Miel ; 1 _ LIT SLATS 3 NEW _ Miel",
        "date": "23/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jimmypouniandy@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Cassandre à suspendre _ Miel,Cérusé Blanc,Brut,Cérusé Noir ;  _  _ Miel,Cérusé Blanc,Brut,Cérusé Noir ; 1 _ CORDOBA _ Miel,Cérusé Blanc,Brut,Cérusé Noir ; 2 _ DB 33 _ Miel,Cérusé Blanc,Brut,Cérusé Noir ; 2 _ Fauteuil Elisabeth _ Miel,Cérusé Blanc,Brut,Cérusé Noir ; 2 _ JAPAN AVEC TDN _ Miel,Cérusé Blanc,Brut,Cérusé Noir ; 2 _ Sherry sur pied _ Miel,Cérusé Blanc,Brut,Cérusé Noir ; 1 _ Table Carrée _ Miel,Cérusé Blanc,Brut,Cérusé Noir ; 2 _ Table de nuit Alkmaar _ Miel,Cérusé Blanc,Brut,Cérusé Noir ; 1 _ Table Carrée Slats _ Brut,Cérusé Blanc,Cérusé Noir,Miel",
        "date": "24/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pauline.mus@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Brut",
        "date": "28/02/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en taille 160"
      }
    ]
  },
  "eva.grondin26@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Cérusé Blanc",
        "date": "01/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "payet.didier@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Baya _ Cérusé Blanc",
        "date": "06/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ MIRIH _ Cérusé Blanc",
        "date": "06/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "naude.lu@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Brut",
        "date": "08/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "d.rietsch@free.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Brut ; 8 _ Chaise Nagasaki _ Brut ; 1 _ Ensemble Riviéra _ Brut ;  _  _  ; 2 _ LIT SLATS 3 NEW _ Brut (160x200) ; 1 _ Table de jardin extensible ovale _ Brut ; 4 _ Table de nuit Alkmaar _ Brut ; 1 _ Padang _ Brut",
        "date": "08/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants (ainsi que les disponibilités):"
      }
    ]
  },
  "thiancourtm@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _ Miel",
        "date": "09/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "karooirfan95@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Cérusé Noir",
        "date": "10/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eboyer453@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Grace _ Cérusé Noir",
        "date": "10/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jaffre.alexia@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Etagère Kolum _ Miel",
        "date": "11/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "botoelo@gmx.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise haute jardin _ Miel,Brut",
        "date": "13/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alain.vilrus@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible _",
        "date": "14/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mimi.zoreole@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Exposition de la cuisine en magasin  _ Miel",
        "date": "15/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "louis.plumety@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _",
        "date": "15/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marinasalombron@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _  ; 1 _ Armoire Isabelle Minimalis _  ; 1 _ Commode Chevron _ Miel,Cérusé Blanc ; 1 _ Commode Damier _ Miel ; 1 _ Commode Sherry _ Miel",
        "date": "17/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aureliehoungchuikien@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Minimalis _ Miel,Cérusé Blanc,Brut,Cérusé Noir",
        "date": "17/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexiacramps@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Sherry _  ; 1 _ Table de nuit Alkmaar _  ; 1 _ Colonne Slats _ Miel",
        "date": "17/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "yeung.guilian@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Gattaga _ Brut",
        "date": "18/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "k.mckay@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne pour machine à laver _ Miel",
        "date": "18/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stephaniegerard1@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Miel ; 1 _ Lit EVOLIA _ Miel",
        "date": "20/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "briquegeorges@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel",
        "date": "20/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jocelyne.ad@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 1 PORTE _ Brut",
        "date": "21/03/2025",
        "message": "Bonjour, je souhaite un devis pour le meuble suivant : à revoir pour la couleur"
      }
    ]
  },
  "lebon.pat@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Brut",
        "date": "22/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 180x200"
      },
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Brut",
        "date": "21/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Brut",
        "date": "21/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "livet.charlene973@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Étagères, buffet et ensemble de jardin",
        "date": "31/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Colonne Slats _ Miel",
        "date": "22/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "phgousset@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse en suar _ Miel",
        "date": "24/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse en suar _ Miel",
        "date": "24/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse en suar _",
        "date": "23/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "annicktsengking@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Hampton _ Cérusé Noir ; 1 _ Slats 120 cm _ Cérusé Noir ; 1 _ SUEB S _ Cérusé Noir ; 1 _ TANGGA _ Cérusé Noir",
        "date": "23/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Hampton _ Cérusé Noir ; 1 _ Slats 120 cm _ Cérusé Noir ; 1 _ SUEB S _ Cérusé Noir ; 1 _ TANGGA _ Cérusé Noir",
        "date": "23/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "asso.atscaf.scrap@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Pinter _ Miel,Cérusé Blanc ; 1 _ Padang _ Miel,Cérusé Blanc",
        "date": "23/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "moukineelodie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Colonne Evolia 2P _ Cérusé Blanc",
        "date": "24/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ch97427@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Evolia 2P _ Cérusé Blanc,Brut",
        "date": "24/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "audedepalmas@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Cérusé Blanc",
        "date": "26/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en dimension 160 x 200"
      },
      {
        "meuble": "1 _ Armoire Block _  ; 1 _ CANGGU _ Cérusé Blanc",
        "date": "26/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "manis974@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre avec vitre déco _  ; 1 _ Oasis _  ; 1 _ Slats 120 cm _ Miel",
        "date": "26/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laure.testart@peps.re": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Telur _ Miel",
        "date": "28/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :et aussi les dimensions svp !"
      }
    ]
  },
  "calliope020@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut,Cérusé Noir",
        "date": "29/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table Aura _ Brut,Cérusé Noir",
        "date": "29/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "agathe.nieto@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 60 _ Cérusé Blanc",
        "date": "29/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "proh2oreunion@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lontan _ Cérusé Blanc ; 1 _ PRJ _ Cérusé Blanc",
        "date": "29/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Lontan _ Cérusé Blanc ;  _  _  ; 1 _ PRJ _ Cérusé Blanc",
        "date": "29/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ellayajessica@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MANTIGGAN _ Miel",
        "date": "29/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ssonia1974@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Dowel _ Miel ; 1 _ Table Carrée _ Miel",
        "date": "30/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sophie_places@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Alkmaar _ Brut",
        "date": "30/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aude.hmd@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible ovale _ Brut",
        "date": "30/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de jardin extensible ovale _ Brut",
        "date": "30/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laila_gui974@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc,Brut",
        "date": "30/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "manonlrt@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Baya _ Brut",
        "date": "31/03/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gaelleassam@gail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel ; 1 _ LAWANG _  ; 1 _ MEUBLE TV SCANDINAVIAN _  ; 1 _ SUEB GAYA A - 3 tiroirs _  ; 1 _ SYDNEY _",
        "date": "03/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "leendagast@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _  ; 1 _ Meuble TV NATURE _  ; 1 _ Table basse Baliti _",
        "date": "05/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hurtevent.baptiste@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _  ; 1 _ Bureau Nabul _ Miel ; 1 _ Chaise Sandi _  ; 1 _ CONSOLE MINIMALIS _ Miel ; 2 _ FAUTEUIL MARINA _ Miel ; 1 _ Slats 140 cm _  ; 1 _ Table basse Telur _ Miel ; 1 _ Table de nuit Sherry _ Miel",
        "date": "08/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stessy.lucilly@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag _ Cérusé Blanc",
        "date": "08/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "michellewl_974@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel",
        "date": "09/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gigiclavie@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Seko _ Brut ; 1 _ Table basse Gigogne _ Brut ; 1 _ Table de nuit Madiun _ Brut",
        "date": "10/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "weinna@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Brut",
        "date": "10/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexis.montebrun@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel",
        "date": "11/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ncatherine76@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Console Aubépine _ Brut",
        "date": "11/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sylvine.arou.sa@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Alkmaar _ Cérusé Noir",
        "date": "11/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "patrickbrenot@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bain de Soleil _ Brut",
        "date": "12/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bain de Soleil _ Brut",
        "date": "12/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lioneldijoux413@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Brut",
        "date": "26/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elenagervain@yahoo.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TABLE BASSE MINIMALIS _",
        "date": "30/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse Baliti _ Miel,Brut ; 1 _ TABLE BASSE MINIMALIS _  ; 1 _ Zigzag 3 tiroirs _",
        "date": "30/04/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lebon_gladys@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc",
        "date": "01/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc ; 1 _ Table Minimalis _ Cérusé Blanc",
        "date": "01/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc ; 1 _ Buffet Evolia 3P Bloc _ Cérusé Blanc ; 1 _ Table Minimalis _ Cérusé Blanc",
        "date": "01/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lenon_gladys@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc ; 1 _ Buffet Evolia 3P Bloc _ Cérusé Blanc ; 1 _ Chaise Henry _ Cérusé Blanc ; 1 _ Table Minimalis _ Cérusé Blanc",
        "date": "01/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fredericcavalie@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Miel",
        "date": "02/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel ; 1 _ LAWANG _ Miel",
        "date": "02/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "arocamagali@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padi _ Brut",
        "date": "03/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurore.salles@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Hexagonal _ Cérusé Blanc",
        "date": "04/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marinoudupont@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Slats 120 cm _ Miel ; 1 _ Colonne Laura Krepyak _ Miel",
        "date": "05/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants  merci"
      }
    ]
  },
  "sylber.b@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Lounge 4 portes _ Brut ; 1 _ Buffet Evolia 4P Bloc _ Brut ; 1 _ Table Aura _ Brut ; 1 _ Table basse Baliti _ Brut",
        "date": "06/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nancymoimbe.96@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Gigogne _ Cérusé Noir",
        "date": "03/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Cassandre à suspendre _ Miel",
        "date": "07/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "veronique369@protonmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Brut",
        "date": "07/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "m.hoareau@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Brut",
        "date": "08/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dompy-steph@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ CORDOBA _ Cérusé Blanc",
        "date": "29/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : taille 140cm"
      },
      {
        "meuble": "1 _ Padoda 90 _ Miel,Cérusé Blanc",
        "date": "09/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "patrice.boulevart@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lave-mains en teck _ Brut ; 1 _ Zig-zag 100 _ Brut",
        "date": "14/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Echelle pour salle de bains _ Brut ; 1 _ Lave-mains en teck _ Brut ; 1 _ TOLITOLI PETIT _ Brut",
        "date": "12/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sandrinesavigny6@yahoo.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cuisine",
        "date": "14/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ornela.desplas@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Réalisation d'une cuisine en teck _ Cérusé Blanc",
        "date": "14/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "edwige.hoarau@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Neya _ Cérusé Noir",
        "date": "16/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marielindapyt@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ FAUTEUIL MARINA _ Cérusé Blanc",
        "date": "17/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "b.fock.chock.kam@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Cérusé Blanc,Brut",
        "date": "19/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 160/200 svp"
      }
    ]
  },
  "emilie.richard.974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Miel ; 1 _ Sherry sur pied _ Miel ; 1 _ TOLITOLI PETIT _ Miel",
        "date": "19/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jc.run@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry sur pied _ Miel,Cérusé Blanc",
        "date": "19/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 80cm et 1m  svp!"
      }
    ]
  },
  "martinfrancoise460@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Réalisation d'une cuisine en teck _",
        "date": "20/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ganofskianaiscecile@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Cérusé Noir",
        "date": "20/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sebire.nathalie@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Cérusé Blanc",
        "date": "22/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "philippe.ramin.mangata@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Cérusé Blanc",
        "date": "23/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "coeurde.lion@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ FAUTEUIL HIRO _ Miel",
        "date": "24/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "imbert73@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Grace _ Miel",
        "date": "26/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "charles.laude974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut",
        "date": "29/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nicoledoro915@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Miel",
        "date": "29/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fred.guichard.fg@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Miel",
        "date": "29/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "caroline.da974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Goa _ Miel",
        "date": "29/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "julie.celerine@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Brut",
        "date": "30/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "s.legarnisson@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Goa _ Cérusé Blanc",
        "date": "30/05/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "guezellotquentin1@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Gattaga _ Cérusé Noir",
        "date": "04/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clemrondet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Brut",
        "date": "04/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nikkitacorre31@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Miel",
        "date": "05/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Cassandre à suspendre _ Miel ; 1 _ Mahira _ Miel,Cérusé Blanc,Brut",
        "date": "05/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emilie.ethevem@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _ Cérusé Blanc",
        "date": "05/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nadege.berby0620@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Noir ; 1 _ TOLITOLI PETIT _ Miel, et 1 _ TOLITOLI PETIT Cérusé Noir",
        "date": "05/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "david.chane974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Sherry _ Brut",
        "date": "07/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eric.dijoux@laposte.net": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Cérusé Noir ; 1 _ Commode Vintage _ Cérusé Noir ; 1 _ SUEB GAYA A - 2 tiroirs _ Brut ; 1 _ TABLE BASSE MINIMALIS _ Brut",
        "date": "07/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "domalbert97400@hotmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Eddy _",
        "date": "10/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "akasuna_974@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Brut",
        "date": "10/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Miroir Candi _",
        "date": "10/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "feing-cindy@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Miel",
        "date": "10/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Tewah 3P _ Miel ; 1 _ JAPAN AVEC TDN _ Miel ; 1 _ LAWANG _ Miel",
        "date": "10/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants. Pour les dimensions du lit, ce serait pour un lit de 180cm de large sinon de 160 cm svp."
      }
    ]
  },
  "tahir.noormahomed@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Miel,Cérusé Blanc",
        "date": "14/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurekamus@aol.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel",
        "date": "19/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alice.hoarau429@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Lit slats 3 Brut 160x200cm",
        "date": "21/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "d_baillif@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Mountain _ Cérusé Blanc",
        "date": "23/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en 200"
      },
      {
        "meuble": "1 _ Table Minimalis _ Cérusé Blanc ; 1 _ Table Mountain _ Cérusé Blanc",
        "date": "23/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "joc.san@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Cérusé Blanc",
        "date": "25/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marsoepantoine@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jodya _ Brut",
        "date": "25/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "magalie.robert777@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse pieds métal _ Cérusé Noir",
        "date": "25/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alice.vincenot974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ DB 33 _ Brut",
        "date": "22/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Informatique _  ; 1 _ DB 33 _ Brut",
        "date": "22/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Table de nuit  Minimalis _ Cérusé Blanc ; 2 _ Table de nuit Lara _ Cérusé Blanc",
        "date": "05/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants (ou tout autre modele en cerusé blanc en 2 exemplaires et en stock)"
      },
      {
        "meuble": "1 _ Armoire Sherry _  ; 2 _ Table de nuit  Minimalis _ Cérusé Blanc ; 2 _ Table de nuit Lara _ Cérusé Blanc",
        "date": "05/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Colonne Laura Krepyak _ Brut",
        "date": "28/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Zigzag _ Cérusé Blanc",
        "date": "26/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel ; 1 _ Zigzag _ Cérusé Blanc",
        "date": "26/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\nEn 200 par 200 pour le lit"
      },
      {
        "meuble": "1 _ Bain de Soleil _  ; 1 _ JAPAN AVEC TDN _ Miel ; 1 _ Zigzag _ Cérusé Blanc",
        "date": "26/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "vincent.rebecca00@yahoo.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Brut",
        "date": "26/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "florencegerville@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Seville Krepyak _ Miel",
        "date": "26/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "miloup974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Cérusé Blanc",
        "date": "26/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "bernardfumonde@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lave-mains en teck _ Miel",
        "date": "26/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fannyjade974@yahoo.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag _ Miel,Cérusé Blanc,Cérusé Noir",
        "date": "27/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "p.pierre.alex@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Alkmaar _ Miel",
        "date": "28/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kkortex38@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _",
        "date": "28/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "riviere.lucie@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Brut ; 1 _ Buffet Blokus _ Brut ; 1 _ Buffet Evolia 3P Bloc _ Brut",
        "date": "29/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "41 ch des liserons 97417 la mùontagne": {
    "consents": {
      "offre": false,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TOLITOLI PETIT _ Miel ; 1 _ Mahira _ Miel",
        "date": "29/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "catussiasteph@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc",
        "date": "30/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fabienne.kohn@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Meuble à chaussures Jail _",
        "date": "30/06/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "isa.chamira@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 80 _ Cérusé Blanc",
        "date": "01/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nagou.coralie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Madiun _ Miel ; 1 _ Colonne Slats _ Miel",
        "date": "02/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "juliettefavier@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TOLITOLI PETIT _ Miel",
        "date": "05/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "n.agenor@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Dressing sur mesure _ Brut",
        "date": "05/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mau.justine@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Cérusé Noir ; 1 _ Buffet Evolia 4P Bloc _ Cérusé Noir",
        "date": "06/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gregoirepayet0@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TANGGA _ Miel,Cérusé Blanc",
        "date": "07/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "camillegavaudan17@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Miel",
        "date": "08/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "k.rambol@ouyloo.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Miel",
        "date": "08/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "irina.sautron433@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _",
        "date": "08/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hoarau.andre@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Sherry _ Brut",
        "date": "10/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "narayanin.sephora@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TABLE BASSE MINIMALIS _ Miel",
        "date": "10/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "paleyacarole@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc ; 1 _ Réalisation d'une cuisine en teck _ Brut",
        "date": "10/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "macolombe1808@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Réalisation d'une cuisine en teck _ Miel",
        "date": "10/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "begue.ys@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Sherry _ Miel",
        "date": "11/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "romain.malet29@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc",
        "date": "13/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "soleyenj@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag _ Cérusé Blanc",
        "date": "27/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table Carrée Slats _ Brut",
        "date": "16/07/2025",
        "message": "Bonjour, je souhaite un devis pour une table carrée de 1,10 m sur 0,71 m de haut\nCordialement\nJ Soleyen"
      }
    ]
  },
  "bleu-marine-run@wanadoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Grace _ Miel",
        "date": "17/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nelly.verdier123@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Miel ; 1 _ Buffet Evolia 4P Bloc _ Miel ; 1 _ Lit EVOLIA _",
        "date": "18/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lomipdn@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Cérusé Blanc",
        "date": "18/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel",
        "date": "18/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sindy.moutoussamy@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode New _ Miel ; 1 _ Commode Sculptée _ Miel",
        "date": "20/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hoarau.aissa.974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SUEB S _ Miel",
        "date": "20/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "guyard.stephane97460@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zig-zag 100 _ Miel",
        "date": "20/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dorothee.racine@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible ovale _ Brut",
        "date": "21/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : table ovale extensible de la plus petite largeur (moins d’1m)"
      }
    ]
  },
  "felix.regine@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Eddy _ Miel",
        "date": "22/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sandragigan@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Brut",
        "date": "22/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "michelem974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Brut",
        "date": "22/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 160x200 et 140x190 merci"
      }
    ]
  },
  "steph.pitchen974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Brut",
        "date": "23/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "auberjohanne@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SUEB GAYA A - 2 tiroirs _ Brut",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ SUEB GAYA A - 2 tiroirs _ Miel ; 1 _ SYDNEY _",
        "date": "23/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mathieu2702@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel",
        "date": "24/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 180/200"
      },
      {
        "meuble": "1 _ Lit EVOLIA _ Miel ; 1 _ TABLE BASSE MINIMALIS _ Miel,Cérusé Noir",
        "date": "24/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Lit EVOLIA _ Miel ; 1 _ TABLE BASSE MINIMALIS _ Miel,Cérusé Noir ; 1 _ Bureau Samania _ Miel,Cérusé Noir",
        "date": "24/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "florencegonth974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel",
        "date": "26/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "6 _ Chaise Damier _ Miel",
        "date": "26/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table Nature _ Miel",
        "date": "26/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "monique.kichenin@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode New _ Cérusé Blanc",
        "date": "26/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "padre.eliane@ucloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Miel",
        "date": "27/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dedekodokan@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MIRIH _ Miel",
        "date": "27/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 200 cm"
      }
    ]
  },
  "nadjma.onian@wanadoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SYDNEY _ Miel",
        "date": "03/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ JULIANA Miel _ Miel ; 1 _ SYDNEY _ Miel",
        "date": "27/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "manumoun974@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Goa _ Cérusé Noir",
        "date": "27/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ ULUWATU _ Cérusé Blanc ; 1 _ Goa _ Cérusé Noir",
        "date": "27/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lizapothin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ DB 33 _ Cérusé Blanc",
        "date": "28/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\nDimension mini 1,60 ou 1,80 de longueur"
      }
    ]
  },
  "chloe.futol@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Fauteuil June _ Cérusé Blanc",
        "date": "28/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cyrielle.carron@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Brut ; 1 _ Buffet Tewah 3P _ Brut ; 1 _ Console 3 tiroirs et pieds en métal _ Brut ; 1 _ Mahira _ Cérusé Noir",
        "date": "28/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jere.orec@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Eddy _ Miel",
        "date": "28/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Miel ;  _  _ Miel ; 1 _ Table basse Minimalis _ Miel ; 1 _ Table de nuit Madiun _ Brut ; 1 _ Colonne Laura Krepyak _ Brut ; 1 _ Table de nuit Lara _ Cérusé Blanc",
        "date": "28/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit  Minimalis _ Miel,Cérusé Blanc,Brut",
        "date": "28/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "julie.desire@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _ Miel",
        "date": "29/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "2 _ Mikha 90 cm _ Miel ; 1 _ ULUWATU _ Miel",
        "date": "29/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "serymanuella@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Nagasaki _ Brut",
        "date": "31/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "georges.vinga@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Krepyak à portes coulissantes _ Miel",
        "date": "31/07/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alexialetang@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Blanc",
        "date": "01/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maelys2010@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Cérusé Noir",
        "date": "02/08/2025",
        "message": "Bonjour, je souhaite un devis et les dimensions pour les meubles suivants :"
      }
    ]
  },
  "lyladijoux.cuvelier@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut,Cérusé Blanc,Cérusé Noir ; 1 _ Cassandre à suspendre _ Brut,Cérusé Blanc,Cérusé Noir ; 1 _ Chaise Sandi _ Cérusé Blanc,Brut,Cérusé Noir ; 1 _ Table Minimalis _ Cérusé Blanc,Brut,Cérusé Noir",
        "date": "02/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "teddy_vir@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre sur pied _ Miel",
        "date": "02/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "melarouti@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Miel",
        "date": "13/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Pinter _",
        "date": "02/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Miel",
        "date": "02/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "r.deffay@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Vintage _ Brut ; 1 _ Console Séga _ Brut",
        "date": "03/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "juliacasimirmj@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padi _ Brut",
        "date": "03/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lilianeadrien@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Cérusé Blanc ; 1 _ Buffet Hexagonal _ Cérusé Blanc",
        "date": "03/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alaisewally3@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padi _ Miel",
        "date": "04/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cat.simoun@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Krepyak à portes coulissantes _ Miel",
        "date": "05/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elodie.carmona@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc",
        "date": "05/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alinetribollet@yahoo.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _ Brut",
        "date": "05/08/2025",
        "message": "Bonjour, je souhaite un devis pour les bureaux en bois massif avec une longueur L max : 140 cm. Quel bureau est le moins cher SVP dans votre catalogue selon ces criteres (cela peut être un autre bureau que le bureau Informatique)? Merci."
      }
    ]
  },
  "izar97400@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Mountain _ Brut",
        "date": "06/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "smflayosc@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre sur pied _  ; 1 _ Oasis 100 cm _  ; 1 _ Mahira _",
        "date": "06/08/2025",
        "message": "Bonjour, je recherche un meuble de sdb longueur max 100cm.\nPouvez vous svp me donner vos tarifs pour les meubles sélectionnés ?\nMerci d avance \nCordialement"
      }
    ]
  },
  "damourpatrice2@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Miel,Brut",
        "date": "07/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants"
      }
    ]
  },
  "amoutien@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Jail _ Cérusé Noir",
        "date": "07/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit Jail _ Cérusé Noir,Miel ; 1 _ Table de nuit Krepyak _ Miel ; 1 _ Table de nuit Madiun _ Miel",
        "date": "07/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lucvanhuffel@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Brut ; 1 _ JAPAN AVEC TDN _ Brut ; 1 _ Lit EVOLIA _ Miel,Brut",
        "date": "07/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 160 x 200\nSur les photos, c'est miel?\nQuel bois est-ce?\n\nMerci d'avance"
      }
    ]
  },
  "sefou974f@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _ Cérusé Noir",
        "date": "07/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "faustinebegue@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut",
        "date": "08/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "payet.nasthasia@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Cérusé Blanc ; 1 _ Commode Sherry _ Cérusé Blanc ; 1 _ Dressing sur mesure _ Cérusé Blanc",
        "date": "08/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "laurennemalet12@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _",
        "date": "08/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marielucaspayet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Gigogne _",
        "date": "11/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dgardenat@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Dressing sur mesure _ Miel",
        "date": "11/08/2025",
        "message": "Bonjour, je souhaite un devis pour le dressing dimension: hauteur: 2,56 cm largeur: 60 cm et longueur 1,97 cm.\n\nMerci"
      }
    ]
  },
  "oliviatanjama@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel",
        "date": "11/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fred97450@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre sur pied _ Miel,Cérusé Blanc ; 1 _ Slats 120 cm _",
        "date": "12/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "courteheuse.fabrice@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _",
        "date": "12/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rahimambaliagaya02@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Jaya _",
        "date": "13/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "abarse@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Nagasaki _ Cérusé Blanc",
        "date": "13/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "6 _ FAUTEUIL HIRO _ Cérusé Blanc",
        "date": "13/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mbsofils@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _  ; 1 _ TOLITOLI PETIT _ Brut,Cérusé Noir",
        "date": "13/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Zigzag 3 tiroirs _ Brut,Cérusé Noir ;  _  _  ; 1 _ TOLITOLI PETIT _ Brut,Cérusé Noir",
        "date": "13/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mehdia.mba@yahoo.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _",
        "date": "14/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "broussaudclemence@icloud.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ FAUTEUIL HIRO _ Cérusé Noir ; 1 _ Table Aura _ Cérusé Noir",
        "date": "14/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "4 _ FAUTEUIL HIRO _ Cérusé Noir ; 1 _ Table Minimalis _ Cérusé Noir",
        "date": "14/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sa.sourayaali@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Miel ; 1 _ Chaise Neya _ Miel",
        "date": "14/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elisa.chanfook@francetv.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Bloc _ Brut ; 1 _ Colonne Evolia 2P _ Brut",
        "date": "14/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anne.emmanuel.974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "10 _ FAUTEUIL HIRO _ Cérusé Noir ; 1 _ Table basse Minimalis _ Cérusé Noir ; 1 _ Table de nuit  Minimalis _ Cérusé Noir ; 1 _ Table Minimalis _ Cérusé Noir",
        "date": "14/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jade.maleck@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _  ; 1 _ Table de nuit Madiun _ Cérusé Blanc,Brut ; 2 _ Table de nuit Sherry _ Cérusé Blanc,Brut",
        "date": "16/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Commode Vintage _ Cérusé Blanc,Brut",
        "date": "16/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ceciletriviere@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _  ; 1 _ Commode 7 tiroirs _ Cérusé Blanc ; 1 _ UBUD _ Cérusé Blanc 160/200",
        "date": "16/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marionlossypro@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Bunga _ Miel",
        "date": "16/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : \nEst il possible qu’il fasse 100cm au lieu de 110cm ?"
      }
    ]
  },
  "monica.folio.moz@gmaio.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Cérusé Blanc",
        "date": "17/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "carocarolmarie@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode 7 tiroirs _ Miel",
        "date": "17/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "harry.payet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc",
        "date": "17/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "harry.pauet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc ; 1 _ Ensemble Grace _ Cérusé Blanc",
        "date": "17/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "melissa.nortal@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Brut ; 1 _ Jampi _ Cérusé Noir",
        "date": "18/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ib.amina1@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Cérusé Blanc ; 1 _ Armoire Isabelle Minimalis _ Cérusé Blanc",
        "date": "18/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "serinemilie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Krepyak à portes coulissantes _ Cérusé Blanc ; 1 _ Oasis à suspendre _ Cérusé Blanc",
        "date": "20/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "catherinelise24@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Miel",
        "date": "21/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eurltesa@ gmail .com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SUEB S _ Miel",
        "date": "21/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "contact.mdda@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Cérusé blanc _ Cérusé Blanc ; 1 _ OLANDA GM _ Cérusé Blanc",
        "date": "22/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\n\nMerci de me contacter par mail. Je vous remercie"
      }
    ]
  },
  "serge.parbatia@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Brut",
        "date": "23/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marielllelebon6@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padi _ Cérusé Blanc",
        "date": "23/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "melodieperot@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 125 cm _ Cérusé Blanc",
        "date": "23/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sylvie.lelong974@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Bloc _ Cérusé Blanc ; 1 _ Chaise Lono _ Cérusé Blanc ; 1 _ Table basse minimalis à tiroirs _ Cérusé Blanc ; 1 _ Table Mountain _ Cérusé Blanc ; 2 _ Mahira _ Cérusé Blanc",
        "date": "23/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mathy97437@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _",
        "date": "25/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc ; 1 _ JAPAN AVEC TDN _ Cérusé Blanc",
        "date": "25/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc ; 1 _ JAPAN AVEC TDN _ Cérusé Blanc ; 1 _ UBUD _ Cérusé Blanc",
        "date": "25/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc ; 1 _ JAPAN AVEC TDN _ Cérusé Blanc ; 1 _ OLANDA GM _ Cérusé Blanc ; 1 _ UBUD _ Cérusé Blanc",
        "date": "25/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jujum-974@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Penderie _",
        "date": "25/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau Penderie _  ; 1 _ Bureau Pinter _ Cérusé Noir",
        "date": "25/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dominique.balbine@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Brut",
        "date": "26/08/2025",
        "message": "Bonjour, je souhaite un devis pour le meuble suivants : en 150 cm"
      }
    ]
  },
  "loicgonthier02@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Meuble lave main creusé blanc.",
        "date": "29/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Zig-zag 100 _",
        "date": "26/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "r.souton@laposte.net": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mikha 90 cm _ Miel",
        "date": "27/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jean.yves-e@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Buffet Evolia 4P Bloc _ Cérusé Blanc",
        "date": "28/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mlle.wulisha@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Miel,Brut",
        "date": "29/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "bacar.alibacar@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Rosa _ Brut",
        "date": "29/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jonathandequelson@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Miel",
        "date": "29/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fca.corre@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Lara _ Miel",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "karine76.jollet85@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel ; 1 _ Nusa _ Miel",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "audrey.peria@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lave-mains en teck _ Brut",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lebonamelie8@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ FAUTEUIL MARINA _ Miel, 3 FAUTEUIL MARINA_Cérusé Noir",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "st.blancard.sofie@gmx.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ FAUTEUIL HIRO _ Miel",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Chaise Julia _  ; 1 _ FAUTEUIL HIRO _ Miel",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Chaise Julia _  ; 4 _ Chaise Nagasaki _ Miel ; 1 _ FAUTEUIL HIRO _ Miel",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lydiatecher974@hotmail.fe": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Cérusé Blanc",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\nLit canggu \nDimensions 90X190 cm"
      }
    ]
  },
  "vaniaduchemann@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Brut _ Miel",
        "date": "30/08/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "yannick.tergemina@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Nusa _ Cérusé Blanc",
        "date": "01/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "frederiquelafontainefrederique@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _ Miel",
        "date": "01/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "olivierpicart24@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Miel,Brut",
        "date": "01/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "isabelle.couapel@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc",
        "date": "01/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "beonel.beonel@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _",
        "date": "01/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ambrebaruchet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ Table basse minimalis à tiroirs _ Brut",
        "date": "01/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lek.rmy450@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Brut _ Brut",
        "date": "02/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "claisne@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Brut en 120",
        "date": "02/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "974jeff@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TANGGA _",
        "date": "02/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hoareau.yasmina@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Noir ; 1 _ Table Luma _ Cérusé Noir",
        "date": "02/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maj97438@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis Zigzag _ Cérusé Noir",
        "date": "02/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "issopmaissara@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Neya _ Cérusé Noir",
        "date": "03/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "poli.lucie95@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Cérusé Blanc",
        "date": "03/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cedric.brasier@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Brut",
        "date": "03/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "donnot-philippe@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _",
        "date": "06/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pbouilhol3964@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Cérusé Noir",
        "date": "06/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aureliadagos@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Mountain _ Brut",
        "date": "06/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "carolinecartaye@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre sur pied _",
        "date": "06/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "debs_21duncan@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Chevron _ Miel,Brut",
        "date": "07/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clotilde.boutrolle@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Sofa K _",
        "date": "07/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "isabellegevia@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _",
        "date": "07/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mesnard.charles@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Brut",
        "date": "08/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "paulinebarbe@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Sandi _",
        "date": "08/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "suzie_fo@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Meuble TV NATURE _ Miel ; 1 _ Table de nuit Jail _ Miel",
        "date": "08/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sautron.larissa@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "8 _ Fauteuil June _ Cérusé Blanc",
        "date": "09/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Chaise Nagasaki _  ; 8 _ Fauteuil June _ Cérusé Blanc",
        "date": "09/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pinette.clain@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Miel",
        "date": "11/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Cassandre à suspendre _ Miel",
        "date": "09/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jeanlucdougoud@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode New _ Cérusé Blanc",
        "date": "09/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "annaelle.deveaux@yahoo.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _",
        "date": "09/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "annaelle.deveaux@ yahoo.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _  ; 2 _ LAWANG _ Miel",
        "date": "09/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "brouette974@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": "10/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "petp.paysage@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc ; 1 _ Jampi _ Cérusé Blanc ; 6 _ Chaise de bar Yeni _ Cérusé Blanc",
        "date": "10/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "grimonprezcedric@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Krepyak _",
        "date": "11/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ysouprayen8@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Alkmaar _ Miel",
        "date": "11/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "salorly@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Cérusé Blanc 140x 190",
        "date": "11/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maridopascal@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Cérusé Blanc",
        "date": "12/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anne_leclerc@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ MANTIGGAN _ Miel",
        "date": "13/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "perrot.michelle@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "dewi",
        "date": "13/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "daniellemartin.dm11@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "5 _ FAUTEUIL MARINA _ Brut",
        "date": "13/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "martine.crescence974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Scandivian _ Miel ; 1 _ Zigzag 3 tiroirs _ Miel ; 1 _ Colonne Evolia 2P _ Miel ; 1 _ TOLITOLI PETIT _ Miel ; 1 _ Table Mountain _ Miel ; 4 _ Fauteuil June _ Miel",
        "date": "14/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mariesabrinapayet@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "3 _ Chaise de bar Yeni _ Miel",
        "date": "14/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lucindamdoihoma789@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Brut _ Brut ; 1 _ LAWANG _ Brut",
        "date": "14/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "couderclaire@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Brut",
        "date": "14/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "e.cml220697@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Marbella _ Cérusé Noir",
        "date": "15/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table Marbella _ Brut",
        "date": "15/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Fauteuil June _ Brut",
        "date": "15/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Fauteuil June _ Cérusé Noir",
        "date": "15/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ahtchinemuriel@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padi _ Cérusé Noir ; 1 _ Oasis Zigzag _ Cérusé Noir",
        "date": "15/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mlle.lea.lebon@ercane.re": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Upin _ Miel",
        "date": "17/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "michellaval974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Block _ Miel ; 1 _ Armoire Rosa _ Miel ; 1 _ Armoire Sherry _ Miel ; 1 _ Armoire Isabelle Minimalis _ Miel",
        "date": "18/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "morgane_f@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Miel",
        "date": "20/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "agansmandel@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Informatique _ Miel",
        "date": "20/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "morganpouly@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Eddy _ Miel",
        "date": "20/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marine.sambassouredy@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _  ; 1 _ UBUD _ Cérusé Blanc",
        "date": "20/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en 160 svp. Séparément. Merci beaucoup!"
      },
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc ; 1 _ Table Carrée Slats _ Cérusé Blanc,Brut",
        "date": "20/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants en 120 (table) et 160 (lit)"
      }
    ]
  },
  "elody.robert7@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse en suar _ Cérusé Noir",
        "date": "23/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lpardieu@air-austral.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Minimalis _ Brut",
        "date": "24/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "colette.komidi@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Miel",
        "date": "26/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gwennchoux@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Gattaga _",
        "date": "27/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lauretannelaure04@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Neya _",
        "date": "28/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jeanpierremussard06@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre avec vitre déco _ Brut",
        "date": "09/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Colonne Laura Krepyak _",
        "date": "09/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse Minimalis _",
        "date": "09/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Blokus _ Brut ; 1 _ Buffet Evolia 3P Bloc _ Brut ; 1 _ Meuble à chaussures Jail _ Brut ; 1 _ SUEB S _ Brut ; 1 _ Table basse Minimalis _  ; 1 _ Table basse minimalis à tiroirs _ Cérusé Blanc ; 2 _ Table de nuit Krepyak _ Brut ; 1 _ Zig-zag 100 _",
        "date": "28/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "andrea_nagou@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": "30/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nathaliefernagut@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Etagère Kolum _ Brut",
        "date": "30/09/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nicolef97427@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ PRJ _ Miel,Cérusé Blanc",
        "date": "01/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mariannedemile@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": "01/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lallemand.caroline@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Samania _ Miel",
        "date": "02/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CORDOBA _ Miel ; 1 _ Bureau Samania _ Miel",
        "date": "02/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nathalie.bang@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Carrée Slats _ Brut",
        "date": "02/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "suzelle.hoareau@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ DB 33 _ Brut",
        "date": "02/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gladys.lebon@icloud.col": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JULIANA Cérusé blanc _ Miel,Brut ; 1 _ Table Aura _ Brut ; 1 _ Table Mountain _ Brut",
        "date": "03/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "brigitte.maillot97438@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1_ Table basse en suar _ Cérusé Blanc",
        "date": "04/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "guillaume.huat@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Ensemble Sofa K _ Miel",
        "date": "04/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ferrard.adeline@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _ Miel ; 1 _ Commode Damier _ Miel",
        "date": "05/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fannyduchatelier@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Brut",
        "date": "05/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "christinegr@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE 3 TIROIRS _ Miel",
        "date": "06/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "danielmondon@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 3P _ Miel ; 1 _ Console 3 tiroirs et pieds en métal _ Miel ; 1 _ Bureau José _ Miel",
        "date": "07/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "terrassonjeanpierre03@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Miel",
        "date": "07/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "doloresclarivet@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Sherry _ Brut ; 1 _ Table de nuit Sherry _ Brut",
        "date": "08/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marimoutou.stesy@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Blokus _ Cérusé Blanc ; 2 _ Table de nuit Krepyak _ Cérusé Blanc",
        "date": "09/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sophie.le-cointre@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel",
        "date": "21/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": "09/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ragondetolivier@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Cérusé Blanc ; 1 _ MANTIGGAN _ Cérusé Blanc",
        "date": "10/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nicolas.renneville@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _",
        "date": "10/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "martineahting@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Sofa K _ Miel",
        "date": "11/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "payet.antoine@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 - Chaise Sandi _",
        "date": "11/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "samson.garany974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SYDNEY _ Miel",
        "date": "12/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "valeriemenetrey8@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Miel",
        "date": "12/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hassen.isa@outlook.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Julia _ Cérusé Blanc",
        "date": "12/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "christelledijoux85@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE STRUCTURE METAL _ Miel",
        "date": "13/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Miel ; 1 _ CONSOLE STRUCTURE METAL _ Miel",
        "date": "13/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ocelie974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Brut",
        "date": "14/10/2025",
        "message": "Bonjour, je souhaite un devis pour le lit suivant aux dimensions 160x200"
      },
      {
        "meuble": "1 _ Lit EVOLIA _ Brut ; 1 _ Table Minimalis _ Brut",
        "date": "14/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : lit 160x200cm"
      }
    ]
  },
  "dejarclarisse@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel",
        "date": "16/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "bertrand.mc8@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis à suspendre _",
        "date": "16/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Oasis à suspendre _  ; 1 _ Palu _ Cérusé Noir",
        "date": "16/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "magguie.414.fmp@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc",
        "date": "17/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "freddeck974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Bunga _ Miel",
        "date": "18/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sandra.maillot43@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Cérusé Blanc",
        "date": "19/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lylie440@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode New _ Cérusé Blanc ; 1 _ JULIANA Cérusé blanc _ Cérusé Blanc",
        "date": "19/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "piffarelly.denise@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": "19/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "abbou.alice@yahoo.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Chevron _  ; 1 _ LAWANG _  ; 1 _ Meuble à chaussures Jail _ Miel",
        "date": "20/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sarpedon.mathieu974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Miel ; 1 _ CORDOBA _ Miel ; 1 _ Table de nuit  Minimalis _",
        "date": "21/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marjorie.reymond@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Brut",
        "date": "22/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jessiedelasep@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Cérusé Blanc ; 1 _ CONSOLE LAURA DAMIER _ Miel ; 1 _ Table basse Gigogne _  ; 1 _ Padang _ Miel",
        "date": "22/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "shehazelie97414@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Alkmaar _ Cérusé Noir",
        "date": "23/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sophiedelmont974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Miel",
        "date": "23/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jacqueline.busnel.61@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Ubud _ Brut",
        "date": "24/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "deldug1@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _",
        "date": "25/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "josselinferret@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Neya _ Cérusé Noir",
        "date": "25/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "tibiza@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis à suspendre _ Cérusé Blanc ; 1 _ Zigzag _ Cérusé Blanc ; 1 _ Colonne Evolia 2P _ Cérusé Blanc ; 1 _ Mahira _ Cérusé Blanc",
        "date": "27/10/2025",
        "message": "Bonjour, \nje suis à la recherche d’un meuble de salle de bain à suspendre, en dimension 140cm +\\- pour 2 vasques. \nEst il possible d’avoir les prix et disponibilités en finition brut et cerusé blanc ? \nJe vous laisse me dire ce qui serait disponible, si il y a, dans d’autre modèle en conservant colori et dimensions. \nCordialement \nThomas OGIER COLLIN \n49 rue du rond \n97480 saint Joseph"
      }
    ]
  },
  "philippe.dalleau@sfr.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zigzag _ Miel",
        "date": "28/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cyrilpb974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Jonggol _ Miel",
        "date": "29/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "boscher.evalise@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ DB 33 _ Miel",
        "date": "30/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ducaudbernadette@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padi _ Brut",
        "date": "30/10/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sam.chesimar@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Brut",
        "date": "01/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aaliyah.sago@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Lit en teck massif 180X200\nMeuble salle de bain Séville krepyak\nTable sarimane\n5 chaises Julia",
        "date": "01/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "josieboyer@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ GAYA _ Brut",
        "date": "02/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clfougeroux@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Buffet Evolia 4P Bloc _ Miel",
        "date": "03/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marie-louiselodoiska974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Slats _ Miel ; 1 _ Nusa _ Miel",
        "date": "03/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jerome.basquaise@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel",
        "date": "03/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ylaplanche@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padi _ Miel",
        "date": "03/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "brigitte.kels@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible ovale _ Miel",
        "date": "03/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "penelope.leroy28@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Cérusé Noir",
        "date": "05/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "danielatoussaint974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Nature _ Brut ; 1 _ Table Mountain _ Brut",
        "date": "05/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "barsjul@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit  Minimalis _ Cérusé Blanc",
        "date": "05/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aultier77@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ SUEB GAYA A - 3 tiroirs _ Miel,Brut",
        "date": "06/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "v.dexon@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Krepyak _",
        "date": "07/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "alisonpayet740@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ FAUTEUIL MARINA _ Cérusé Blanc",
        "date": "07/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "judikael.dompy@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Hampton _ Cérusé Noir",
        "date": "10/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lucaspayetjeanne@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "8 _ Chaise Julia _ Cérusé Blanc ; 8 _ Chaise Upin _ Cérusé Blanc ; 8 _ FAUTEUIL HIRO _ Cérusé Blanc ; 8 _ Fauteuil June _ Cérusé Blanc ; 8 _ Fauteuil Rossolin _ Cérusé Blanc",
        "date": "10/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "victoria.treuillet@thereserennes.org": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Alkmaar _ Miel,Cérusé Noir",
        "date": "13/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de nuit Alkmaar _ Miel,Cérusé Noir ; 1 _ Table de nuit Madiun _ Miel,Cérusé Noir",
        "date": "13/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "florence.carrette@laposte.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Miroir Candi _  ; 1 _ Miroir Maja _",
        "date": "15/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : armoire de toilette avec miroir"
      }
    ]
  },
  "vanessaemboule3@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ FAUTEUIL HIRO _ Miel ; 1 _ Table Scandivian _ Miel",
        "date": "15/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cazemagetiffany@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Miel",
        "date": "16/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "claudineattard@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne pour machine à laver _ Brut ; 1 _ Padi _ Brut",
        "date": "16/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "chd4621@yahoo.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": "16/11/2025",
        "message": "Bonjour, je souhaite un devis la table Aura.\nSi possible en 130 cm de diamètre.\nMerci"
      }
    ]
  },
  "bringus@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Blanc",
        "date": "16/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants (180x200 si possible et 200x200)"
      }
    ]
  },
  "gen.morelle@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Miel",
        "date": "17/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "d.sarpedon@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bain de Soleil _ Miel",
        "date": "17/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "valery.gisele@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Miel",
        "date": "18/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anneaudrey.robert@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Cérusé Noir",
        "date": "18/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "holsteingcoralie@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Brut",
        "date": "19/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Zigzag 3 tiroirs _ Miel ;  _  _ Brut",
        "date": "19/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anniselauret25@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de jardin extensible _",
        "date": "20/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table de jardin extensible _  ; 1 _ Table Luma _ Miel",
        "date": "20/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :devis 1 avec 4 chaises et devis 2 table lumineuse avec 2 chaises cordialement"
      }
    ]
  },
  "hoareau.magalie@wanadoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Miel",
        "date": "20/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aescarmelle@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Cérusé Blanc",
        "date": "21/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "corinnetk@wanadoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TANGGA _ Cérusé Noir",
        "date": "22/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cecill@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Slats _ Brut ; 1 _ Colonne Evolia 2P _ Brut",
        "date": "23/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "steeve.dubec@lassurance.re": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Cérusé Noir",
        "date": "24/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dayan.riviere@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Noir",
        "date": "25/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 140x190"
      }
    ]
  },
  "fred440@me.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Noir",
        "date": "26/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "frederique.noel.sophro@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Seko _",
        "date": "26/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "dthierry974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Cérusé Blanc",
        "date": "26/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Cérusé Blanc ; 1 _ Buffet Evolia 4P Bloc _ Cérusé Blanc",
        "date": "26/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stella.31012000@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Chaise Sandi _ Cérusé Blanc",
        "date": "28/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "tobal97435@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Hexagonal _ Cérusé Blanc ; 1 _ SUEB S _ Cérusé Blanc ; 1 _ Table basse minimalis à tiroirs _ Cérusé Blanc ; 1 _ Table Minimalis _ Cérusé Blanc",
        "date": "28/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emmanuelle.maillot@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Krepyak _ Miel",
        "date": "29/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "labbe.gaelle1989@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "_  _ Miel,Brut ; 1 _ FAUTEUIL HIRO _ Miel,Cérusé Noir",
        "date": "29/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emilie.rgr@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Miel",
        "date": "30/11/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gael.setapi@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Chaise de bar Eve _ Cérusé Blanc",
        "date": "01/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "beguenadia@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne pour machine à laver _ Miel,Cérusé Noir ; 1 _ Mikha 90 cm _ Miel,Cérusé Noir",
        "date": "01/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "payet.karen974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Minimalis _ Brut",
        "date": "01/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\n\nPourriez vous aussi me.mettre les dimensions de la table et le temps nécessaire pour avoir la table."
      }
    ]
  },
  "emilie.guezelot@gmail.col": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Cérusé Blanc",
        "date": "01/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "bou97478@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Cérusé Noir ;  _  _ Cérusé Noir",
        "date": "02/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mathias.maillot97480@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "meuble de salle de bain suspendu  de préférence 100cm ou 90cm avec un ou deux tiroirs et un espace vide pour ranger les serviettes",
        "date": "03/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "johann.mangata@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Ensemble Riviéra _ Miel",
        "date": "04/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fevre.benedicte@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Sherry _ Miel",
        "date": "05/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jdeblangey@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Laura Krepyak _",
        "date": "05/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "payetraynaud03@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Brut",
        "date": "06/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nohalouis97433@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Table de nuit Madiun _ Miel",
        "date": "06/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "troquier.mathilde@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ SYDNEY _ Cérusé Blanc",
        "date": "07/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "stephanietecher0907@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bain de Soleil _  ; 6 _ FAUTEUIL MARINA _ Cérusé Noir",
        "date": "07/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "davhuet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Damier _ Cérusé Noir",
        "date": "08/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pierremercader1@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padoda 90 _ Miel",
        "date": "08/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "brubrunono22974@gmail.col": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Cérusé Blanc",
        "date": "08/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kemma.yvann@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zig-zag 100 _ Miel,Brut",
        "date": "09/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gwenhael.maier974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Slats _ Cérusé Noir",
        "date": "09/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mammosa.cici@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Cérusé Noir ; 1 _ Lit EVOLIA _ Miel,Cérusé Noir",
        "date": "10/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :en 200x200cm"
      }
    ]
  },
  "olivier.carpin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _",
        "date": "10/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "armonaxel.moutoussamy@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "12 _ Chaise Kondé _ Miel",
        "date": "11/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "perdereaueve@icloud.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse laquée blanc _ Brut",
        "date": "11/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pastureau.isaline@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Ci dessous",
        "date": "31/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Zig-zag 100 _",
        "date": "12/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marina.salvan17@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Minimalis Damier _ Cérusé Blanc ; 1 _ TOLITOLI PETIT _",
        "date": "13/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jeangeorgesmerlo.gg@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Chaise Dowel _ Miel",
        "date": "14/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ludivine.granulant@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel ; 6 _ FAUTEUIL HIRO _ Miel",
        "date": "02/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ AMBALONG 2 PORTES _  ; 6 _ Chaise Nagasaki _ Miel ; 1 _ Padang _  ; 6 _ Fauteuil June _ Miel",
        "date": "14/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "techerfanny@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Cérusé Noir ; 1 _ Table Aura _ Cérusé Noir ; 1 _ Fauteuil June _ Cérusé Noir",
        "date": "15/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "crystelle.91@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Colonne Minimalis Damier _ Miel",
        "date": "16/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Colonne Evolia 2P _ Miel",
        "date": "16/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sandra.elodie@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Madiun _",
        "date": "17/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gladys.techer@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Carrée Slats _ Cérusé Blanc",
        "date": "18/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : en 120*120"
      },
      {
        "meuble": "1 _ Table Carrée Slats _ Brut",
        "date": "18/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 120x120 et en 110x110"
      }
    ]
  },
  "blainjuly@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Brut",
        "date": "18/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "m.m974@live.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Palu _ Miel",
        "date": "19/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sebastienfilak@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Miel ; 1 _ Oasis 100 cm _  ; 1 _ Sherry à suspendre _ Miel ; 1 _ TOLITOLI _  ; 1 _ Zigzag 3 tiroirs _ Miel ; 1 _ TOLITOLI PETIT _ Miel",
        "date": "20/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "santamaria.laurent@wanadoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _",
        "date": "25/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "tgasparoux@fyb.re": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit Slats 3 New _ Brut",
        "date": "15/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 160x200 cm"
      },
      {
        "meuble": "1 _ Lit Japan (tdn) _ Cérusé Blanc,Brut, 1 _ Lit Slats 3 New _ Brut",
        "date": "15/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\n160x200 cm"
      },
      {
        "meuble": "1 _ TEXAS _ Cérusé Blanc,Brut",
        "date": "08/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "3 _ MEUBLE TV SCANDINAVIAN _ Cérusé Blanc,Brut, 2 _ OLANDA GM _ Cérusé Blanc,Brut, 1 _ TEXAS _ Cérusé Blanc,Brut",
        "date": "08/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Ensemble Grace _ Brut",
        "date": "25/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "reunifeu@icloud.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LIT SLATS 3 NEW _ Miel",
        "date": "26/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emma.gaelle88@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Blokus _ Miel ; 1 _ Buffet Tewah 3P _ Miel",
        "date": "27/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sapavou@mail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Samania _",
        "date": "28/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Bureau José _ Miel,Cérusé Blanc ; 1 _ Bureau Samania _",
        "date": "28/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "boulotbob@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise de bar Yeni _ Cérusé Blanc",
        "date": "28/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "delphineiris97430@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": "05/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut",
        "date": "29/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "auréane.techer@hotlail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CORDOBA _ Miel",
        "date": "30/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : (160x200)"
      }
    ]
  },
  "apayaseela@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ CORDOBA _ Brut ; 1 _ UBUD _ Brut ; 1 _ Bureau Hampton _ Brut ; 1 _ Bureau Jonggol _ Brut",
        "date": "30/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\nPour la lit Cordoba, 2x en 90x190\nPour le lit Ubud, 1x en 160x200"
      }
    ]
  },
  "felicie.benard@outlook.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Brut ; 1 _ Table Aura _  ; 1 _ Jampi _ Brut",
        "date": "31/12/2025",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lea-stoll@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Marbella _ Brut",
        "date": "01/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "joliane974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table de nuit Alkmaar _ Miel",
        "date": "01/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Table basse Gigogne en granite _  ; 1 _ Table de nuit Alkmaar _ Miel",
        "date": "01/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "aurelie_hoarau@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _    ; 1 _ Colonne Slats _",
        "date": "01/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sabrinacaroline.ferrere@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Lounge 4 portes _ Cérusé Blanc ; 1 _ Bibliothèque Seminyak _ Cérusé Blanc",
        "date": "03/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anneline.maillot@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 2P Krepyak _ Cérusé Noir ; 1 _ Buffet Evolia 3P Bloc _ Cérusé Blanc ; 1 _ Table de nuit  Minimalis _ Cérusé Noir ; 1 _ Table de nuit Madiun _ Brut",
        "date": "04/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "rea.riviere@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Cérusé Noir",
        "date": "04/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "leperlierjeanjacques@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Jampi _ Cérusé Blanc",
        "date": "05/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ JULIANA Brut _ Brut ; 2 _ Jampi _ Cérusé Blanc",
        "date": "05/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "valentin.defebvre@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Cérusé Noir",
        "date": "05/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : (en 140x190 cm et 160x200 cm)"
      }
    ]
  },
  "morel.carolle@laposte.net": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ ULUWATU _ Cérusé Blanc",
        "date": "06/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Goa _ Cérusé Blanc",
        "date": "06/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "samuelmanoro14@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ UBUD _ Cérusé Noir",
        "date": "06/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "bettymgmonteville@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Milano _ Miel",
        "date": "07/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kholil.billal@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel",
        "date": "07/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ac.pomader@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ EVO _ Cérusé Noir",
        "date": "07/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "frederique.kichenin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Brut",
        "date": "08/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sery.audrey@gmail.col": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 4P Bloc _ Miel ; 1 _ TANGGA _ Miel",
        "date": "08/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anais.macoral@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Gattaga _ Cérusé Blanc ; 1 _ Colonne Evolia 2P _ Cérusé Noir",
        "date": "08/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "betty.zaneguy@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque 12 casiers _ Miel",
        "date": "10/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nativel.julien97430@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lontan _ Cérusé Noir",
        "date": "10/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "c.dijoux@live.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Miel ;  _  _ Miel ; 4 _ Chaise Sandi _ Miel ; 1 _ Table Aura _ Miel ; 1 _ Jampi _ Miel ; 1 _ Colonne Laura Krepyak _ Miel",
        "date": "10/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "djuju974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Cassandre sur pied _ Miel",
        "date": "10/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sraypoulet@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE MINIMALIS _ Miel,Cérusé Noir ; 1 _ SUEB GAYA A - 3 tiroirs _ Miel ; 2 _ Table de nuit  Minimalis _ Miel",
        "date": "11/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pellegriniflo@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padoda 150 _ Miel",
        "date": "11/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "heresses@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Chaise Rivièra _ Miel",
        "date": "12/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nel97439@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Console Aubépine _ Brut",
        "date": "13/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ccile.fontn@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zig-zag 100 _ Miel",
        "date": "14/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Zig-zag 100 _ Miel ; 1 _ TOLITOLI PETIT _ Miel",
        "date": "14/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Cassandre à suspendre _ Miel ; 1 _ Zig-zag 100 _ Miel ; 1 _ TOLITOLI PETIT _ Miel",
        "date": "14/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fr0255030023@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Brut ; 1 _ Cassandre sur pied _ Brut ; 1 _ Table basse en suar _ Brut",
        "date": "14/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "adeline.pedre@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Oblique _ Cérusé Noir ; 1 _ Zigzag 3 tiroirs _ Brut ; 1 _ TOLITOLI PETIT _ Miel",
        "date": "14/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "chloehoareau79@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CANGGU _ Miel",
        "date": "14/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "michele.b.roussel@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode New _ Brut",
        "date": "15/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "emmanuelle.dally@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre avec vitre déco _  ; 3 _ JULIANA GM _ Cérusé Blanc ; 1 _ Lontan _",
        "date": "16/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mgermanaz@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ JAPAN AVEC TDN _ Miel",
        "date": "17/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "waratah-95@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ TABLE BASSE MINIMALIS _ Brut",
        "date": "17/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : table basse minimalis, si possible aux dimensions : 120x60. Dans le cas échéant au moins 1 m de longueur"
      }
    ]
  },
  "guylbo@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit EVOLIA _ Cérusé Blanc 200x200",
        "date": "17/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "grasfrancoise@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Miel,Brut",
        "date": "18/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nat.3@laposte.net": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Brut ; 2 _ Buffet Evolia 4P Bloc _ Brut ; 8 _ Chaise Julia _ Brut",
        "date": "19/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :\n\nme dire si offre pdt les soldes de février  svp"
      }
    ]
  },
  "melanieadolphe0@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Blanc",
        "date": "22/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clo.barret@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Coffeuse Kauwage _ Cérusé Blanc",
        "date": "23/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "leroyval@cegetel.net": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Damier _ Cérusé Blanc",
        "date": "24/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "lebeaucamille2004@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "4 _ Chaise Sandi _ Miel ; 3 _ Table Minimalis _ Miel",
        "date": "24/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "priscillaclain757@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Miel",
        "date": "24/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nicolas.a.turpin@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Seville Krepyak _ Cérusé Blanc",
        "date": "25/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "claudinedelay@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 2 PORTES _ Miel,Brut ; 1 _ Buffet Evolia 3P Bloc _ Brut",
        "date": "25/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jenniferpetitbaldini974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ CONSOLE STRUCTURE METAL _ Brut",
        "date": "25/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "colunette@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit Ubud _ Brut",
        "date": "25/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "eugene.marion974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Bain de Soleil _ Miel",
        "date": "26/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sgs2@protonmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Penderie _ Cérusé Blanc",
        "date": "26/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mathildeaurelie.thazar@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode Petite Evolia _ Miel",
        "date": "27/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "wcourteaud@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "2 _ Colonne Laura Krepyak _ Cérusé Noir",
        "date": "27/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Oasis à suspendre _ Cérusé Noir",
        "date": "27/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gaelle.detourbe@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Brut ; 1 _ Commode Petite Evolia _ Brut",
        "date": "28/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ced_doudou@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Buffet",
        "date": "28/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "barrearnaud@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Lit Evolia Miel 160X200",
        "date": "28/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "kevinatchydalama@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Jampi cerisier noir",
        "date": "28/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : jampi cerisier noir"
      }
    ]
  },
  "pott.marilo.lorrenn06@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Lit japan",
        "date": "29/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Lit japan couleur brut",
        "date": "29/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "olga97425@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Mahira miel",
        "date": "30/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "pierrettelenon86@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Tables de jardin",
        "date": "30/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "priscilla.mazeau@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Armoire",
        "date": "30/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles armoire adaptée pour un studio"
      }
    ]
  },
  "lacassinanais@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Cherche meuble de salle de bain de 60cm de longueur",
        "date": "30/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "jricquebourg@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Lit",
        "date": "31/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : lit 90×190"
      }
    ]
  },
  "claire.tossem@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Bureau + console + chaises + bibliothèque",
        "date": "31/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants s'il vous plaît :"
      },
      {
        "meuble": "Table de nuit Alkmaar_brut + Bureau Hampton _ brut + Console minimaliste_ brut",
        "date": "31/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "ahosandrine@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table + meuble",
        "date": "31/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "Table + enfillade",
        "date": "31/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 4 tables 2metre ou 1m5 montaigne couleur brut , une enfilade 2metres couleur brut"
      },
      {
        "meuble": "buffets rangement veolia 4P 2metre",
        "date": "31/01/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : buffets rangement veolia 4P 2metre"
      }
    ]
  },
  "laetitia.grondin7@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Dressing couleur brut et console couleur miel",
        "date": "01/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "joellenonet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "lit en 160 et 200",
        "date": "01/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mathieu.clairivet@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 table minimalis 6 chaises neya 4 chaises de bar yeni. Le tout en finition miel",
        "date": "02/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maletfarida6@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table salle à manger",
        "date": "02/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "melanie-morvan@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Salle de bain oasis à suspendre brut 140",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "hugobesnard974@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "SUEB S meuble tv",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elodie.dubedat@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Meuble tv juliana cérusé blanc",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nicolas.breton4@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "lave main en teck cerusé blanc",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "commode, lit, lave main",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "christinetl@orange.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table basse Floride en bois brut",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "sylviecougnoux@yahoo.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "table minimalis brut",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gcougnoux@sfr.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Stats brut en 120 cm",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "shehnaz.maleck@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Meuble à chaussures Jail _ Miel, 1 _ MEUBLE A CHAUSSURES KREPYAK _ Miel,Cérusé Blanc",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "farouk@moussa.re": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit Japan (tdn) _ Miel",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : 160x200"
      }
    ]
  },
  "nabylahc@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Miel",
        "date": "03/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "reboulthierry.fr@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit Evolia _ Miel",
        "date": "04/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :lit  évolua miel dimensions 200x200"
      }
    ]
  },
  "78 route forestiere": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Sherry à suspendre _ Miel",
        "date": "05/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "n-a-n-y-974@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Oasis _ Miel",
        "date": "05/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "fleur.francoise@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Milano _ Cérusé Blanc",
        "date": "06/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : \nPouvez-vous préciser la hauteur du meuble svp ?\nLes tabourets sont-ils inclus dans le devis ?"
      }
    ]
  },
  "audrey.balcon@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table basse Minimalis _ Miel",
        "date": "06/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "chloemezino@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit Japan (tdn) _ Cérusé Noir",
        "date": "06/02/2026",
        "message": "Bonjour, je souhaite un devis pour le lit avec les tables de nuit intégrées si possible et quand si c'est disponible. Merci"
      }
    ]
  },
  "patricecaptur@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Brut",
        "date": "06/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "camille.gomez37@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ AMBALONG 1 PORTE _ Miel",
        "date": "06/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "olivia.jazgier@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "6 _ Sherry sur pied _ Cérusé Blanc",
        "date": "07/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "xolotl4@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ LAWANG _ Brut",
        "date": "07/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ LAWANG _ Brut",
        "date": "07/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ LAWANG _ Brut",
        "date": "07/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "gary.mares@outlook.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Seminyak _ Brut",
        "date": "07/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "zaydrumjaun@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit Evolia _ Miel,Brut,Cérusé Noir",
        "date": "07/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : lit evolia et japan en 160"
      }
    ]
  },
  "johana97436@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Block _ Miel, 1 _ Armoire Krepyak _ Cérusé Blanc, 1 _ Commode 7 tiroirs _ Cérusé Blanc, 1 _ Lit Ubud _ Cérusé Blanc",
        "date": "07/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "astridboyer42@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Commode 7 tiroirs _ Miel",
        "date": "08/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mappi974@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Armoire Isabelle Minimalis _ Miel, 1 _ Table de nuit Ubud _ Miel, 1 _ Lit Ubud _ Miel",
        "date": "08/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "elsa.desruisseaux@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Cérusé Noir",
        "date": "08/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "christelle.dorval@yahoo.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau DB 33 _ Miel, 1 _ Buffet Evolia 3P Bloc _ Miel, 1 _ Buffet Evolia 4P Bloc _ Miel",
        "date": "08/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "c.torpos02@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Padi _ Brut",
        "date": "08/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Cassandre sur pied _ Miel, 1 _ Padi _ Brut",
        "date": "08/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maevadre@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Table Aura _ Brut",
        "date": "09/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "geraldine_herode@yahoo.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre à suspendre _ Brut",
        "date": "10/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "robertstecy1@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Buffet Tewah 3P _ Miel",
        "date": "10/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Buffet Evolia 3P Bloc _ Miel, \n1 _ Buffet Tewah 3P _ Miel",
        "date": "10/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "cecile_boullay@hotmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit Cordoba _ Cérusé Blanc, 1 _ Lit Ubud _ Cérusé Blanc  en 160*200",
        "date": "11/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "desreac.nathalie@orange.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Miel,Cérusé Noir",
        "date": "11/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      },
      {
        "meuble": "1 _ Zigzag _ Cérusé Blanc,Cérusé Noir, 1 _ Mahira _ Miel,Cérusé Noir",
        "date": "11/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marina.boyer63@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Jampi _ Brut",
        "date": "11/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "samiarousse@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Kuta 80 _ Cérusé Blanc",
        "date": "11/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "romain.besnard2@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "Table de salon ronde",
        "date": "12/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants : table de salon ronde"
      }
    ]
  },
  "hasss.irmane@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bureau Jonggol _ Miel, 1 _ CONSOLE MINIMALIS _ Miel, 1 _ Cassandre à suspendre _ Miel",
        "date": "13/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mauriegtc@gmail.com": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Zig-zag 100 _ Brut,Cérusé Blanc, 1 _ Zigzag 3 tiroirs _ Miel",
        "date": "14/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "marieandreefeŕrere2@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Miel",
        "date": "15/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "juliette.poidatz@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Lounge 4 portes _ Miel",
        "date": "15/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "maryline.bellanger@free.fr": {
    "consents": {
      "offre": true,
      "newsletter": true,
      "invitation": true,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Mahira _ Cérusé Blanc",
        "date": "16/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "anyssa974@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ OLANDA GM _ Cérusé Blanc",
        "date": "16/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "koralie.couloutchy@hotmail.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Cassandre sur pied _ Cérusé Blanc",
        "date": "16/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "clarissemaratchiaflavie@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit Ubud _ Miel",
        "date": "17/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nicole.pothin.jp@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lave-mains en teck _ Miel",
        "date": "17/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "mou.mounaya@gmail.com": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1_ Jampi _ Cérusé Noir",
        "date": "18/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "nathalie.buffard@outlook.fr": {
    "consents": {
      "offre": false,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Lit Evolia _ Miel",
        "date": "18/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  },
  "thaidragon@hotmail.fr": {
    "consents": {
      "offre": true,
      "newsletter": false,
      "invitation": false,
      "devis": true
    },
    "requests": [
      {
        "meuble": "1 _ Bibliothèque Lounge 4 portes _ Cérusé Noir",
        "date": "19/02/2026",
        "message": "Bonjour, je souhaite un devis pour les meubles suivants :"
      }
    ]
  }
};
