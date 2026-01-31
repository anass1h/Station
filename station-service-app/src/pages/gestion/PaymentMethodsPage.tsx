import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCardIcon, BanknotesIcon, DevicePhoneMobileIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { paymentMethodService } from '@/services/paymentMethodService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CASH: BanknotesIcon,
  CARD: CreditCardIcon,
  MOBILE: DevicePhoneMobileIcon,
  CHECK: DocumentTextIcon,
  CREDIT: DocumentTextIcon,
};

export function PaymentMethodsPage() {
  const queryClient = useQueryClient();

  const { data: paymentMethods = [], isLoading } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: paymentMethodService.getAll,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      paymentMethodService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Moyens de paiement</h1>
        <p className="text-secondary-500">Activez ou desactivez les moyens de paiement acceptes</p>
      </div>

      {/* Info Banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <p className="text-sm text-primary-700">
          Les moyens de paiement ne peuvent pas etre supprimes pour des raisons de tracabilite.
          Vous pouvez uniquement les activer ou les desactiver.
        </p>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map((method) => {
          const Icon = iconMap[method.code] || BanknotesIcon;
          return (
            <div
              key={method.id}
              className={`bg-white rounded-xl border-2 p-5 transition-all ${
                method.isActive ? 'border-primary-200' : 'border-secondary-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${method.isActive ? 'bg-primary-100' : 'bg-secondary-100'}`}>
                  <Icon className={`h-6 w-6 ${method.isActive ? 'text-primary-600' : 'text-secondary-500'}`} />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={method.isActive}
                    onChange={() =>
                      toggleMutation.mutate({ id: method.id, isActive: !method.isActive })
                    }
                    disabled={toggleMutation.isPending}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <h3 className="text-lg font-semibold text-secondary-900 mb-1">{method.name}</h3>
              <p className="text-sm text-secondary-500 mb-2">Code: {method.code}</p>

              {method.requiresDetails && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                  Requiert des details
                </span>
              )}

              <div className="mt-3 pt-3 border-t border-secondary-100">
                <p className="text-xs text-secondary-400">
                  Statut: {method.isActive ? (
                    <span className="text-success-600 font-medium">Actif</span>
                  ) : (
                    <span className="text-secondary-500 font-medium">Inactif</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {paymentMethods.length === 0 && (
        <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
          <BanknotesIcon className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-1">Aucun moyen de paiement</h3>
          <p className="text-sm text-secondary-500">
            Les moyens de paiement seront initialises automatiquement.
          </p>
        </div>
      )}
    </div>
  );
}
