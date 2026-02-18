import React, { useState } from 'react';
import { useEffect } from 'react';
import { Settings, Bell, CreditCard, Package, Clock, Shield, Save, AlertTriangle, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCommission } from '../../context/CommissionContext';
import { CrateTypesSettings } from './Settings/CrateTypesSettings';
import { PaymentMethodsSettings } from './Settings/PaymentMethodsSettings';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';

export const SystemSettings: React.FC = () => {
  const { commissionSettings, refreshCommissionSettings } = useCommission();
  const { settings: platformSettings, loading: platformLoading, updateSetting: updatePlatformSetting } = usePlatformSettings();
  const [guideToggles, setGuideToggles] = useState({
    guide_client_enabled: true,
    guide_supplier_enabled: true,
    guide_admin_enabled: true,
  });
  const [guideSaving, setGuideSaving] = useState<string | null>(null);
  const [guideSaveStatus, setGuideSaveStatus] = useState<Record<string, 'success' | 'error' | null>>({});

  useEffect(() => {
    if (!platformLoading) {
      setGuideToggles({
        guide_client_enabled: platformSettings.guide_client_enabled,
        guide_supplier_enabled: platformSettings.guide_supplier_enabled,
        guide_admin_enabled: platformSettings.guide_admin_enabled,
      });
    }
  }, [platformSettings, platformLoading]);

  const handleGuideToggle = async (key: 'guide_client_enabled' | 'guide_supplier_enabled' | 'guide_admin_enabled', value: boolean) => {
    setGuideToggles(prev => ({ ...prev, [key]: value }));
    setGuideSaving(key);
    setGuideSaveStatus(prev => ({ ...prev, [key]: null }));

    const success = await updatePlatformSetting(key, value);
    setGuideSaveStatus(prev => ({ ...prev, [key]: success ? 'success' : 'error' }));
    setGuideSaving(null);

    if (!success) {
      setGuideToggles(prev => ({ ...prev, [key]: !value }));
    } else {
      setTimeout(() => setGuideSaveStatus(prev => ({ ...prev, [key]: null })), 2000);
    }
  };

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

        <PaymentMethodsSettings />

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

        {/* Guide Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-orange-600" />
            Affichage du Mode Opératoire
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Contrôle la visibilité de la page "Mode Opératoire" dans le menu de chaque interface.
            Désactiver un guide le masque immédiatement pour tous les utilisateurs concernés.
          </p>

          <div className="space-y-4">
            {[
              {
                key: 'guide_client_enabled' as const,
                label: 'Interface Client',
                description: 'Page "Mode Opératoire" visible dans le menu des clients',
                color: 'orange',
              },
              {
                key: 'guide_supplier_enabled' as const,
                label: 'Interface Fournisseur',
                description: 'Page "Mode Opératoire" visible dans le menu des fournisseurs',
                color: 'emerald',
              },
              {
                key: 'guide_admin_enabled' as const,
                label: 'Interface Admin',
                description: 'Page "Mode Opératoire" visible dans le menu des administrateurs',
                color: 'slate',
              },
            ].map(({ key, label, description, color }) => {
              const isEnabled = guideToggles[key];
              const isSavingThis = guideSaving === key;
              const status = guideSaveStatus[key];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    isEnabled
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isEnabled ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                      <BookOpen className={`h-4 w-4 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{label}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isEnabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isEnabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    {isSavingThis && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-400 border-t-transparent" />
                    )}
                    {status === 'success' && !isSavingThis && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {status === 'error' && !isSavingThis && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        disabled={isSavingThis || platformLoading}
                        onChange={(e) => handleGuideToggle(key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-gray-400 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
            La modification prend effet immédiatement. Les utilisateurs actuellement connectés verront le changement au prochain rechargement de leur menu.
          </p>
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