'use client';

import { useState } from 'react';
import { Search, Plus, Mail, Phone, Calendar, Building2, Users } from 'lucide-react';
import clsx from 'clsx';

interface Collaborateur {
  id: string;
  prenom: string;
  nom: string;
  poste: string;
  departement: string;
  email: string;
  telephone: string;
  dateEntree: string;
  statut: 'actif' | 'conge';
}

const MOCK_COLLABORATEURS: Collaborateur[] = [
  {
    id: '1',
    prenom: 'Jean',
    nom: 'Dupont',
    poste: 'Directeur Général',
    departement: 'Direction',
    email: 'jean.dupont@kokpit.fr',
    telephone: '+33 1 23 45 67 89',
    dateEntree: '2018-01-15',
    statut: 'actif',
  },
  {
    id: '2',
    prenom: 'Marie',
    nom: 'Martin',
    poste: 'Responsable Commercial',
    departement: 'Commercial',
    email: 'marie.martin@kokpit.fr',
    telephone: '+33 1 23 45 67 90',
    dateEntree: '2019-03-20',
    statut: 'actif',
  },
  {
    id: '3',
    prenom: 'Pierre',
    nom: 'Bernard',
    poste: 'Développeur Senior',
    departement: 'Technique',
    email: 'pierre.bernard@kokpit.fr',
    telephone: '+33 1 23 45 67 91',
    dateEntree: '2020-06-10',
    statut: 'actif',
  },
  {
    id: '4',
    prenom: 'Sophie',
    nom: 'Lefevre',
    poste: 'Chef de Projet Marketing',
    departement: 'Marketing',
    email: 'sophie.lefevre@kokpit.fr',
    telephone: '+33 1 23 45 67 92',
    dateEntree: '2021-02-01',
    statut: 'conge',
  },
  {
    id: '5',
    prenom: 'Luc',
    nom: 'Gaudin',
    poste: 'Responsable RH',
    departement: 'RH',
    email: 'luc.gaudin@kokpit.fr',
    telephone: '+33 1 23 45 67 93',
    dateEntree: '2017-09-15',
    statut: 'actif',
  },
  {
    id: '6',
    prenom: 'Isabelle',
    nom: 'Rousseau',
    poste: 'Représentant Commercial',
    departement: 'Commercial',
    email: 'isabelle.rousseau@kokpit.fr',
    telephone: '+33 1 23 45 67 94',
    dateEntree: '2022-05-01',
    statut: 'actif',
  },
  {
    id: '7',
    prenom: 'Thomas',
    nom: 'Petit',
    poste: 'Développeur Full Stack',
    departement: 'Technique',
    email: 'thomas.petit@kokpit.fr',
    telephone: '+33 1 23 45 67 95',
    dateEntree: '2023-01-10',
    statut: 'conge',
  },
  {
    id: '8',
    prenom: 'Anne',
    nom: 'Fournier',
    poste: 'Spécialiste Marketing Digital',
    departement: 'Marketing',
    email: 'anne.fournier@kokpit.fr',
    telephone: '+33 1 23 45 67 96',
    dateEntree: '2021-11-15',
    statut: 'actif',
  },
];

const getDepartementColor = (departement: string): string => {
  const colors: Record<string, string> = {
    'Direction': 'bg-purple-500/20 text-purple-300',
    'Commercial': 'bg-blue-500/20 text-blue-300',
    'Marketing': 'bg-pink-500/20 text-pink-300',
    'Technique': 'bg-cyan-500/20 text-cyan-300',
    'RH': 'bg-green-500/20 text-green-300',
  };
  return colors[departement] || 'bg-gray-500/20 text-gray-300';
};

const getInitials = (prenom: string, nom: string): string => {
  return `${prenom[0]}${nom[0]}`.toUpperCase();
};

