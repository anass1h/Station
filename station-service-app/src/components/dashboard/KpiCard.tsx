import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import { ComponentType } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon: ComponentType<{ className?: string }>;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'bg-primary-100 text-primary-600',
    text: 'text-primary-600',
  },
  success: {
    bg: 'bg-success-50',
    icon: 'bg-success-100 text-success-600',
    text: 'text-success-600',
  },
  warning: {
    bg: 'bg-warning-50',
    icon: 'bg-warning-100 text-warning-600',
    text: 'text-warning-600',
  },
  danger: {
    bg: 'bg-danger-50',
    icon: 'bg-danger-100 text-danger-600',
    text: 'text-danger-600',
  },
  info: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
  },
};

export function KpiCard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  color = 'primary',
  loading = false,
}: KpiCardProps) {
  const colors = colorClasses[color];
  const hasTrend = trend !== undefined && trend !== null;
  const isPositiveTrend = trend !== undefined && trend >= 0;

  if (loading) {
    return (
      <div className={`rounded-xl p-5 ${colors.bg} animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-secondary-200 rounded w-24" />
            <div className="h-8 bg-secondary-200 rounded w-32" />
            <div className="h-4 bg-secondary-200 rounded w-16" />
          </div>
          <div className={`w-12 h-12 rounded-xl ${colors.icon} opacity-50`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-5 ${colors.bg} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>

          {hasTrend && (
            <div className="flex items-center gap-1 mt-2">
              {isPositiveTrend ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-success-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-danger-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositiveTrend ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {isPositiveTrend ? '+' : ''}{trend.toFixed(1)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-secondary-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
