import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, CheckCircle, XCircle, Star, Phone, MapPin, X, Calendar, Building, Clock, CreditCard, AlertTriangle, Mail, FileText, Shield } from 'lucide-react';
import { User, UserRole } from '../../types';
import { pendingApprovalAccounts, demoAccounts } from '../../data/demoAccounts';

interface PendingUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  businessName: string;
  submittedAt: Date;
  documents?: {
    idCard?: string;
    businessLicense?: string;
    addressProof?: string;
  };
  verificationStatus: {
    phone: boolean;
    email: boolean;
    documents: boolean;
    address: boolean;
  };
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-1',
      email: 'maquis.bellevue@email.com',
      role: 'client',
      name: 'Jean Dupont',
      phone: '+225 07 12 34 56 78',
      address: 'Cocody, Abidjan',
      coordinates: { lat: 5.3364, lng: -4.0267 },
      rating: 4.5,
      totalOrders: 23,
      isActive: true,
      createdAt: new Date('2024-11-15')
    },
    {
      id: 'user-2',
      email: 'depot.plateau@email.com',
      role: 'supplier',
      name: 'Amadou Diallo',
      phone: '+225 05 44 33 22 11',
      address: 'Plateau, Abidjan',
      coordinates: { lat: 5.3267, lng: -4.0305 },
      rating: 4.7,
      totalOrders: 156,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date('2024-10-20')
    },
    {
      id: 'user-3',
      email: 'bar.central@email.com',
      role: 'client',
      name: 'Marie Kouassi',
      phone: '+225 01 23 45 67 89',
      address: 'Treichville, Abidjan',
      rating: 4.2,
      totalOrders: 8,
      isActive: false,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date('2024-12-01')
    },
    {
      id: 'user-4',
      email: 'depot.cocody@email.com',
      role: 'supplier',
      name: 'Ibrahim Touré',
      phone: '+225 07 88 99 00 11',
      address: 'Cocody, Abidjan',
      rating: 4.8,
      totalOrders: 203,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date('2024-09-10')
    },
    {
      id: 'user-5',
      email: 'maquis.lauriers@email.com',
      role: 'client',
      name: 'Fatou Bamba',
      phone: '+225 05 66 77 88 99',
      address: 'Marcory, Abidjan',
      rating: 4.6,
      totalOrders: 45,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date('2024-08-25')
    }
  ]);

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([
    {
      id: 'pending-1',
      email: 'nouveau.depot@email.com',
      role: 'supplier',
      name: 'Nouveau Depot',
      phone: '+225 07 12 34 56 78',
      address: 'Cocody, Abidjan',
      businessName: 'Nouveau Depot',
      submittedAt: new Date('2024-12-01'),
      verificationStatus: {
        phone: true,
        email: true,
        documents: false,
        address: true
      }
    }
  ]);

  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [examinedUser, setExaminedUser] = useState<PendingUser | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    // Load approved users from localStorage
    const storedUsers = localStorage.getItem('distri-night-users');
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }));
      setUsers(parsedUsers);
    }

    // Load pending users from localStorage, or use demo accounts if none exist
    const storedPendingUsers = localStorage.getItem('distri-night-pending-users');
    if (storedPendingUsers) {
      const parsedPendingUsers = JSON.parse(storedPendingUsers).map((user: any) => ({
        ...user,
        submittedAt: new Date(user.submittedAt)
      }));
      setPendingUsers(parsedPendingUsers);
    } else {
      // Initialize with demo pending accounts if no stored data
      const demoPendingUsers = pendingApprovalAccounts.map(account => ({
        id: account.id,
        email: account.email,
        role: account.role,
        name: account.name,
        phone: account.userData.phone,
        address: account.userData.address,
        businessName: (account.userData as any).businessName || account.name,
        submittedAt: account.userData.createdAt,
        verificationStatus: {
          phone: true,
          email: true,
          documents: Math.random() > 0.5,
          address: true
        }
      }));
      setPendingUsers(demoPendingUsers);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('distri-night-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('distri-night-pending-users', JSON.stringify(pendingUsers));
  }, [pendingUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleApproveUser = async (userId: string) => {
    const pendingUser = pendingUsers.find(u => u.id === userId);
    if (!pendingUser) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newApprovedUser: User = {
      id: pendingUser.id,
      email: pendingUser.email,
      role: pendingUser.role,
      name: pendingUser.name,
      phone: pendingUser.phone,
      address: pendingUser.address,
      coordinates: { lat: 5.3364, lng: -4.0267 },
      rating: 5.0,
      totalOrders: 0,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      createdAt: new Date()
    };

    setUsers(prev => [...prev, newApprovedUser]);
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    setExaminedUser(null);
    setIsProcessing(false);

    alert(`✅ ${pendingUser.businessName} a été approuvé et activé avec succès!\n\nL'utilisateur a reçu une notification de confirmation et peut maintenant accéder à la plateforme.`);
  };

  const handleRejectUser = async (userId: string, reason: string) => {
    const pendingUser = pendingUsers.find(u => u.id === userId);
    if (!pendingUser) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    setExaminedUser(null);
    setIsProcessing(false);

    alert(`❌ Demande de ${pendingUser.businessName} rejetée.\n\nRaison(s): ${reason}\n\nUne notification a été envoyée au demandeur avec les éléments à corriger pour une nouvelle demande.`);
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const action = user.isActive ? 'désactiver' : 'activer';
    const confirmMessage = `Êtes-vous sûr de vouloir ${action} l'utilisateur "${user.name}" ?`;

    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));

    setIsProcessing(false);

    const statusText = user.isActive ? 'désactivé' : 'activé';
    alert(`✅ Utilisateur "${user.name}" ${statusText} avec succès!`);
  };

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      client: 'Client',
      supplier: 'Fournisseur',
      admin: 'Administrateur'
    };
    return labels[role];
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      client: 'bg-blue-100 text-blue-700',
      supplier: 'bg-green-100 text-green-700',
      admin: 'bg-purple-100 text-purple-700'
    };
    return colors[role];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getVerificationScore = (status: PendingUser['verificationStatus']) => {
    const total = Object.keys(status).length;
    const verified = Object.values(status).filter(Boolean).length;
    return Math.round((verified / total) * 100);
  };

  // Calculate summary stats
  const totalActiveUsers = users.filter(u => u.isActive).length;
  const totalClients = users.filter(u => u.role === 'client').length;
  const totalSuppliers = users.filter(u => u.role === 'supplier').length;
  const averageRating = users.reduce((sum, user) => sum + (user.rating || 0), 0) / users.length;

  const UserDetailsModal = ({ user, onClose }: { user: User; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Information */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-blue-600" />
                  Informations personnelles
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Téléphone:</span>
                    <span className="font-medium text-gray-900">{user.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adresse:</span>
                    <span className="font-medium text-gray-900">{user.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Membre depuis:</span>
                    <span className="font-medium text-gray-900">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-green-600" />
                  Performances
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">{user.rating?.toFixed(1) || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Note moyenne</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{user.totalOrders || 0}</div>
                    <div className="text-sm text-gray-600">
                      {user.role === 'client' ? 'Commandes' : 'Livraisons'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity & Actions */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Activité récente</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.role === 'client' ? 'Commande passée' : 'Livraison effectuée'}
                        </p>
                        <p className="text-sm text-gray-600">Il y a 2 heures</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Évaluation reçue</p>
                        <p className="text-sm text-gray-600">Il y a 1 jour</p>
                      </div>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">4.8/5</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Actions administratives</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    disabled={isProcessing}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      user.isActive
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {user.isActive ? (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span>Désactiver le compte</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Réactiver le compte</span>
                      </>
                    )}
                  </button>
                  
                  <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Envoyer un message</span>
                  </button>
                  
                  <button className="w-full px-4 py-3 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Voir l'historique complet</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UserExaminationModal = ({ user, onClose, onApprove, onReject }: {
    user: PendingUser;
    onClose: () => void;
    onApprove: (userId: string) => void;
    onReject: (userId: string, reason: string) => void;
  }) => {
    const [selectedRejectReasons, setSelectedRejectReasons] = useState<string[]>([]);
    const [customRejectReason, setCustomRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    const rejectReasons = [
      'Informations de contact incomplètes ou incorrectes',
      'Documents d\'identité manquants ou non valides',
      'Justificatif d\'adresse manquant ou non conforme',
      'Licence commerciale expirée ou non valide',
      'Zone de couverture non autorisée ou trop étendue',
      'Établissement non conforme aux critères DISTRI-NIGHT',
      'Doublon détecté avec un compte existant',
      'Informations commerciales insuffisantes',
      'Moyens de paiement non conformes',
      'Capacité de livraison inadéquate'
    ];

    const toggleRejectReason = (reason: string) => {
      setSelectedRejectReasons(prev => 
        prev.includes(reason)
          ? prev.filter(r => r !== reason)
          : [...prev, reason]
      );
    };

    const handleReject = () => {
      if (selectedRejectReasons.length === 0 && !customRejectReason.trim()) return;
      
      const allReasons = [...selectedRejectReasons];
      if (customRejectReason.trim()) {
        allReasons.push(customRejectReason.trim());
      }
      
      const finalReason = allReasons.join('; ');
      onReject(user.id, finalReason);
    };

    const verificationScore = getVerificationScore(user.verificationStatus);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.businessName}</h2>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Demandé le {formatDate(user.submittedAt)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Contact Information */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-blue-600" />
                  Informations de contact
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Responsable:</span>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Téléphone:</span>
                    <span className="font-medium text-gray-900">{user.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adresse:</span>
                    <span className="font-medium text-gray-900">{user.address}</span>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  État de vérification ({verificationScore}%)
                </h3>
                <div className="space-y-3">
                  {Object.entries(user.verificationStatus).map(([key, verified]) => {
                    const labels = {
                      phone: 'Téléphone vérifié',
                      email: 'Email confirmé',
                      documents: 'Documents fournis',
                      address: 'Adresse vérifiée'
                    };
                    
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-700">{labels[key as keyof typeof labels]}</span>
                        <div className={`flex items-center space-x-1 ${verified ? 'text-green-600' : 'text-red-600'}`}>
                          {verified ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {verified ? 'Vérifié' : 'En attente'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-yellow-900 mb-4">Points de vérification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                    <span className="text-yellow-800">Informations de contact vérifiées</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                    <span className="text-yellow-800">Documents d'identité valides</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                    <span className="text-yellow-800">Adresse confirmée et localisable</span>
                  </label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                    <span className="text-yellow-800">Activité commerciale légitime</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                    <span className="text-yellow-800">Zone de couverture appropriée</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                    <span className="text-yellow-800">Capacité opérationnelle confirmée</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Rejection Form */}
            {showRejectForm && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-bold text-red-900 mb-4">Confirmation du rejet</h4>
                
                <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800 mb-1">Action de rejet</p>
                      <p className="text-red-700">
                        Le demandeur recevra une notification avec les raisons du rejet et sera invité à 
                        fournir les éléments manquants pour une nouvelle demande.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-red-800 mb-3">
                    Sélectionnez les raisons du rejet :
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {rejectReasons.map((reason) => (
                      <label key={reason} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-red-100 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedRejectReasons.includes(reason)}
                          onChange={() => toggleRejectReason(reason)}
                          className="h-4 w-4 text-red-600 mt-0.5 rounded"
                        />
                        <span className="text-sm text-gray-700 flex-1">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison personnalisée ou commentaire détaillé (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    placeholder="Ajoutez des précisions sur les éléments à corriger..."
                  />
                </div>
                
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Notification automatique :</strong> Le demandeur recevra un email et une notification 
                    dans son espace avec les raisons détaillées du rejet et les actions à entreprendre.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {!showRejectForm ? (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Rejeter la demande</span>
                  </button>
                  <button
                    onClick={() => onApprove(user.id)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Approbation...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Approuver et activer</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={selectedRejectReasons.length === 0 && !customRejectReason.trim() || isProcessing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Envoi notification...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span>Confirmer le rejet</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h1>
          <p className="text-gray-600">Administrez les comptes clients et fournisseurs</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Utilisateurs actifs</p>
                <p className="text-2xl font-bold text-green-600">{totalActiveUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Clients</p>
                <p className="text-2xl font-bold text-blue-600">{totalClients}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Fournisseurs</p>
                <p className="text-2xl font-bold text-orange-600">{totalSuppliers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Note moyenne</p>
                <p className="text-2xl font-bold text-yellow-600">{averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Utilisateurs approuvés ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                En attente d'approbation ({pendingUsers.length})
                {pendingUsers.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'approved' ? (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par nom ou email..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="client">Clients</option>
                  <option value="supplier">Fournisseurs</option>
                  <option value="admin">Administrateurs</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun utilisateur trouvé</h3>
                  <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                {getRoleLabel(user.role)}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {user.isActive ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{user.phone}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>{user.address}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span>{user.rating?.toFixed(1) || 'N/A'}/5 ({user.totalOrders || 0})</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewUserDetails(user)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Détails</span>
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            disabled={isProcessing}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              user.isActive
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {user.isActive ? (
                              <>
                                <XCircle className="h-4 w-4" />
                                <span>Désactiver</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Activer</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Pending Users */
          <div className="space-y-6">
            {pendingUsers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune demande en attente</h3>
                <p className="text-gray-500">Les nouvelles demandes d'inscription apparaîtront ici</p>
              </div>
            ) : (
              pendingUsers.map((user) => {
                const verificationScore = getVerificationScore(user.verificationStatus);
                
                return (
                  <div key={user.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{user.businessName}</h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                {getRoleLabel(user.role)}
                              </span>
                              <span className="text-sm text-gray-600">
                                Demandé le {formatDate(user.submittedAt)}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                verificationScore >= 75 ? 'bg-green-100 text-green-700' :
                                verificationScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {verificationScore}% vérifié
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-600">Responsable:</span>
                            <span className="ml-2 font-medium text-gray-900">{user.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2 font-medium text-gray-900">{user.email}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Téléphone:</span>
                            <span className="ml-2 font-medium text-gray-900">{user.phone}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Adresse:</span>
                            <span className="ml-2 font-medium text-gray-900">{user.address}</span>
                          </div>
                        </div>

                        {/* Verification Status */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(user.verificationStatus).map(([key, verified]) => {
                            const labels = {
                              phone: 'Téléphone',
                              email: 'Email',
                              documents: 'Documents',
                              address: 'Adresse'
                            };
                            
                            return (
                              <span
                                key={key}
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {labels[key as keyof typeof labels]} {verified ? '✓' : '✗'}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={() => setExaminedUser(user)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Examiner</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Examination Modal */}
      {examinedUser && (
        <UserExaminationModal
          user={examinedUser}
          onClose={() => setExaminedUser(null)}
          onApprove={handleApproveUser}
          onReject={handleRejectUser}
        />
      )}
    </>
  );
};