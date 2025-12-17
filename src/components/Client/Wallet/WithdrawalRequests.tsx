/**
 * Withdrawal Requests Component
 * Displays pending and completed withdrawal requests
 */

import React from 'react';
import { Clock, Check, X, AlertCircle, Calendar, Smartphone, Building2 } from 'lucide-react';
import {
  WithdrawalRequest,
  WITHDRAWAL_STATUS_LABELS,
  WITHDRAWAL_METHOD_LABELS
} from '../../../types/wallet';

interface WithdrawalRequestsProps {
  requests: WithdrawalRequest[];
}

export const WithdrawalRequests: React.FC<WithdrawalRequestsProps> = ({ requests }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'approved':
        return <Check className="h-5 w-5 text-blue-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-600" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    return method === 'bank_transfer' ? (
      <Building2 className="h-5 w-5 text-green-600" />
    ) : (
      <Smartphone className="h-5 w-5 text-orange-600" />
    );
  };

  const getTimelineSteps = (request: WithdrawalRequest) => {
    const steps = [
      {
        label: 'Demande créée',
        date: request.requestDate,
        completed: true
      },
      {
        label: 'En attente d\'approbation',
        date: request.approvedDate,
        completed: !!request.approvedDate
      },
      {
        label: 'En cours de traitement',
        date: request.processedDate,
        completed: !!request.processedDate
      },
      {
        label: 'Complété',
        date: request.completedDate,
        completed: !!request.completedDate
      }
    ];

    return steps;
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande de retrait</h3>
        <p className="text-gray-600">
          Vos demandes de retrait apparaîtront ici
        </p>
      </div>
    );
  }

  // Sort requests by date (newest first)
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedRequests.map((request) => (
        <div
          key={request.id}
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="bg-gray-50 p-2 rounded-lg">
                {getMethodIcon(request.method)}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {WITHDRAWAL_METHOD_LABELS[request.method]}
                </h4>
                <p className="text-sm text-gray-600">
                  {request.accountDetails.accountName || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  {request.accountDetails.accountNumber || request.accountDetails.phoneNumber}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                {WITHDRAWAL_STATUS_LABELS[request.status]}
              </span>
            </div>
          </div>

          {/* Amount Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Montant demandé</span>
              <span className="font-medium text-gray-900">{formatCurrency(request.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frais de retrait</span>
              <span className="font-medium text-red-600">- {formatCurrency(request.fee)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-medium text-gray-900">Montant net</span>
              <span className="font-bold text-green-600">{formatCurrency(request.netAmount)}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Suivi de la demande</span>
            </div>
            <div className="space-y-2">
              {getTimelineSteps(request).map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm ${
                      step.completed ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                    {step.date && (
                      <span className="text-xs text-gray-500">
                        {formatDate(step.date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Completion Date */}
          {request.status === 'pending' || request.status === 'processing' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Date estimée de traitement:</span>{' '}
                  {formatDate(request.estimatedDate)}
                </p>
              </div>
            </div>
          ) : request.status === 'completed' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  <span className="font-medium">Retrait complété</span> le {formatDate(request.completedDate!)}
                </p>
              </div>
            </div>
          ) : request.status === 'failed' && request.failureReason ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">
                  <span className="font-medium">Échec:</span> {request.failureReason}
                </p>
              </div>
            </div>
          ) : request.status === 'cancelled' && request.cancellationReason ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <p className="text-sm text-gray-800">
                  <span className="font-medium">Annulé:</span> {request.cancellationReason}
                </p>
              </div>
            </div>
          ) : null}

          {/* Request Date */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Demande créée le {formatDate(request.requestDate)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
