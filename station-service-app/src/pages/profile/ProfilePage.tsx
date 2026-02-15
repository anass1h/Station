import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  UserCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/userService';
import { FormField } from '@/components/ui/FormField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PinPad } from '@/components/auth/PinPad';
import toast from 'react-hot-toast';
import { zPassword } from '../../lib/validation';

const passwordSchema = z.object({
  currentPassword: zPassword(1),
  newPassword: zPassword(8),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user } = useAuthStore();
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userService.updatePassword(data),
    onSuccess: () => {
      toast.success('Mot de passe modifie');
      reset();
    },
    onError: () => {
      toast.error('Erreur lors du changement de mot de passe');
    },
  });

  const pinMutation = useMutation({
    mutationFn: (pin: string) => userService.updatePin(pin),
    onSuccess: () => {
      toast.success('PIN modifie');
      setShowPinChange(false);
      setNewPin('');
    },
    onError: () => {
      toast.error('Erreur lors du changement de PIN');
    },
  });

  const onPasswordSubmit = (data: PasswordFormData) => {
    passwordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  // Handle PIN submission when it reaches 6 digits
  useEffect(() => {
    if (newPin.length === 6 && !pinMutation.isPending) {
      pinMutation.mutate(newPin);
    }
  }, [newPin]);

  const roleLabels: Record<string, string> = {
    POMPISTE: 'Pompiste',
    GESTIONNAIRE: 'Gestionnaire',
    SUPER_ADMIN: 'Super Admin',
  };

  const roleVariant = {
    POMPISTE: 'info',
    GESTIONNAIRE: 'warning',
    SUPER_ADMIN: 'success',
  } as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-secondary-900">Mon Profil</h1>

      {/* User Info */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-10 h-10 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-secondary-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-secondary-500">{user?.email || 'Pas d\'email'}</p>
            <div className="mt-1">
              <StatusBadge
                label={roleLabels[user?.role || ''] || user?.role || ''}
                variant={roleVariant[user?.role as keyof typeof roleVariant] || 'info'}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-secondary-500">Station</p>
            <p className="font-medium">{user?.stationId ? 'Assignee' : 'Non assignee'}</p>
          </div>
          <div>
            <p className="text-secondary-500">Badge</p>
            <p className="font-medium font-mono">{user?.badgeCode || '-'}</p>
          </div>
          {user?.phone && (
            <div>
              <p className="text-secondary-500">Telephone</p>
              <p className="font-medium">{user.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Change Password (if has email) */}
      {user?.email && (
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <KeyIcon className="w-6 h-6 text-secondary-400" />
            <h2 className="text-lg font-semibold text-secondary-900">Changer le mot de passe</h2>
          </div>

          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <FormField
              label="Mot de passe actuel"
              type="password"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
            />
            <FormField
              label="Nouveau mot de passe"
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />
            <FormField
              label="Confirmer le nouveau mot de passe"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            <button
              type="submit"
              disabled={isSubmitting || passwordMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {passwordMutation.isPending ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      )}

      {/* Change PIN (if POMPISTE or GESTIONNAIRE) */}
      {(user?.role === 'POMPISTE' || user?.role === 'GESTIONNAIRE') && (
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-secondary-400" />
            <h2 className="text-lg font-semibold text-secondary-900">Changer le code PIN</h2>
          </div>

          {showPinChange ? (
            <div className="space-y-4">
              <p className="text-secondary-600">Saisissez votre nouveau code PIN (6 chiffres) :</p>
              <div className="flex justify-center">
                <PinPad
                  value={newPin}
                  onChange={setNewPin}
                  maxLength={6}
                  disabled={pinMutation.isPending}
                />
              </div>
              {pinMutation.isPending && (
                <p className="text-center text-primary-600">Modification en cours...</p>
              )}
              <button
                onClick={() => {
                  setShowPinChange(false);
                  setNewPin('');
                }}
                className="w-full py-2 text-secondary-600 hover:text-secondary-900"
                disabled={pinMutation.isPending}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPinChange(true)}
              className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
            >
              Modifier mon PIN
            </button>
          )}
        </div>
      )}
    </div>
  );
}
