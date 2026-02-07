import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, AlertTriangle, Save, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

interface PaymentMethodRow {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  phone_number: string | null;
  bank_name: string | null;
  iban: string | null;
  account_holder: string | null;
  instructions: string | null;
  icon: string | null;
  display_order: number;
}

type EditableFields = Pick<
  PaymentMethodRow,
  'is_active' | 'phone_number' | 'bank_name' | 'iban' | 'account_holder' | 'instructions'
>;

const METHOD_VISUAL: Record<string, { bgColor: string; textColor: string; letter: string }> = {
  wave: { bgColor: 'bg-blue-100', textColor: 'text-blue-600', letter: 'W' },
  orange_money: { bgColor: 'bg-orange-100', textColor: 'text-orange-600', letter: 'O' },
  mtn_money: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-600', letter: 'M' },
  bank_transfer: { bgColor: 'bg-teal-100', textColor: 'text-teal-600', letter: 'B' },
  cash: { bgColor: 'bg-green-100', textColor: 'text-green-600', letter: 'F' },
};

const MOBILE_MONEY_NAMES = ['wave', 'orange_money', 'mtn_money'];

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
  </label>
);

export const PaymentMethodsSettings: React.FC = () => {
  const { showToast } = useToast();
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [editedFields, setEditedFields] = useState<Record<string, Partial<EditableFields>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges = Object.keys(editedFields).length > 0;

  const loadMethods = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setMethods(data || []);
      setEditedFields({});
    } catch (err) {
      console.error('Error loading payment methods:', err);
      showToast('Erreur lors du chargement des moyens de paiement', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const updateField = (methodId: string, field: keyof EditableFields, value: string | boolean | null) => {
    const method = methods.find((m) => m.id === methodId);
    if (!method) return;

    const originalValue = method[field];
    const normalizedOriginal = originalValue === null ? '' : originalValue;
    const normalizedNew = value === null ? '' : value;

    setEditedFields((prev) => {
      const current = { ...prev };
      if (!current[methodId]) current[methodId] = {};
      if (normalizedOriginal === normalizedNew) {
        delete current[methodId][field];
        if (Object.keys(current[methodId]).length === 0) delete current[methodId];
      } else {
        current[methodId][field] = value as never;
      }
      return current;
    });
  };

  const getFieldValue = <K extends keyof EditableFields>(
    method: PaymentMethodRow,
    field: K
  ): EditableFields[K] => {
    const edited = editedFields[method.id];
    if (edited && field in edited) return edited[field] as EditableFields[K];
    return method[field];
  };

  const handleSave = async () => {
    const changedIds = Object.keys(editedFields);
    if (changedIds.length === 0) return;

    setSaving(true);
    try {
      for (const methodId of changedIds) {
        const changes = editedFields[methodId];
        const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if ('is_active' in changes) updatePayload.is_active = changes.is_active;
        if ('phone_number' in changes) updatePayload.phone_number = changes.phone_number || null;
        if ('bank_name' in changes) updatePayload.bank_name = changes.bank_name || null;
        if ('iban' in changes) updatePayload.iban = changes.iban || null;
        if ('account_holder' in changes) updatePayload.account_holder = changes.account_holder || null;
        if ('instructions' in changes) updatePayload.instructions = changes.instructions || null;

        const { error } = await supabase
          .from('payment_methods')
          .update(updatePayload)
          .eq('id', methodId);

        if (error) throw error;
      }

      showToast('Moyens de paiement sauvegardés', 'success');
      await loadMethods();
    } catch (err) {
      console.error('Error saving payment methods:', err);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderMethodCard = (method: PaymentMethodRow) => {
    const visual = METHOD_VISUAL[method.name] || { bgColor: 'bg-gray-100', textColor: 'text-gray-600', letter: '?' };
    const isActive = getFieldValue(method, 'is_active') as boolean;
    const isMobileMoney = MOBILE_MONEY_NAMES.includes(method.name);
    const isBankTransfer = method.name === 'bank_transfer';
    const isCash = method.name === 'cash';

    return (
      <div
        key={method.id}
        className={`border border-gray-200 rounded-lg p-4 transition-opacity ${!isActive ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 ${visual.bgColor} rounded-full flex items-center justify-center`}>
              <span className={`${visual.textColor} font-bold`}>{visual.letter}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 block">{method.display_name}</span>
              <span className="text-xs text-gray-600">
                {isMobileMoney ? 'Transfert mobile' : isBankTransfer ? 'Virement bancaire' : 'Paiement en liquide'}
              </span>
            </div>
          </div>
          {isCash ? (
            <Toggle checked={true} onChange={() => {}} disabled />
          ) : (
            <Toggle
              checked={isActive}
              onChange={(v) => updateField(method.id, 'is_active', v)}
            />
          )}
        </div>

        {isMobileMoney && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero de telephone</label>
              <input
                type="tel"
                value={(getFieldValue(method, 'phone_number') as string) || ''}
                onChange={(e) => updateField(method.id, 'phone_number', e.target.value)}
                placeholder="+225 07 XX XX XX XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
              <input
                type="text"
                value={(getFieldValue(method, 'account_holder') as string) || ''}
                onChange={(e) => updateField(method.id, 'account_holder', e.target.value)}
                placeholder="Ex: RAVITO CI"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        )}

        {isBankTransfer && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la banque</label>
                <input
                  type="text"
                  value={(getFieldValue(method, 'bank_name') as string) || ''}
                  onChange={(e) => updateField(method.id, 'bank_name', e.target.value)}
                  placeholder="Ex: SGBCI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulaire du compte</label>
                <input
                  type="text"
                  value={(getFieldValue(method, 'account_holder') as string) || ''}
                  onChange={(e) => updateField(method.id, 'account_holder', e.target.value)}
                  placeholder="Ex: RAVITO SARL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
              <input
                type="text"
                value={(getFieldValue(method, 'iban') as string) || ''}
                onChange={(e) => updateField(method.id, 'iban', e.target.value)}
                placeholder="CI93 0000 0000 0000 0000 0000 000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
              />
            </div>
          </div>
        )}

        {isCash && (
          <p className="text-xs text-gray-600 mt-1">
            Les paiements en especes sont toujours acceptes et doivent etre valides manuellement.
          </p>
        )}

        {(isMobileMoney || isBankTransfer) && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optionnel)</label>
            <textarea
              rows={2}
              value={(getFieldValue(method, 'instructions') as string) || ''}
              onChange={(e) => updateField(method.id, 'instructions', e.target.value)}
              placeholder="Instructions pour le client..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        )}

        {isCash && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optionnel)</label>
            <textarea
              rows={2}
              value={(getFieldValue(method, 'instructions') as string) || ''}
              onChange={(e) => updateField(method.id, 'instructions', e.target.value)}
              placeholder="Ex: Se presenter au bureau Ravito muni du recu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
          Moyens de paiement
        </h3>
        <div className="flex items-center justify-center py-8 gap-3">
          <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
          <span className="text-gray-500">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
          Moyens de paiement
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadMethods}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Rafraichir"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-orange-900 mb-1">Section sensible</p>
            <p className="text-sm text-orange-800">
              Les coordonnees configurees ici seront affichees aux utilisateurs lors du paiement de leur abonnement.
              Assurez-vous que ces informations sont correctes.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {methods.map(renderMethodCard)}
      </div>
    </div>
  );
};
