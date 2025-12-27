/**
 * Example usage of LocationPicker component
 * 
 * This file demonstrates how to use the LocationPicker component
 * in different scenarios (Profile page, Checkout page, Read-only view)
 */

import React, { useState } from 'react';
import { LocationPicker } from '../components/Shared/LocationPicker';
import { DeliveryLocation } from '../types';

/**
 * Example 1: Profile Page - Set Default Delivery Address
 */
export const ProfileLocationExample = () => {
  const [location, setLocation] = useState<DeliveryLocation>({
    latitude: null,
    longitude: null,
    address: '',
    instructions: null
  });

  const handleLocationChange = (newLocation: {
    latitude: number;
    longitude: number;
    address: string;
    instructions: string;
  }) => {
    setLocation({
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      address: newLocation.address,
      instructions: newLocation.instructions || null
    });

    // Here you would save to database
    console.log('Saving to profile:', newLocation);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Mon Adresse de Livraison</h2>
      
      <LocationPicker
        initialLatitude={location.latitude}
        initialLongitude={location.longitude}
        initialAddress={location.address}
        initialInstructions={location.instructions || ''}
        onLocationChange={handleLocationChange}
        showSearchBar={true}
        showGpsButton={true}
        showInstructions={true}
        height="400px"
      />
      
      <button 
        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        onClick={() => console.log('Save location:', location)}
      >
        Enregistrer l'adresse
      </button>
    </div>
  );
};

/**
 * Example 2: Checkout Page - Temporary Address for Order
 */
export const CheckoutLocationExample = () => {
  const [location, setLocation] = useState<DeliveryLocation>({
    latitude: null,
    longitude: null,
    address: '',
    instructions: null
  });

  const handleLocationChange = (newLocation: {
    latitude: number;
    longitude: number;
    address: string;
    instructions: string;
  }) => {
    setLocation({
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      address: newLocation.address,
      instructions: newLocation.instructions || null
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Adresse de Livraison pour cette Commande</h2>
      
      <LocationPicker
        initialLatitude={location.latitude}
        initialLongitude={location.longitude}
        initialAddress={location.address}
        initialInstructions={location.instructions || ''}
        onLocationChange={handleLocationChange}
        showSearchBar={true}
        showGpsButton={true}
        showInstructions={true}
        height="350px"
      />
      
      <button 
        className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
        onClick={() => console.log('Proceed with order:', location)}
      >
        Continuer la commande
      </button>
    </div>
  );
};

/**
 * Example 3: Read-only View - Display Order Location
 */
export const OrderLocationViewExample = () => {
  // This would come from order data
  const orderLocation = {
    latitude: 5.3600,
    longitude: -4.0083,
    address: 'Abidjan, Cocody, Côte d\'Ivoire',
    instructions: 'Porte jaune, derrière la boutique bleue'
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Adresse de Livraison</h2>
      
      <LocationPicker
        initialLatitude={orderLocation.latitude}
        initialLongitude={orderLocation.longitude}
        initialAddress={orderLocation.address}
        initialInstructions={orderLocation.instructions}
        onLocationChange={() => {}} // No-op in read-only mode
        readOnly={true}
        showSearchBar={false}
        showGpsButton={false}
        showInstructions={true}
        height="300px"
      />
    </div>
  );
};

/**
 * Example 4: Minimal Configuration
 */
export const MinimalLocationExample = () => {
  const handleLocationChange = (newLocation: {
    latitude: number;
    longitude: number;
    address: string;
    instructions: string;
  }) => {
    console.log('Location changed:', newLocation);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Choisir une Position</h2>
      
      <LocationPicker
        onLocationChange={handleLocationChange}
        height="400px"
      />
    </div>
  );
};
