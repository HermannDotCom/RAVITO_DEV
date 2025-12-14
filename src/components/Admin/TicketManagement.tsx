import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Search, Eye, Clock, AlertCircle, CheckCircle, X, Send, User, Calendar, Tag, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ticketService,
  SupportTicket,
  TicketMessage,
  TicketStats,
  TicketStatus
} from '../../services/ticketService';

export const TicketManagement: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus>('open');

  // Track if we've loaded tickets at least once
  const hasLoadedRef = useRef(false);

  const loadTickets = useCallback(async () => {
    // Only show loader on initial load
    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }
    
    try {
      const data = await ticketService.getAllTickets();
      setTickets(data);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    const data = await ticketService.getTicketStats();
    setStats(data);
  }, []);

  const filterTickets = useCallback(() => {
    let filtered = [...tickets];

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [loadTickets, loadStats]);

  useEffect(() => {
    filterTickets();
  }, [filterTickets]);

  useEffect(() => {
    if (selectedTicket) {
      loadTicketMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTicketMessages = async (ticketId: string) => {
    const messages = await ticketService.getTicketMessages(ticketId);
    setTicketMessages(messages);
  };

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    if (!user) return;
    const success = await ticketService.updateTicketStatus(ticketId, status, user.id);
    if (success) {
      loadTickets();
      loadStats();
      if (selectedTicket?.id === ticketId) {
        const updated = await ticketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
    }
  };

  const handleAssignToMe = async (ticketId: string) => {
    if (!user) return;
    const success = await ticketService.assignTicket(ticketId, user.id);
    if (success) {
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        const updated = await ticketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
      alert('Ticket assigné avec succès');
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    const success = await ticketService.addTicketMessage(
      selectedTicket.id,
      user.id,
      newMessage,
      isInternalNote
    );

    if (success) {
      setNewMessage('');
      setIsInternalNote(false);
      loadTicketMessages(selectedTicket.id);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <button
          onClick={() => setSelectedTicket(null)}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <X className="h-5 w-5" />
          <span>Retour aux tickets</span>
        </button>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.subject}</h2>
                  <p className="text-gray-600">Ticket #{selectedTicket.ticket_number}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${ticketService.getPriorityColor(selectedTicket.priority)}`}>
                    {ticketService.getPriorityLabel(selectedTicket.priority)}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${ticketService.getStatusColor(selectedTicket.status)}`}>
                    {ticketService.getStatusLabel(selectedTicket.status)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-700">{selectedTicket.message}</p>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Catégorie:</span>
                  <p className="font-medium text-gray-900">{ticketService.getCategoryLabel(selectedTicket.category)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Créé le:</span>
                  <p className="font-medium text-gray-900">{formatDate(selectedTicket.created_at)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Demandeur:</span>
                  <p className="font-medium text-gray-900">{selectedTicket.user_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium text-gray-900">{selectedTicket.user_email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Messages</h3>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {ticketMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-4 ${
                      msg.is_internal
                        ? 'bg-yellow-50 border-l-4 border-yellow-500'
                        : msg.user_role === 'admin'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-gray-50 border-l-4 border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{msg.user_name}</span>
                        {msg.is_internal && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-200 text-yellow-800">
                            Note interne
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(msg.created_at)}</span>
                    </div>
                    <p className="text-gray-700">{msg.message}</p>
                  </div>
                ))}
              </div>

              {selectedTicket.status !== 'closed' && (
                <div className="border-t pt-4">
                  <div className="mb-3">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded"
                      />
                      <span>Note interne (non visible par le client)</span>
                    </label>
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    placeholder={isInternalNote ? 'Note interne...' : 'Votre réponse...'}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="mt-3 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isInternalNote ? 'Ajouter la note' : 'Envoyer'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>

              <div className="space-y-3">
                {!selectedTicket.assigned_to && (
                  <button
                    onClick={() => handleAssignToMe(selectedTicket.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    M'assigner ce ticket
                  </button>
                )}

                {selectedTicket.assigned_to && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Assigné à:</p>
                    <p className="font-medium text-gray-900">{selectedTicket.assigned_admin_name || 'Admin'}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Changer le statut
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                  >
                    <option value="open">Ouvert</option>
                    <option value="in_progress">En cours</option>
                    <option value="waiting_response">En attente de réponse</option>
                    <option value="resolved">Résolu</option>
                    <option value="closed">Fermé</option>
                  </select>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, newStatus)}
                    disabled={newStatus === selectedTicket.status}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Mettre à jour
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Dernière mise à jour</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedTicket.updated_at)}</p>
                </div>
                {selectedTicket.resolved_at && (
                  <div>
                    <p className="text-gray-600">Résolu le</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedTicket.resolved_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Tickets</h1>
          <p className="text-gray-600">Gérez les demandes de support des clients et fournisseurs</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">{stats.total}</p>
                </div>
                <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Ouverts</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">{stats.open}</p>
                </div>
                <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">En cours</p>
                  <p className="text-3xl font-bold text-orange-700 mt-1">{stats.in_progress}</p>
                </div>
                <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">En attente</p>
                  <p className="text-3xl font-bold text-yellow-700 mt-1">{stats.waiting_response}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-200 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Résolus</p>
                  <p className="text-3xl font-bold text-gray-700 mt-1">{stats.resolved}</p>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher par numéro, sujet ou utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="open">Ouvert</option>
              <option value="in_progress">En cours</option>
              <option value="waiting_response">En attente</option>
              <option value="resolved">Résolu</option>
              <option value="closed">Fermé</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Tickets ({filteredTickets.length})
          </h2>

          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun ticket trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ticketService.getStatusColor(ticket.status)}`}>
                        {ticketService.getStatusLabel(ticket.status)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ticketService.getPriorityColor(ticket.priority)}`}>
                        {ticketService.getPriorityLabel(ticket.priority)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Tag className="h-3 w-3" />
                        <span>#{ticket.ticket_number}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{ticket.user_name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(ticket.created_at)}</span>
                      </span>
                      {ticket.assigned_to && (
                        <span className="text-blue-600">Assigné</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Voir</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
