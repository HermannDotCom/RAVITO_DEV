import React from 'react';
import { Mail, Clock, UserPlus } from 'lucide-react';
import { useTeam } from '../../../hooks/useTeam';

export const InvitationsTab: React.FC = () => {
  const { members } = useTeam();

  // Filter for pending invitations
  const pendingInvitations = members.filter(m => m.status === 'pending');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Invitations en attente ({pendingInvitations.length})
        </h3>
      </div>

      {pendingInvitations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Aucune invitation en attente</p>
          <p className="text-sm text-gray-500">
            Les invitations envoyées apparaîtront ici jusqu'à ce qu'elles soient acceptées
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {pendingInvitations.map((invitation) => (
            <div key={invitation.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-1">
                      {invitation.email}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Invité le {new Date(invitation.invitedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  En attente
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
