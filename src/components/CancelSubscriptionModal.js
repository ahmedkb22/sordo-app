'use client'
import { useState } from 'react'
import { X, AlertTriangle, ChevronRight } from 'lucide-react'
import { db } from '../firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import './CancelSubscriptionModal.css'

export default function CancelSubscriptionModal({ uid, currentPlan, onClose, onCancelled }) {
  const [step, setStep]       = useState('confirm') // 'confirm' | 'loading' | 'done'
  const [error, setError]     = useState(null)

  const handleCancel = async () => {
    setStep('loading')
    try {
      await updateDoc(doc(db, 'users', uid), {
        'subscription.plan':       'free',
        'subscription.cancelledAt': serverTimestamp(),
        'subscription.expiresAt':  null,
        'subscription.paymentRef': null,
      })
      setStep('done')
      onCancelled?.()          // refresh parent state if provided
    } catch (e) {
      setError('Une erreur est survenue. Réessayez.')
      setStep('confirm')
    }
  }

  return (
    <div className="csm-overlay">
      <div className="csm-modal">
        <button className="csm-close" onClick={onClose}><X size={18} /></button>

        {step === 'confirm' && (
          <>
            <div className="csm-icon"><AlertTriangle size={30} color="#f87171" /></div>
            <h2 className="csm-title">Annuler l'abonnement ?</h2>
            <p className="csm-desc">
              Vous allez revenir au plan <strong>Gratuit</strong> (60 min/jour).
              Toutes vos fonctionnalités avancées seront désactivées immédiatement.
            </p>
            {error && <p className="csm-error">{error}</p>}
            <div className="csm-actions">
              <button className="csm-btn csm-btn--ghost" onClick={onClose}>
                Garder mon abonnement
              </button>
              <button className="csm-btn csm-btn--danger" onClick={handleCancel}>
                Confirmer l'annulation <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}

        {step === 'loading' && (
          <p className="csm-loading">Annulation en cours…</p>
        )}

        {step === 'done' && (
          <>
            <div className="csm-icon">✅</div>
            <h2 className="csm-title">Abonnement annulé</h2>
            <p className="csm-desc">Vous êtes maintenant sur le plan Gratuit.</p>
            <button className="csm-btn csm-btn--ghost" onClick={onClose}>
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  )
}