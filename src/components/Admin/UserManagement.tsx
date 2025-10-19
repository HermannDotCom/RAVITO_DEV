import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, CheckCircle, XCircle, Star, Phone, MapPin, X, Calendar, AlertTriangle, Mail, Shield } from 'lucide-react';
import { User, UserRole } from '../../types';
import { supabase } from '../../lib/supabase';
import { UserExaminationModal } from './UserExaminationModal';

interface PendingUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  businessName?: string;
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [examinedUser, setExaminedUser] = useState<PendingUser | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Loading users...');

      const { data: approvedData, error: approvedError } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false});

      if (approvedError) {
        console.error('Error loading approved users:', approvedError);
        throw approvedError;
      }

      console.log('Approved users:', approvedData);

      const mappedUsers: User[] = (approvedData || []).map(profile => {
        return {
          id: profile.id,
          email: profile.email || '',
          role: profile.role as UserRole,
          name: profile.name,
          phone: profile.phone || '',
          address: profile.address || '',
          rating: 0,
          totalOrders: 0,
          isActive: true,
          createdAt: new Date(profile.created_at)
        };
      });

      setUsers(mappedUsers);

      const { data: pendingData, error: pendingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('Error loading pending users:', pendingError);
        throw pendingError;
      }

      console.log('Pending users:', pendingData);

      const mappedPending: PendingUser[] = (pendingData || []).map(profile => {
        return {
          id: profile.id,
          email: profile.email || '',
          role: profile.role as UserRole,
          name: profile.name,
          phone: profile.phone || '',
          address: profile.address || '',
          businessName: (profile as any).business_name || profile.name,
          created_at: profile.created_at,
          approval_status: profile.approval_status
        };
      });

      setPendingUsers(mappedPending);
      console.log('Users loaded successfully');
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Erreur lors du chargement des utilisateurs. Vérifiez la console pour plus de détails.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredPendingUsers = pendingUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleApproveUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          is_approved: true,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      setExaminedUser(null);
      alert('✅ Utilisateur approuvé avec succès!');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('❌ Erreur lors de l\'approbation de l\'utilisateur');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectUser = async (userId: string, reason: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'rejected',
          is_approved: false,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      setExaminedUser(null);
      alert(`❌ Demande rejetée.\n\nRaison: ${reason}`);
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('❌ Erreur lors du rejet de l\'utilisateur');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const action = user.isActive ? 'désactiver' : 'activer';
    const confirmMessage = `Êtes-vous sûr de vouloir ${action} l'utilisateur "${user.name}" ?`;

    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      ));

      const statusText = user.isActive ? 'désactivé' : 'activé';
      alert(`✅ Utilisateur "${user.name}" ${statusText} avec succès!`);
    } finally {
      setIsProcessing(false);
    }
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

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const totalActiveUsers = users.filter(u => u.isActive).length;
  const totalClients = users.filter(u => u.role === 'client').length;
  const totalSuppliers = users.filter(u => u.role === 'supplier').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h1>
          <p className="text-gray-600">Gérez les comptes utilisateurs et validez les nouvelles demandes</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">En attente</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">{pendingUsers.length}</p>
              </div>
              <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Clients</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{totalClients}</p>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Fournisseurs</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{totalSuppliers}</p>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Actifs</p>
                <p className="text-3xl font-bold text-purple-700 mt-1">{totalActiveUsers}</p>
              </div>
              <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex space-x-4 p-4">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                En attente d'approbation ({pendingUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Utilisateurs approuvés ({users.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Tous les rôles</option>
                <option value="client">Clients</option>
                <option value="supplier">Fournisseurs</option>
                <option value="admin">Administrateurs</option>
              </select>
              {activeTab === 'approved' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              )}
            </div>

            {activeTab === 'pending' ? (
              <div className="space-y-4">
                {filteredPendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucune demande en attente</p>
                  </div>
                ) : (
                  filteredPendingUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.businessName || user.name}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                            <span className="text-sm text-gray-600">{user.email}</span>
                            <span className="text-sm text-gray-500">Demandé le {formatDate(user.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setExaminedUser(user)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Examiner</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucun utilisateur trouvé</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {user.isActive ? 'Actif' : 'Inactif'}
                            </span>
                            <span className="text-sm text-gray-600">{user.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={isProcessing}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                            user.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {user.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {examinedUser && (
        <UserExaminationModal
          user={examinedUser}
          onClose={() => setExaminedUser(null)}
          onApprove={handleApproveUser}
          onReject={handleRejectUser}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};
