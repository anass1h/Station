import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  UserIcon,
  BeakerIcon,
  BanknotesIcon,
  ClockIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { salesOperationsService } from '@/services/salesOperationsService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatCurrency, formatNumber } from '@/utils/exportExcel';

export function SaleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesOperationsService.getSaleById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Vente non trouvee</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/operations/ventes')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Detail de la vente</h1>
          <p className="text-secondary-500">{formatDateTime(sale.saleTime)}</p>
        </div>
      </div>

      {/* Main Info */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <UserIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Pompiste</p>
              <p className="font-semibold text-secondary-900">
                {sale.pompiste.firstName} {sale.pompiste.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BeakerIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Carburant</p>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: sale.fuelType.color }}
                />
                <span className="font-semibold text-secondary-900">{sale.fuelType.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Pistolet</p>
              <p className="font-semibold text-secondary-900">{sale.nozzle.reference}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <BanknotesIcon className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Montant total</p>
              <p className="font-semibold text-success-600">{formatCurrency(sale.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity Details */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Details de la vente</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-500 mb-1">Quantite</p>
            <p className="text-2xl font-bold text-secondary-900">{formatNumber(sale.quantity)} L</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-500 mb-1">Prix unitaire</p>
            <p className="text-2xl font-bold text-secondary-900">{formatNumber(sale.unitPrice)} MAD/L</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-500 mb-1">Index avant</p>
            <p className="text-2xl font-bold text-secondary-900">{formatNumber(sale.indexBefore)} L</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-500 mb-1">Index apres</p>
            <p className="text-2xl font-bold text-secondary-900">{formatNumber(sale.indexAfter)} L</p>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Paiement(s)</h2>
        <div className="space-y-3">
          {sale.payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {payment.paymentMethod.name}
                </span>
                {payment.reference && (
                  <span className="text-sm text-secondary-500">Ref: {payment.reference}</span>
                )}
              </div>
              <span className="font-semibold text-secondary-900">{formatCurrency(payment.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Client */}
      {sale.client && (
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Client</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-secondary-900">
                  {sale.client.companyName || sale.client.contactName}
                </p>
                {sale.client.companyName && (
                  <p className="text-sm text-secondary-500">{sale.client.contactName}</p>
                )}
              </div>
            </div>
            <Link
              to={`/operations/clients/${sale.client.id}`}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Voir le client →
            </Link>
          </div>
        </div>
      )}

      {/* Shift Link */}
      <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-secondary-600">Shift associe</p>
            <p className="text-secondary-900">
              {formatDateTime(sale.shift.startTime)}
              {sale.shift.endTime && ` - ${new Date(sale.shift.endTime).toLocaleTimeString('fr-FR')}`}
            </p>
          </div>
          <Link
            to={`/operations/shifts/${sale.shift.id}`}
            className="px-4 py-2 bg-white border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 transition-colors"
          >
            Voir le shift
          </Link>
        </div>
      </div>
    </div>
  );
}
