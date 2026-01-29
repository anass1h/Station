export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-secondary-500 mb-1">Ventes aujourd'hui</p>
          <p className="text-2xl font-bold text-secondary-900">0 DH</p>
        </div>
        <div className="card">
          <p className="text-sm text-secondary-500 mb-1">Litres vendus</p>
          <p className="text-2xl font-bold text-secondary-900">0 L</p>
        </div>
        <div className="card">
          <p className="text-sm text-secondary-500 mb-1">Shifts actifs</p>
          <p className="text-2xl font-bold text-secondary-900">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-secondary-500 mb-1">Alertes</p>
          <p className="text-2xl font-bold text-warning-600">0</p>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="card">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          Tableau de bord
        </h2>
        <p className="text-secondary-500">
          Le contenu du tableau de bord sera implemente ici.
        </p>
      </div>
    </div>
  );
}
