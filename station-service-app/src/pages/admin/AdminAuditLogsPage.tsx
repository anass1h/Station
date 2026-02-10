import { useState, useEffect, useCallback } from 'react';
import { auditLogService, type AuditLog, type AuditLogFilters } from '@/services/auditLogService';
import { stationService, type Station } from '@/services/stationService';
import { StatusBadge } from '@/components/ui/StatusBadge';

const ACTION_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'danger',
  LOGIN: 'info',
  LOGOUT: 'secondary',
  LOGIN_FAILED: 'danger',
  LOCK: 'danger',
  UNLOCK: 'info',
};

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filterStation, setFilterStation] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: AuditLogFilters = { page, limit };
      if (filterStation) filters.stationId = filterStation;
      if (filterAction) filters.action = filterAction;
      if (filterFrom) filters.from = filterFrom;
      if (filterTo) filters.to = filterTo;

      const result = await auditLogService.getAll(filters);
      setLogs(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  }, [page, filterStation, filterAction, filterFrom, filterTo]);

  const loadStations = useCallback(async () => {
    try {
      const data = await stationService.getAll();
      setStations(data);
    } catch {
      // Silently fail - stations filter just won't be populated
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Journal d'audit</h1>
        <p className="text-sm text-secondary-500 mt-1">
          Historique des actions effectuées sur la plateforme
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-800 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary-600 mb-1">Station</label>
            <select
              value={filterStation}
              onChange={(e) => handleFilterChange(setFilterStation)(e.target.value)}
              className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Toutes</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-600 mb-1">Action</label>
            <select
              value={filterAction}
              onChange={(e) => handleFilterChange(setFilterAction)(e.target.value)}
              className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Toutes</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="LOCK">LOCK</option>
              <option value="UNLOCK">UNLOCK</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-600 mb-1">Du</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => handleFilterChange(setFilterFrom)(e.target.value)}
              className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-600 mb-1">Au</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => handleFilterChange(setFilterTo)(e.target.value)}
              className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => {
              setFilterStation('');
              setFilterAction('');
              setFilterFrom('');
              setFilterTo('');
              setPage(1);
            }}
            className="text-sm text-secondary-500 hover:text-secondary-700 font-medium"
          >
            Réinitialiser
          </button>
          <button
            onClick={loadData}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">
            Logs ({total})
          </h2>
          <span className="text-sm text-secondary-500">
            Page {page} / {totalPages || 1}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-secondary-500">
            Aucun log trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Station
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Entité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Détail
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div>
                          <div className="text-sm font-medium text-secondary-900">
                            {log.user.firstName} {log.user.lastName}
                          </div>
                          <div className="text-xs text-secondary-500">{log.user.email || '-'}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-secondary-400">Système</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {log.station?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        label={log.action}
                        variant={ACTION_VARIANTS[log.action] || 'secondary'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {log.entity || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-500 max-w-xs truncate">
                      {log.detail || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-secondary-200 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-lg hover:bg-secondary-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-secondary-600 hover:bg-secondary-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-lg hover:bg-secondary-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
