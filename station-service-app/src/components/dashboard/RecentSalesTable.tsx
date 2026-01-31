import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface Sale {
  id: string;
  soldAt: string;
  pompisteName: string;
  fuelTypeName: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
}

interface RecentSalesTableProps {
  sales: Sale[];
  loading?: boolean;
}

export function RecentSalesTable({ sales, loading = false }: RecentSalesTableProps) {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentBadgeColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'CASH':
        return 'bg-success-100 text-success-700';
      case 'CARD':
        return 'bg-blue-100 text-blue-700';
      case 'CREDIT':
        return 'bg-warning-100 text-warning-700';
      case 'VOUCHER':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        <div className="p-6 border-b border-secondary-200">
          <div className="h-5 bg-secondary-200 rounded w-36 animate-pulse" />
        </div>
        <div className="divide-y divide-secondary-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
              <div className="h-4 bg-secondary-200 rounded w-12" />
              <div className="h-4 bg-secondary-200 rounded w-24" />
              <div className="h-4 bg-secondary-200 rounded w-20" />
              <div className="h-4 bg-secondary-200 rounded w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
      <div className="p-6 border-b border-secondary-200">
        <h3 className="text-lg font-semibold text-secondary-900">
          Dernieres Ventes
        </h3>
      </div>

      {sales.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingCartIcon className="h-12 w-12 text-secondary-300 mx-auto mb-2" />
          <p className="text-secondary-500">Aucune vente recente</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Heure
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Pompiste
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Carburant
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Litres
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Paiement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-secondary-600">
                    {formatTime(sale.soldAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-secondary-900">
                      {sale.pompisteName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-600">
                    {sale.fuelTypeName}
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-900 text-right font-mono">
                    {sale.quantity.toFixed(2)} L
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-secondary-900">
                      {sale.totalAmount.toLocaleString('fr-FR')} MAD
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentBadgeColor(sale.paymentMethod)}`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
