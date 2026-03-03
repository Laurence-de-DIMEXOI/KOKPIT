'use client';

import clsx from 'clsx';
import {
  Building2,
  Users,
  CalendarDays,
  UserCheck,
  Clock,
  ArrowRight,
  CalendarPlus,
  UserCircle,
} from 'lucide-react';

interface KPICard {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}

interface UpcomingLeave {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'Congé payé' | 'RTT' | 'Maladie';
}

const mockKPIs: KPICard[] = [
  {
    icon: <Users className="w-6 h-6" />,
    label: 'Effectif total',
    value: '9',
  },
  {
    icon: <UserCheck className="w-6 h-6" />,
    label: 'En congé aujourd\'hui',
    value: '1',
    subtitle: 'Michelle Perrot',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    label: 'Demandes en attente',
    value: '3',
  },
  {
    icon: <CalendarDays className="w-6 h-6" />,
    label: 'Solde moyen congés',
    value: '18.5',
    subtitle: 'jours',
  },
];

const mockUpcomingLeaves: UpcomingLeave[] = [
  {
    id: '1',
    name: 'Michelle Perrot',
    startDate: '2026-03-03',
    endDate: '2026-03-16',
    type: 'Congé payé',
  },
  {
    id: '2',
    name: 'Laurent Batisse',
    startDate: '2026-03-20',
    endDate: '2026-03-20',
    type: 'RTT',
  },
  {
    id: '3',
    name: 'Daniella Folio',
    startDate: '2026-03-25',
    endDate: '2026-03-28',
    type: 'Congé payé',
  },
  {
    id: '4',
    name: 'Laurence Payet',
    startDate: '2026-04-06',
    endDate: '2026-04-10',
    type: 'Congé payé',
  },
];

function getLeaveTypeBadgeColor(type: UpcomingLeave['type']): string {
  switch (type) {
    case 'Congé payé':
      return 'bg-cockpit-success/20 text-cockpit-success';
    case 'RTT':
      return 'bg-cockpit-primary/20 text-cockpit-primary';
    case 'Maladie':
      return 'bg-red-500/20 text-red-500';
    default:
      return 'bg-cockpit-secondary/20 text-cockpit-secondary';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdministrationPage() {
  return (
    <div className="min-h-screen bg-cockpit-darker p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-cockpit-success" />
          <h1 className="text-3xl font-bold text-cockpit-heading">
            Administration
          </h1>
        </div>
        <p className="text-cockpit-secondary">Gestion RH & Comptabilité</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {mockKPIs.map((kpi, index) => (
          <div
            key={index}
            className="bg-cockpit-dark border border-cockpit rounded-xl p-6 hover:border-cockpit-success/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-cockpit-success">{kpi.icon}</div>
            </div>
            <p className="text-cockpit-secondary text-sm mb-2">{kpi.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-cockpit-heading">
                {kpi.value}
              </p>
              {kpi.subtitle && (
                <p className="text-sm text-cockpit-secondary">{kpi.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Congés & Absences Card */}
        <div className="bg-cockpit-dark border border-cockpit rounded-xl p-8 hover:border-cockpit-success/50 transition-colors group cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cockpit-success/10 rounded-lg group-hover:bg-cockpit-success/20 transition-colors">
                <CalendarPlus className="w-6 h-6 text-cockpit-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cockpit-heading">
                  Congés & Absences
                </h3>
                <p className="text-sm text-cockpit-secondary">
                  Gérer les demandes et soldes
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-cockpit-success group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Collaborateurs Card */}
        <div className="bg-cockpit-dark border border-cockpit rounded-xl p-8 hover:border-cockpit-success/50 transition-colors group cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cockpit-success/10 rounded-lg group-hover:bg-cockpit-success/20 transition-colors">
                <Users className="w-6 h-6 text-cockpit-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cockpit-heading">
                  Collaborateurs
                </h3>
                <p className="text-sm text-cockpit-secondary">
                  Annuaire et fiches RH
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-cockpit-success group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Prochains Congés Preview Section */}
      <div className="bg-cockpit-dark border border-cockpit rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <CalendarDays className="w-5 h-5 text-cockpit-success" />
          <h2 className="text-xl font-semibold text-cockpit-heading">
            Prochains congés
          </h2>
        </div>

        <div className="space-y-3">
          {mockUpcomingLeaves.map((leave) => (
            <div
              key={leave.id}
              className="flex items-center justify-between p-4 bg-cockpit-darker rounded-lg hover:bg-cockpit-darker/80 transition-colors border border-cockpit/30"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-cockpit-success/10 rounded-lg">
                  <UserCircle className="w-5 h-5 text-cockpit-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-cockpit-heading">
                    {leave.name}
                  </p>
                  <p className="text-sm text-cockpit-secondary">
                    {formatDate(leave.startDate)}
                    {leave.startDate !== leave.endDate &&
                      ` - ${formatDate(leave.endDate)}`}
                  </p>
                </div>
              </div>
              <div
                className={clsx(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  getLeaveTypeBadgeColor(leave.type)
                )}
              >
                {leave.type}
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-6 py-3 px-4 bg-cockpit-success/10 hover:bg-cockpit-success/20 border border-cockpit-success/30 rounded-lg text-cockpit-success font-medium transition-colors">
          Voir tous les congés
        </button>
      </div>
    </div>
  );
}
