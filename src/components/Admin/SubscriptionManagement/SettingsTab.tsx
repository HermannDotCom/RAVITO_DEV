import React, { useState, useEffect } from 'react';
import { Save, Clock, Bell } from 'lucide-react';
import type { SubscriptionSettings } from '../../../types/subscription';
import { getSubscriptionSettings, updateSubscriptionSettings } from '../../../services/admin/subscriptionAdminService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const SettingsTab: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    trialDurationDays: 30,
    autoSuspendAfterTrial: true,
    gracePeriodDays: 0,
    reminderDays: {
      monthly: [15, 7, 2],
      semesterly: [60, 30, 15],
      annually: [90, 60, 30, 15]
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionSettings();
      if (data) {
        setSettings(data);
        setFormData({
          trialDurationDays: data.trialDurationDays,
          autoSuspendAfterTrial: data.autoSuspendAfterTrial,
          gracePeriodDays: data.gracePeriodDays,
          reminderDays: data.reminderDays
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Erreur lors du chargement des paramètres', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      await updateSubscriptionSettings(formData, user.id);
      showToast('Paramètres mis à jour avec succès', 'success');
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Erreur lors de la sauvegarde des paramètres', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateReminderDays = (cycle: 'monthly' | 'semesterly' | 'annually', values: string) => {
    const days = values.split(',').map(v => parseInt(v.trim())).filter(n => !isNaN(n));
    setFormData({
      ...formData,
      reminderDays: {
        ...formData.reminderDays,
        [cycle]: days
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Paramètres Globaux</h3>
          <p className="text-sm text-gray-600">Configurer le système d'abonnement</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Période d'essai */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Période d'essai</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée de l'essai gratuit (jours)
              </label>
              <input
                type="number"
                value={formData.trialDurationDays}
                onChange={(e) => setFormData({ ...formData, trialDurationDays: parseInt(e.target.value) })}
                min="1"
                max="90"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre de jours d'essai gratuit offerts à la première souscription
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.autoSuspendAfterTrial}
                  onChange={(e) => setFormData({ ...formData, autoSuspendAfterTrial: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Suspendre automatiquement après l'essai
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Si activé, les abonnements non payés seront suspendus automatiquement
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période de grâce (jours)
              </label>
              <input
                type="number"
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) })}
                min="0"
                max="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre de jours après l'échéance avant suspension automatique
              </p>
            </div>
          </div>
        </div>

        {/* Relances */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Relances de paiement</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Mensuel (jours avant échéance)
              </label>
              <input
                type="text"
                value={formData.reminderDays.monthly.join(', ')}
                onChange={(e) => updateReminderDays('monthly', e.target.value)}
                placeholder="Ex: 15, 7, 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Séparer les valeurs par des virgules
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Semestriel (jours avant échéance)
              </label>
              <input
                type="text"
                value={formData.reminderDays.semesterly.join(', ')}
                onChange={(e) => updateReminderDays('semesterly', e.target.value)}
                placeholder="Ex: 60, 30, 15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Annuel (jours avant échéance)
              </label>
              <input
                type="text"
                value={formData.reminderDays.annually.join(', ')}
                onChange={(e) => updateReminderDays('annually', e.target.value)}
                placeholder="Ex: 90, 60, 30, 15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Informations importantes</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Les paramètres s'appliquent à tous les nouveaux abonnements</li>
          <li>• Les abonnements en cours ne sont pas affectés par les modifications</li>
          <li>• Les relances sont envoyées automatiquement selon le calendrier défini</li>
          <li>• La suspension automatique intervient le lendemain de l'échéance + période de grâce</li>
        </ul>
      </div>

      {/* Calendrier des relances */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Calendrier actuel des relances</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">Mensuel</div>
            <div className="space-y-2">
              {formData.reminderDays.monthly.map((days, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <Bell className="w-4 h-4 mr-2 text-orange-500" />
                  J-{days} : Relance {index + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">Semestriel</div>
            <div className="space-y-2">
              {formData.reminderDays.semesterly.map((days, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <Bell className="w-4 h-4 mr-2 text-orange-500" />
                  J-{days} : Relance {index + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">Annuel</div>
            <div className="space-y-2">
              {formData.reminderDays.annually.map((days, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <Bell className="w-4 h-4 mr-2 text-orange-500" />
                  J-{days} : Relance {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