const calculateAnciennete = (dateEntree: string): number => {
  const debut = new Date(dateEntree);
  const maintenant = new Date();
  let annees = maintenant.getFullYear() - debut.getFullYear();
  const mois = maintenant.getMonth() - debut.getMonth();
  
  if (mois < 0) {
    annees--;
  }
  
  return annees;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function CollaborateursPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCollaborateurs = MOCK_COLLABORATEURS.filter((collab) => {
    const fullName = `${collab.prenom} ${collab.nom}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const totalActifs = MOCK_COLLABORATEURS.filter((c) => c.statut === 'actif').length;
  const totalConges = MOCK_COLLABORATEURS.filter((c) => c.statut === 'conge').length;
  const ancienneteMoyenne = Math.round(
    MOCK_COLLABORATEURS.reduce((acc, c) => acc + calculateAnciennete(c.dateEntree), 0) /
      MOCK_COLLABORATEURS.length
  );

  return (
    <div className="min-h-screen bg-cockpit-bg p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cockpit-heading">Collaborateurs</h1>
        <button className="flex items-center gap-2 rounded-lg bg-cockpit-success px-4 py-2 font-medium text-white hover:bg-cockpit-success/90 transition-colors">
          <Plus size={20} />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Collaborateurs */}
        <div className="rounded-xl border border-cockpit bg-cockpit-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cockpit-secondary">Total Collaborateurs</p>
              <p className="mt-2 text-2xl font-bold text-cockpit-heading">
                {MOCK_COLLABORATEURS.length}
              </p>
            </div>
            <Users size={32} className="text-cockpit-success/40" />
          </div>
        </div>

        {/* Actifs */}
        <div className="rounded-xl border border-cockpit bg-cockpit-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cockpit-secondary">Actifs</p>
              <p className="mt-2 text-2xl font-bold text-cockpit-heading">
                {totalActifs}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
          </div>
        </div>

        {/* En Congé */}
        <div className="rounded-xl border border-cockpit bg-cockpit-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cockpit-secondary">En Congé</p>
              <p className="mt-2 text-2xl font-bold text-cockpit-heading">
                {totalConges}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
            </div>
          </div>
        </div>

        {/* Ancienneté Moyenne */}
        <div className="rounded-xl border border-cockpit bg-cockpit-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cockpit-secondary">Ancienneté Moyenne</p>
              <p className="mt-2 text-2xl font-bold text-cockpit-heading">
                {ancienneteMoyenne} ans
              </p>
            </div>
            <Calendar size={32} className="text-cockpit-success/40" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-cockpit-secondary"
          />
          <input
            type="text"
            placeholder="Rechercher un collaborateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-cockpit bg-cockpit-dark py-3 pl-12 pr-4 text-cockpit-primary placeholder-cockpit-secondary focus:border-cockpit-success focus:outline-none focus:ring-2 focus:ring-cockpit-success/20"
          />
        </div>
      </div>

      {/* Collaborateurs Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCollaborateurs.map((collab) => (
          <div
            key={collab.id}
            className="rounded-xl border border-cockpit bg-cockpit-dark p-6 hover:border-cockpit-success/50 transition-colors"
          >
            {/* Header avec Avatar et Statut */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cockpit-success/15 text-cockpit-success font-bold">
                  {getInitials(collab.prenom, collab.nom)}
                </div>
                <div>
                  <h3 className="font-bold text-cockpit-heading">
                    {collab.prenom} {collab.nom}
                  </h3>
                  <p className="text-sm text-cockpit-secondary">{collab.poste}</p>
                </div>
              </div>
              <div
                className={clsx(
                  'h-3 w-3 rounded-full',
                  collab.statut === 'actif' ? 'bg-green-500' : 'bg-yellow-500'
                )}
              />
            </div>

            {/* Département Badge */}
            <div className="mb-4">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium',
                  getDepartementColor(collab.departement)
                )}
              >
                <Building2 size={14} />
                {collab.departement}
              </span>
            </div>

            {/* Info Grid */}
            <div className="space-y-3 border-t border-cockpit pt-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-cockpit-secondary flex-shrink-0" />
                <a
                  href={`mailto:${collab.email}`}
                  className="text-sm text-cockpit-primary hover:text-cockpit-success transition-colors break-all"
                >
                  {collab.email}
                </a>
              </div>

              {/* Téléphone */}
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-cockpit-secondary flex-shrink-0" />
                <a
                  href={`tel:${collab.telephone}`}
                  className="text-sm text-cockpit-primary hover:text-cockpit-success transition-colors"
                >
                  {collab.telephone}
                </a>
              </div>

              {/* Date d'entrée */}
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-cockpit-secondary flex-shrink-0" />
                <span className="text-sm text-cockpit-primary">
                  {formatDate(collab.dateEntree)}
                </span>
              </div>
            </div>

            {/* Ancienneté */}
            <div className="mt-4 rounded-md bg-cockpit-bg/50 px-3 py-2">
              <p className="text-xs text-cockpit-secondary">
                Ancienneté: <span className="font-semibold text-cockpit-primary">
                  {calculateAnciennete(collab.dateEntree)} ans
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCollaborateurs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-cockpit bg-cockpit-dark py-12">
          <Search size={48} className="mb-4 text-cockpit-secondary/40" />
          <p className="text-cockpit-secondary">
            Aucun collaborateur ne correspond à votre recherche
          </p>
        </div>
      )}
    </div>
  );
}
