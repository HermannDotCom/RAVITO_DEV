import React, { useState } from 'react';
import { useEffect } from 'react';
import { Settings, Bell, CreditCard, Package, Clock, Shield, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCommission } from '../../context/CommissionContext';
import { CrateTypesSettings } from './Settings/CrateTypesSettings';

export const SystemSettings: React.FC = () => {
  const { commissionSettings, refreshCommissionSettings } = useCommission();
  const [settings, setSettings] = useState({
    // General Settings
    platformName: 'RAVITO',
    supportEmail: 'support@ravito.ci',
    supportPhone: '+225 27 20 30 40 50',
    operatingHours: '24h/24',

    // Order Settings
    maxDeliveryDistance: 15, // km
    defaultDeliveryTime: 25, // minutes
    orderTimeout: 10, // minutes before auto-cancel
    minimumOrderAmount: 5000, // FCFA

    // Commission Settings
    clientCommission: 4, // percentage
    supplierCommission: 1, // percentage

    // Notification Settings
    smsNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
    whatsappNotifications: false,

    // Payment Settings
    enableOrangeMoney: true,
    enableMTN: true,
    enableMoov: true,
    enableWave: true,
    enableBankCards: true,

    // Security Settings
    requirePhoneVerification: true,
    requireEmailVerification: false,
    enableTwoFactorAuth: false,
    sessionTimeout: 24, // hours

    // Product Settings
    enableSolibra: true,
    enableBrassivoire: true,
    autoUpdatePrices: false,
    consigneTracking: true
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      clientCommission: commissionSettings.clientCommission,
      supplierCommission: commissionSettings.supplierCommission
    }));
  }, [commissionSettings]);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { data: currentSettings, error: fetchError } = await supabase
        .from('commission_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching current settings:', fetchError);
        alert('Erreur lors du chargement des paramètres actuels');
        setSaving(false);
        return;
      }

      if (currentSettings) {
        const { error: updateError } = await supabase
          .from('commission_settings')
          .update({
            client_commission_percentage: settings.clientCommission,
            supplier_commission_percentage: settings.supplierCommission,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSettings.id);

        if (updateError) {
          console.error('Error updating settings:', updateError);
          alert('Erreur lors de la sauvegarde des paramètres: ' + updateError.message);
          setSaving(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from('commission_settings')
          .insert({
            client_commission_percentage: settings.clientCommission,
            supplier_commission_percentage: settings.supplierCommission,
            is_active: true,
            effective_from: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error inserting settings:', insertError);
          alert('Erreur lors de la création des paramètres: ' + insertError.message);
          setSaving(false);
          return;
        }
      }

      await refreshCommissionSettings();

      setSaving(false);
      setHasChanges(false);

      alert('✅ Paramètres sauvegardés avec succès!\n\nLes nouveaux taux de commission sont maintenant appliqués à toutes les nouvelles commandes.');
    } catch (error) {
      console.error('Exception saving settings:', error);
      alert('Erreur inattendue lors de la sauvegarde');
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres Système</h1>
            <p className="text-gray-600">Configuration globale de la plateforme RAVITO</p>
          </div>
          
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-orange-600" />
            Paramètres généraux
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la plateforme</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => updateSetting('platformName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email support</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone support</label>
              <input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => updateSetting('supportPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heures d'activité</label>
              <input
                type="text"
                value={settings.operatingHours}
                onChange={(e) => updateSetting('operatingHours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Order Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-orange-600" />
            Paramètres des commandes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distance max de livraison (km)</label>
              <input
                type="number"
                value={settings.maxDeliveryDistance}
                onChange={(e) => updateSetting('maxDeliveryDistance', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temps de livraison par défaut (min)</label>
              <input
                type="number"
                value={settings.defaultDeliveryTime}
                onChange={(e) => updateSetting('defaultDeliveryTime', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeout commande (min)</label>
              <input
                type="number"
                value={settings.orderTimeout}
                onChange={(e) => updateSetting('orderTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant minimum commande</label>
              <input
                type="number"
                value={settings.minimumOrderAmount}
                onChange={(e) => updateSetting('minimumOrderAmount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formatPrice(settings.minimumOrderAmount)}</p>
            </div>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
            Paramètres financiers
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission client (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.clientCommission}
                onChange={(e) => updateSetting('clientCommission', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Frais ajoutés au montant de la commande client</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission fournisseur (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.supplierCommission}
                onChange={(e) => updateSetting('supplierCommission', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Commission prélevée sur le montant reversé au fournisseur</p>
            </div>
          </div>
          
          {/* Commission Preview */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Simulation sur une commande de 100.000 FCFA</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-2">Côté Client :</p>
                <div className="space-y-1 text-gray-700">
                  <div className="flex justify-between">
                    <span>Montant commande :</span>
                    <span>100.000 FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais RAVITO ({settings.clientCommission}%) :</span>
                    <span>+{formatPrice(100000 * (settings.clientCommission / 100))}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Total à payer :</span>
                    <span>{formatPrice(100000 * (1 + settings.clientCommission / 100))}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-2">Côté Fournisseur :</p>
                <div className="space-y-1 text-gray-700">
                  <div className="flex justify-between">
                    <span>Montant commande :</span>
                    <span>100.000 FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission RAVITO ({settings.supplierCommission}%) :</span>
                    <span>-{formatPrice(100000 * (settings.supplierCommission / 100))}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Montant reversé :</span>
                    <span>{formatPrice(100000 * (1 - settings.supplierCommission / 100))}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 bg-white border border-blue-300 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note importante :</strong> La commission client s'ajoute au montant de la commande, 
                tandis que la commission fournisseur est déduite du montant reversé. 
                Ces taux sont appliqués en temps réel à toutes les nouvelles transactions.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-orange-600" />
            Paramètres de notification
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Notifications SMS</span>
                  <p className="text-sm text-gray-600">Envoi de SMS pour les mises à jour importantes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => updateSetting('smsNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Notifications Email</span>
                  <p className="text-sm text-gray-600">Envoi d'emails pour les confirmations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Notifications Push</span>
                  <p className="text-sm text-gray-600">Notifications dans l'application</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">WhatsApp Business</span>
                  <p className="text-sm text-gray-600">Intégration WhatsApp (bêta)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.whatsappNotifications}
                    onChange={(e) => updateSetting('whatsappNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
            Moyens de paiement
          </h3>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-900 mb-1">Section sensible - Accès restreint aux Super Admin</p>
                <p className="text-sm text-orange-800">
                  Les numéros de compte configurés ici seront utilisés pour recevoir les paiements des abonnements Ravito Gestion.
                  Assurez-vous que ces informations sont correctes et sécurisées.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Wave */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">W</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block">Wave</span>
                    <span className="text-xs text-gray-600">Transfert mobile</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableWave}
                    onChange={(e) => updateSetting('enableWave', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                  <input
                    type="tel"
                    placeholder="+225 07 XX XX XX XX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
                  <input
                    type="text"
                    placeholder="Ex: RAVITO CI"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Instructions pour le client..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Orange Money */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">O</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block">Orange Money</span>
                    <span className="text-xs text-gray-600">Transfert mobile</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableOrangeMoney}
                    onChange={(e) => updateSetting('enableOrangeMoney', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                  <input
                    type="tel"
                    placeholder="+225 07 XX XX XX XX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
                  <input
                    type="text"
                    placeholder="Ex: RAVITO CI"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Instructions pour le client..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* MTN Money */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">M</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block">MTN Money</span>
                    <span className="text-xs text-gray-600">Transfert mobile</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableMTN}
                    onChange={(e) => updateSetting('enableMTN', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                  <input
                    type="tel"
                    placeholder="+225 05 XX XX XX XX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
                  <input
                    type="text"
                    placeholder="Ex: RAVITO CI"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Instructions pour le client..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Moov Money */}
            <div className="border border-gray-200 rounded-lg p-4 opacity-75">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">M</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block">Moov Money</span>
                    <span className="text-xs text-gray-600">Transfert mobile</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableMoov}
                    onChange={(e) => updateSetting('enableMoov', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                  <input
                    type="tel"
                    placeholder="+225 01 XX XX XX XX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
                  <input
                    type="text"
                    placeholder="Ex: RAVITO CI"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Espèces */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">FCFA</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block">Espèces</span>
                    <span className="text-xs text-gray-600">Paiement en liquide</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-orange-600 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-2">Les paiements en espèces sont toujours acceptés et doivent être validés manuellement par l'équipe.</p>
            </div>
          </div>
        </div>

        {/* Crate Types Settings */}
        <CrateTypesSettings />

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-orange-600" />
            Paramètres de sécurité
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Vérification téléphone</span>
                  <p className="text-sm text-gray-600">Obligatoire à l'inscription</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requirePhoneVerification}
                    onChange={(e) => updateSetting('requirePhoneVerification', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Vérification email</span>
                  <p className="text-sm text-gray-600">Confirmation par email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => updateSetting('requireEmailVerification', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Authentification 2FA</span>
                  <p className="text-sm text-gray-600">Double authentification</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableTwoFactorAuth}
                    onChange={(e) => updateSetting('enableTwoFactorAuth', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeout session (heures)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-orange-600" />
            Paramètres produits
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">S</span>
                  </div>
                  <span className="font-medium text-gray-900">Produits Solibra</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableSolibra}
                    onChange={(e) => updateSetting('enableSolibra', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">B</span>
                  </div>
                  <span className="font-medium text-gray-900">Produits Brassivoire</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableBrassivoire}
                    onChange={(e) => updateSetting('enableBrassivoire', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Mise à jour prix auto</span>
                  <p className="text-sm text-gray-600">Synchronisation avec les fournisseurs</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoUpdatePrices}
                    onChange={(e) => updateSetting('autoUpdatePrices', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Suivi des consignes</span>
                  <p className="text-sm text-gray-600">Historique détaillé</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.consigneTracking}
                    onChange={(e) => updateSetting('consigneTracking', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            État du système
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="h-3 w-3 bg-green-400 rounded-full mx-auto mb-2"></div>
              <p className="font-medium text-green-700">Serveurs</p>
              <p className="text-sm text-green-600">Opérationnels</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="h-3 w-3 bg-green-400 rounded-full mx-auto mb-2"></div>
              <p className="font-medium text-green-700">Base de données</p>
              <p className="text-sm text-green-600">Connectée</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="h-3 w-3 bg-green-400 rounded-full mx-auto mb-2"></div>
              <p className="font-medium text-green-700">API Paiements</p>
              <p className="text-sm text-green-600">Fonctionnelle</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};