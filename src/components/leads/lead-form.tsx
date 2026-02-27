'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useCreateLead } from '@/hooks/use-leads';

interface LeadFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function LeadForm({ onClose, onSuccess }: LeadFormProps) {
  const [showTracking, setShowTracking] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    showroom: 'NORD',
    source: 'DIRECT',
    produits_demandes: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    rgpd_email: false,
    rgpd_sms: false,
    notes: '',
  });

  const { create, loading, error } = useCreateLead();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create(formData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la création:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Nouvelle demande</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Showroom and Source */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de la demande</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Showroom *
                </label>
                <select
                  name="showroom"
                  value={formData.showroom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="NORD">Nord</option>
                  <option value="SUD">Sud</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source *
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="DIRECT">Direct</option>
                  <option value="META">Meta</option>
                  <option value="GOOGLE">Google</option>
                  <option value="REFERRAL">Référence</option>
                  <option value="ORGANIC">Organique</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produits demandés *
            </label>
            <textarea
              name="produits_demandes"
              value={formData.produits_demandes}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Décrivez les produits intéressés..."
            />
          </div>

          {/* Tracking */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setShowTracking(!showTracking)}
              className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <span>Paramètres de suivi (UTM)</span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${showTracking ? 'rotate-180' : ''}`}
              />
            </button>
            {showTracking && (
              <div className="px-4 py-3 border-t border-gray-200 space-y-3 bg-gray-50">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    utm_source
                  </label>
                  <input
                    type="text"
                    name="utm_source"
                    value={formData.utm_source}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    utm_medium
                  </label>
                  <input
                    type="text"
                    name="utm_medium"
                    value={formData.utm_medium}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    utm_campaign
                  </label>
                  <input
                    type="text"
                    name="utm_campaign"
                    value={formData.utm_campaign}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RGPD Consent */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Consentement RGPD</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rgpdEmailConsent"
                  checked={formData.rgpd_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, rgpd_email: e.target.checked }))}
                  className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-400"
                />
                <span className="ml-2 text-sm text-gray-700">
                  J'accepte de recevoir des communications par email
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rgpdSmsConsent"
                  checked={formData.rgpd_sms}
                  onChange={(e) => setFormData(prev => ({ ...prev, rgpd_sms: e.target.checked }))}
                  className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-400"
                />
                <span className="ml-2 text-sm text-gray-700">
                  J'accepte de recevoir des SMS
                </span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Notes internes..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 font-medium rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
