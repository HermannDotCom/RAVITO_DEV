import React, { useState } from 'react';
import { Phone, MapPin, Clock, User, CheckCircle, MessageCircle, Edit3, Save } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { getSupplierById } from '../../data/mockSuppliers';
import { useAuth } from '../../context/AuthContext';
import { Client } from '../../types';

interface ContactExchangeProps {
  onContinue: () => void;
}

export const ContactExchange: React.FC<ContactExchangeProps> = ({ onContinue }) => {
  const { user } = useAuth();
  const { updateDeliveryTime, supplierOffer, clientCurrentOrder } = useOrder();
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newEstimatedTime, setNewEstimatedTime] = useState(supplierOffer?.estimatedTime || 25);
  
  if (!clientCurrentOrder || !supplierOffer) {
    return null;
  }
  
  const supplier = getSupplierById(supplierOffer.supplierId);
  if (!supplier) {
    return null;
  }

  const supplierInfo = supplier;
  const clientInfo = user as Client;

  if (!clientInfo) {
    return null;
  }

  const handleUpdateTime = () => {
    updateDeliveryTime(newEstimatedTime);
    setIsEditingTime(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h2>
            <p className="text-gray-600">Voici les coordonnées pour votre livraison</p>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Commande confirmée et payée</p>
                <p className="text-sm text-green-700">
                  La livraison va commencer dans quelques minutes
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-orange-600" />
              Votre fournisseur
            </h3>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {supplierInfo.businessName.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{supplierInfo.businessName}</h4>
                <p className="text-sm text-gray-600">Contact: {supplierInfo.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900 font-medium">{supplierInfo.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                {isEditingTime ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={newEstimatedTime}
                      onChange={(e) => setNewEstimatedTime(parseInt(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      min="5"
                      max="60"
                    />
                    <span className="text-gray-600">min</span>
                    <button
                      onClick={handleUpdateTime}
                      className="p-1 text-green-600 hover:text-green-700"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900">Livraison: ~{supplierOffer?.estimatedTime || supplierInfo.estimatedTime} min</span>
                    <button
                      onClick={() => setIsEditingTime(true)}
                      className="p-1 text-orange-600 hover:text-orange-700"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{supplierInfo.address}</span>
              </div>
            </div>
          </div>

          {/* Client Information Shared */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Vos coordonnées partagées avec le fournisseur :</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Établissement :</strong> {clientInfo.businessName}</p>
              <p><strong>Contact :</strong> {clientInfo.name}</p>
              <p><strong>Téléphone :</strong> {clientInfo.phone}</p>
              <p><strong>Adresse :</strong> {clientInfo.address}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <MessageCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">Instructions importantes :</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Le fournisseur va vous contacter pour confirmer la livraison</li>
                  <li>Préparez les casiers vides si vous en avez à rendre</li>
                  <li>Restez disponible à l'adresse de livraison</li>
                  <li>Le fournisseur vous contactera à son arrivée</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            Suivre ma livraison
          </button>
        </div>
      </div>
    </div>
  );
};