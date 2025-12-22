import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Zone } from '../../types';

interface NightGuardSettingsProps {
  zones: Zone[];
}

interface ScheduleData {
  id?: string;
  date: string;
  is_active: boolean;
  covered_zones: string[];
}

export const NightGuardSettings: React.FC<NightGuardSettingsProps> = ({ zones }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (user?.id) {
      fetchSchedule();
    }
  }, [user?.id]);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('night_guard_schedule')
        .select('*')
        .eq('supplier_id', user!.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSchedule(data);
        setSelectedZones(data.covered_zones || []);
      } else {
        setSchedule(null);
        setSelectedZones([]);
      }
    } catch (error) {
      console.error('Error fetching night guard schedule:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger le planning de garde de nuit.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoneToggle = (zoneId: string) => {
    setSelectedZones(prev =>
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  const handleSave = async () => {
    if (!user?.id || selectedZones.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins une zone couverte.",
        variant: "warning",
      });
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave: ScheduleData = {
        supplier_id: user.id,
        date: today,
        is_active: true,
        covered_zones: selectedZones,
      };

      let result;
      if (schedule?.id) {
        // Update existing schedule
        result = await supabase
          .from('night_guard_schedule')
          .update(dataToSave)
          .eq('id', schedule.id)
          .select()
          .single();
      } else {
        // Insert new schedule
        result = await supabase
          .from('night_guard_schedule')
          .insert([dataToSave])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setSchedule(result.data);
      toast({
        title: "Succès",
        description: "Votre planning de garde de nuit a été enregistré.",
      });
    } catch (error) {
      console.error('Error saving night guard schedule:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Une erreur est survenue lors de l'enregistrement du planning.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!schedule?.id) return;

    setIsSaving(true);
    try {
      const newActiveState = !schedule.is_active;
      const { data, error } = await supabase
        .from('night_guard_schedule')
        .update({ is_active: newActiveState })
        .eq('id', schedule.id)
        .select()
        .single();

      if (error) throw error;

      setSchedule(data);
      toast({
        title: "Statut mis à jour",
        description: newActiveState ? "Vous êtes maintenant en garde de nuit." : "Vous avez quitté la garde de nuit.",
      });
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast({
        title: "Erreur",
        description: "Impossible de changer le statut de la garde.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const activeZonesNames = selectedZones.map(id => zones.find(z => z.id === id)?.name).filter(Boolean);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Clock className="h-6 w-6 text-orange-500" />
          Garde de Nuit RAVITO
        </h2>
        {schedule?.id && (
          <button
            onClick={handleToggleActive}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              schedule.is_active
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : schedule.is_active ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {schedule.is_active ? 'Quitter la Garde' : 'Activer la Garde'}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Statut Actuel */}
        <div className="p-4 rounded-lg border-l-4 border-orange-500 bg-orange-50">
          <p className="text-sm font-medium text-orange-900 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Planning pour le : <span className="font-bold">{new Date(today).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </p>
          <p className={`mt-1 text-lg font-semibold flex items-center gap-2 ${schedule?.is_active ? 'text-green-600' : 'text-red-600'}`}>
            Statut : {schedule?.is_active ? 'Actif' : 'Inactif'}
          </p>
        </div>

        {/* Sélection des Zones */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            Zones Couvertes (Minimum 1)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {zones.map(zone => (
              <button
                key={zone.id}
                onClick={() => handleZoneToggle(zone.id)}
                className={`flex items-center justify-center px-4 py-2 rounded-full border transition-all text-sm ${
                  selectedZones.includes(zone.id)
                    ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {zone.name}
              </button>
            ))}
          </div>
          {selectedZones.length === 0 && (
            <p className="text-sm text-red-500 mt-2">Veuillez sélectionner au moins une zone.</p>
          )}
        </div>

        {/* Récapitulatif et Sauvegarde */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-3">
            Zones sélectionnées : <span className="font-medium">{activeZonesNames.join(', ') || 'Aucune'}</span>
          </p>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedZones.length === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {schedule?.id ? 'Mettre à jour le Planning' : 'Enregistrer et Activer la Garde'}
          </button>
        </div>
      </div>
    </div>
  );
};
