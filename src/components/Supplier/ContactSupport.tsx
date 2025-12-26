import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Send, Clock, CheckCircle, X, Eye, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ticketService,
  SupportTicket,
  TicketMessage,
  TicketCategory,
  TicketPriority,
  CreateTicketData
} from '../../services/ticketService';
import { KenteLoader } from '../ui/KenteLoader';

interface SupplierContactSupportProps {
  initialSubject?: string;
  initialCategory?: TicketCategory;
  initialMessage?: string;
  initialPriority?: TicketPriority;
  onClaimDataClear?: () => void;
}

export const SupplierContactSupport: React.FC<SupplierContactSupportProps> = ({
  initialSubject,
  initialCategory,
  initialMessage,
  initialPriority,
  onClaimDataClear
}) => {
  const { user, setSessionError } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateTicketData>({
    subject: initialSubject || '',
    message: initialMessage || '',
    category: initialCategory || 'other',
    priority: initialPriority || 'medium'
  });

  const [newMessage, setNewMessage] = useState('');

  // Extract userId as a stable primitive dependency
  const userId = user?.id;
  
  // Track if we've loaded tickets at least once
  const hasLoadedRef = useRef(false);

  // Handle pre-filled data from claim navigation
  useEffect(() => {
    // Only update form if at least one prop has a meaningful value
    const hasPrefilledData = Boolean(initialSubject || initialMessage);
    if (hasPrefilledData) {
      setFormData({
        subject: initialSubject || '',
        message: initialMessage || '',
        category: initialCategory || 'other',
        priority: initialPriority || 'medium'
      });
      setShowCreateForm(true);
    }
  }, [initialSubject, initialCategory, initialMessage, initialPriority]);

  const loadTickets = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    // Only show loader on initial load
    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }
    
    try {
      const data = await ticketService.getUserTickets(userId);
      setTickets(data);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadTickets();
    }
  }, [userId, loadTickets]);

  useEffect(() => {
    if (selectedTicket) {
      loadTicketMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTicketMessages = async (ticketId: string) => {
    const messages = await ticketService.getTicketMessages(ticketId);
    setTicketMessages(messages);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const result = await ticketService.createTicket(user.id, formData);

    if (result.success && result.ticket) {
      setTickets([result.ticket, ...tickets]);
      setFormData({
        subject: '',
        message: '',
        category: 'other',
        priority: 'medium'
      });
      setShowCreateForm(false);
      // Clear claim data if it was a pre-filled form
      if (onClaimDataClear) {
        onClaimDataClear();
      }
      alert('Ticket créé avec succès!');
    } else {
      // Check if we should trigger session error UI
      if (result.shouldRefresh && result.error) {
        setSessionError(result.error.message);
      }
      alert(result.error?.message || 'Erreur lors de la création du ticket');
    }
    setIsSubmitting(false);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    const success = await ticketService.addTicketMessage(
      selectedTicket.id,
      user.id,
      newMessage
    );

    if (success) {
      setNewMessage('');
      loadTicketMessages(selectedTicket.id);
      await ticketService.updateTicketStatus(selectedTicket.id, 'waiting_response', user.id);
      loadTickets();
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
        <KenteLoader size="md" text="Chargement..." />
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <button
          onClick={() => setSelectedTicket(null)}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <X className="h-5 w-5" />
          <span>Retour aux tickets</span>
        </button>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedTicket.subject}</h2>
              <p className="text-gray-600 mt-1">Ticket #{selectedTicket.ticket_number}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${ticketService.getPriorityColor(selectedTicket.priority)}`}>
                {ticketService.getPriorityLabel(selectedTicket.priority)}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${ticketService.getStatusColor(selectedTicket.status)}`}>
                {ticketService.getStatusLabel(selectedTicket.status)}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Catégorie:</span> {ticketService.getCategoryLabel(selectedTicket.category)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Créé le:</span> {formatDate(selectedTicket.created_at)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Messages
          </h3>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Vous</span>
                <span className="text-xs text-gray-500">{formatDate(selectedTicket.created_at)}</span>
              </div>
              <p className="text-gray-700">{selectedTicket.message}</p>
            </div>

            {ticketMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-4 ${
                  msg.user_id === user?.id
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : 'bg-gray-50 border-l-4 border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {msg.user_id === user?.id ? 'Vous' : msg.user_name || 'Support'}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(msg.created_at)}</span>
                </div>
                <p className="text-gray-700">{msg.message}</p>
              </div>
            ))}
          </div>

          {selectedTicket.status !== 'closed' && (
            <div className="border-t pt-4">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                placeholder="Votre message..."
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="mt-3 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Envoyer</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nous contacter</h1>
        <p className="text-gray-600">Créez un ticket de support ou consultez vos demandes existantes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{tickets.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Ouverts</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">
                {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Résolus</p>
              <p className="text-3xl font-bold text-gray-700 mt-1">
                {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="mb-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Créer un nouveau ticket</span>
        </button>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nouveau ticket</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sujet
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Résumé de votre demande"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="technical">Technique</option>
                  <option value="billing">Facturation</option>
                  <option value="delivery">Livraison</option>
                  <option value="account">Compte</option>
                  <option value="complaint">Réclamation</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                placeholder="Décrivez votre problème en détail..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Création...' : 'Créer le ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mes tickets</h2>

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun ticket pour le moment</p>
            <p className="text-gray-400 text-sm mt-2">Créez un ticket pour contacter le support</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
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
                    <span>#{ticket.ticket_number}</span>
                    <span>{ticketService.getCategoryLabel(ticket.category)}</span>
                    <span>{formatDate(ticket.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium transition-colors flex items-center space-x-2"
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
  );
};
