import { useState, useEffect, useCallback } from 'react';
import {
  licenceAdminService,
  type Licence,
  type LicenceStats,
} from '@/services/licenceAdminService';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

type ModalType = 'suspend' | 'reactivate' | 'extend' | null;

interface ModalState {
  type: ModalType;
  stationId: string;
  stationName: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expirée',
  SUSPENDED: 'Suspendue',
};

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════

export function AdminClientsPage() {
  const [licences, setLicences] = useState<Licence[]>([]);
  const [stats, setStats] = useState<LicenceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null, stationId: '', stationName: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [suspendReason, setSuspendReason] = useState('');
  const [reactivateMonths, setReactivateMonths] = useState(6);
  const [extendMonths, setExtendMonths] = useState(3);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [licencesData, statsData] = await Promise.all([
        licenceAdminService.getAll(),
        licenceAdminService.getStats(),
      ]);
      setLicences(licencesData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (type: ModalType, stationId: string, stationName: string) => {
    setModal({ type, stationId, stationName });
    setSuspendReason('');
    setReactivateMonths(6);
    setExtendMonths(3);
  };

  const closeModal = () => {
    setModal({ type: null, stationId: '', stationName: '' });
  };

  const handleSuspend = async () => {
    if (!suspendReason || suspendReason.length < 5) return;
    setActionLoading(true);
    try {
      await licenceAdminService.suspend(modal.stationId, suspendReason);
      closeModal();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suspension');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      await licenceAdminService.reactivate(modal.stationId, reactivateMonths);
      closeModal();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réactivation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async () => {
    setActionLoading(true);
    try {
      await licenceAdminService.extend(modal.stationId, extendMonths);
      closeModal();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la prolongation');
    } finally {
      setActionLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-800 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
            <p className="text-sm text-secondary-500">Total</p>
            <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
            <p className="text-sm text-green-600">Actives</p>
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
            <p className="text-sm text-red-600">Expirées</p>
            <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
            <p className="text-sm text-yellow-600">Suspendues</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.suspended}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
            <p className="text-sm text-orange-600">Exp. bientôt</p>
            <p className="text-2xl font-bold text-orange-700">{stats.expiringSoon}</p>
          </div>
        </div>
      )}

      {/* Licences Table */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">
            Licences ({licences.length})
          </h2>
          <button
            onClick={loadData}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Actualiser
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Ville
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Jours restants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Utilisateurs
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {licences.map((licence) => {
                const days = getDaysRemaining(licence.endDate);
                const stationName = licence.station?.name || 'N/A';
                return (
                  <tr key={licence.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">
                        {stationName}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {licence.station?.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {licence.station?.city || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {licence.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[licence.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STATUS_LABELS[licence.status] || licence.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {formatDate(licence.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          days <= 7
                            ? 'text-red-600'
                            : days <= 30
                              ? 'text-orange-600'
                              : 'text-secondary-600'
                        }`}
                      >
                        {days}j
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {licence.station?._count?.users ?? '-'} / {licence.maxUsers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      {licence.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() =>
                              openModal('suspend', licence.stationId, stationName)
                            }
                            className="text-yellow-600 hover:text-yellow-700 font-medium"
                          >
                            Suspendre
                          </button>
                          <button
                            onClick={() =>
                              openModal('extend', licence.stationId, stationName)
                            }
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Prolonger
                          </button>
                        </>
                      )}
                      {(licence.status === 'SUSPENDED' ||
                        licence.status === 'EXPIRED') && (
                        <button
                          onClick={() =>
                            openModal('reactivate', licence.stationId, stationName)
                          }
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          Réactiver
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {licences.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-secondary-500">
                    Aucune licence trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* MODALS                                  */}
      {/* ═══════════════════════════════════════ */}

      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            {/* Suspend Modal */}
            {modal.type === 'suspend' && (
              <>
                <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                  Suspendre la licence
                </h3>
                <p className="text-sm text-secondary-500 mb-4">
                  Station : <strong>{modal.stationName}</strong>
                </p>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Motif de suspension
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Indiquez le motif (min. 5 caractères)..."
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-lg hover:bg-secondary-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSuspend}
                    disabled={actionLoading || suspendReason.length < 5}
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Suspension...' : 'Suspendre'}
                  </button>
                </div>
              </>
            )}

            {/* Reactivate Modal */}
            {modal.type === 'reactivate' && (
              <>
                <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                  Réactiver la licence
                </h3>
                <p className="text-sm text-secondary-500 mb-4">
                  Station : <strong>{modal.stationName}</strong>
                </p>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Prolongation (mois)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={reactivateMonths}
                  onChange={(e) => setReactivateMonths(Number(e.target.value))}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-lg hover:bg-secondary-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleReactivate}
                    disabled={actionLoading || reactivateMonths < 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Réactivation...' : 'Réactiver'}
                  </button>
                </div>
              </>
            )}

            {/* Extend Modal */}
            {modal.type === 'extend' && (
              <>
                <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                  Prolonger la licence
                </h3>
                <p className="text-sm text-secondary-500 mb-4">
                  Station : <strong>{modal.stationName}</strong>
                </p>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Mois à ajouter
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(Number(e.target.value))}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-lg hover:bg-secondary-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleExtend}
                    disabled={actionLoading || extendMonths < 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Prolongation...' : 'Prolonger'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
