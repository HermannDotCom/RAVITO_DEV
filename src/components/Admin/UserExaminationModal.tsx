@@ .. @@
 export const UserExaminationModal: React.FC<UserExaminationModalProps> = ({
   user,
   onClose,
   onApprove,
   onReject
 }) => {
   const [rejectReason, setRejectReason] = React.useState('');
   const [showRejectForm, setShowRejectForm] = React.useState(false);
+  const [selectedRejectReasons, setSelectedRejectReasons] = React.useState<string[]>([]);
+  const [customRejectReason, setCustomRejectReason] = React.useState('');
+  const [isProcessing, setIsProcessing] = React.useState(false);

   const formatDate = (date: Date) => {
@@ .. @@
   const handleReject = () => {
-    if (!rejectReason.trim()) return;
-    onReject(user.id, rejectReason);
-    onClose();
+    if (selectedRejectReasons.length === 0 && !customRejectReason.trim()) return;
+    
+    setIsProcessing(true);
+    
+    // Combine selected reasons and custom reason
+    const allReasons = [...selectedRejectReasons];
+    if (customRejectReason.trim()) {
+      allReasons.push(customRejectReason.trim());
+    }
+    
+    const finalReason = allReasons.join('; ');
+    
+    // Simulate API call
+    setTimeout(() => {
+      onReject(user.id, finalReason);
+      setIsProcessing(false);
+      onClose();
+    }, 1500);
+  };
+
+  const handleApprove = () => {
+    setIsProcessing(true);
+    
+    // Simulate API call
+    setTimeout(() => {
+      onApprove(user.id);
+      setIsProcessing(false);
+      onClose();
+    }, 1000);
   };

   const rejectReasons = [
-    'Informations incomplètes ou incorrectes',
-    'Documents manquants ou non valides',
-    'Zone de couverture non autorisée',
-    'Établissement non conforme aux critères',
-    'Doublon avec un compte existant',
-    'Autre (préciser dans le commentaire)'
+    'Informations de contact incomplètes ou incorrectes',
+    'Documents d\'identité manquants ou non valides',
+    'Justificatif d\'adresse manquant ou non conforme',
+    'Licence commerciale expirée ou non valide',
+    'Zone de couverture non autorisée ou trop étendue',
+    'Établissement non conforme aux critères DISTRI-NIGHT',
+    'Doublon détecté avec un compte existant',
+    'Informations commerciales insuffisantes',
+    'Moyens de paiement non conformes',
+    'Capacité de livraison inadéquate'
   ];

+  const toggleRejectReason = (reason: string) => {
+    setSelectedRejectReasons(prev => 
+      prev.includes(reason)
+        ? prev.filter(r => r !== reason)
+        : [...prev, reason]
+    );
+  };

   return (
@@ .. @@
           {/* Rejection Form */}
           {showRejectForm && (
             <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
-              <h4 className="text-lg font-bold text-red-900 mb-4">Motif de rejet</h4>
+              <h4 className="text-lg font-bold text-red-900 mb-4">Confirmation du rejet</h4>
+              
+              <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
+                <div className="flex items-start space-x-3">
+                  <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
+                    <span className="text-white text-xs font-bold">!</span>
+                  </div>
+                  <div className="text-sm">
+                    <p className="font-medium text-red-800 mb-1">Action de rejet</p>
+                    <p className="text-red-700">
+                      Le demandeur recevra une notification avec les raisons du rejet et sera invité à 
+                      fournir les éléments manquants pour une nouvelle demande.
+                    </p>
+                  </div>
+                </div>
+              </div>
               
-              <div className="space-y-3 mb-4">
+              <div className="mb-4">
+                <label className="block text-sm font-medium text-red-800 mb-3">
+                  Sélectionnez les raisons du rejet :
+                </label>
+                <div className="space-y-2 max-h-48 overflow-y-auto">
+                  {rejectReasons.map((reason) => (
+                    <label key={reason} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-red-100 rounded-lg transition-colors">
+                      <input
+                        type="checkbox"
+                        checked={selectedRejectReasons.includes(reason)}
+                        onChange={() => toggleRejectReason(reason)}
+                        className="h-4 w-4 text-red-600 mt-0.5 rounded"
+                      />
+                      <span className="text-sm text-gray-700 flex-1">{reason}</span>
+                    </label>
+                  ))}
+                </div>
+              </div>

-              <div className="space-y-3 mb-4">
-                {rejectReasons.map((reason) => (
-                  <label key={reason} className="flex items-center space-x-3 cursor-pointer">
-                    <input
-                      type="radio"
-                      name="rejectReason"
-                      value={reason}
-                      onChange={(e) => setRejectReason(e.target.value)}
-                      className="h-4 w-4 text-red-600"
-                    />
-                    <span className="text-sm text-gray-700">{reason}</span>
-                  </label>
-                ))}
-              </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
-                  Commentaire détaillé (optionnel)
+                  Raison personnalisée ou commentaire détaillé (optionnel)
                 </label>
                 <textarea
                   rows={3}
-                  value={rejectReason === 'Autre (préciser dans le commentaire)' ? '' : ''}
-                  onChange={(e) => {
-                    if (rejectReason === 'Autre (préciser dans le commentaire)') {
-                      setRejectReason(e.target.value);
-                    }
-                  }}
+                  value={customRejectReason}
+                  onChange={(e) => setCustomRejectReason(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
-                  placeholder="Précisez les éléments à corriger ou les raisons du rejet..."
+                  placeholder="Ajoutez des précisions sur les éléments à corriger..."
                 />
               </div>
+              
+              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
+                <p className="text-sm text-yellow-800">
+                  <strong>Notification automatique :</strong> Le demandeur recevra un email et une notification 
+                  dans son espace avec les raisons détaillées du rejet et les actions à entreprendre.
+                </p>
+              </div>
             </div>
           )}

           {/* Action Buttons */}
-          <div className="flex flex-col sm:flex-row gap-3">
+          <div className="flex flex-col sm:flex-row gap-3" data-action-buttons>
             {!showRejectForm ? (
               <>
                 <button
-                  data-reject-form
                   onClick={() => setShowRejectForm(true)}
-                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
+                  disabled={isProcessing}
+                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                 >
                   <X className="h-4 w-4" />
                   <span>Rejeter la demande</span>
                 </button>
                 <button
-                  onClick={() => onApprove(user.id)}
-                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
+                  onClick={handleApprove}
+                  disabled={isProcessing}
+                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                 >
-                  <Star className="h-4 w-4" />
-                  <span>Approuver et activer</span>
+                  {isProcessing ? (
+                    <>
+                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
+                      <span>Approbation...</span>
+                    </>
+                  ) : (
+                    <>
+                      <Star className="h-4 w-4" />
+                      <span>Approuver et activer</span>
+                    </>
+                  )}
                 </button>
               </>
             ) : (
               <>
                 <button
                   onClick={() => setShowRejectForm(false)}
-                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
+                  disabled={isProcessing}
+                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   Annuler
                 </button>
                 <button
                   onClick={handleReject}
-                  disabled={!rejectReason.trim()}
-                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
+                  disabled={selectedRejectReasons.length === 0 && !customRejectReason.trim() || isProcessing}
+                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                 >
-                  <X className="h-4 w-4" />
-                  <span>Confirmer le rejet</span>
+                  {isProcessing ? (
+                    <>
+                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
+                      <span>Envoi notification...</span>
+                    </>
+                  ) : (
+                    <>
+                      <X className="h-4 w-4" />
+                      <span>Confirmer le rejet</span>
+                    </>
+                  )}
                 </button>
               </>
             )}
@@ .. @@