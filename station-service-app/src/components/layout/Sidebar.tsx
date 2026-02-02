import { NavLink } from 'react-router-dom';
import {
  ChartBarIcon,
  ClockIcon,
  ShoppingCartIcon,
  CubeIcon,
  TruckIcon,
  UsersIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CircleStackIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BellAlertIcon,
  KeyIcon,
  XMarkIcon,
  BanknotesIcon,
  AdjustmentsHorizontalIcon,
  CreditCardIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  ChartBarIcon as ChartBarIconSolid,
  ClockIcon as ClockIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  CubeIcon as CubeIconSolid,
  TruckIcon as TruckIconSolid,
  UsersIcon as UsersIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  CircleStackIcon as CircleStackIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  BellAlertIcon as BellAlertIconSolid,
  KeyIcon as KeyIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  AdjustmentsHorizontalIcon as AdjustmentsHorizontalIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  ExclamationCircleIcon as ExclamationCircleIconSolid,
} from '@heroicons/react/24/solid';
import { useAuthStore } from '@/stores/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconSolid: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
  roles?: ('GESTIONNAIRE' | 'SUPER_ADMIN')[];
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { name: 'Shifts', path: '/operations/shifts', icon: ClockIcon, iconSolid: ClockIconSolid },
  { name: 'Ventes', path: '/operations/ventes', icon: ShoppingCartIcon, iconSolid: ShoppingCartIconSolid },
  { name: 'Stock', path: '/operations/stock', icon: CubeIcon, iconSolid: CubeIconSolid },
  { name: 'Livraisons', path: '/operations/livraisons', icon: TruckIcon, iconSolid: TruckIconSolid },
  { name: 'Clients', path: '/operations/clients', icon: UsersIcon, iconSolid: UsersIconSolid },
  { name: 'Factures', path: '/operations/factures', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
  { name: 'Caisses', path: '/operations/caisses', icon: BanknotesIcon, iconSolid: BanknotesIconSolid },
];

const configNavItems: NavItem[] = [
  { name: 'Stations', path: '/gestion/stations', icon: BuildingOfficeIcon, iconSolid: BuildingOfficeIconSolid },
  { name: 'Cuves', path: '/gestion/cuves', icon: CircleStackIcon, iconSolid: CircleStackIconSolid },
  { name: 'Distributeurs', path: '/gestion/distributeurs', icon: WrenchScrewdriverIcon, iconSolid: WrenchScrewdriverIconSolid },
  { name: 'Pistolets', path: '/gestion/pistolets', icon: AdjustmentsHorizontalIcon, iconSolid: AdjustmentsHorizontalIconSolid },
  { name: 'Pompistes', path: '/gestion/pompistes', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
  { name: 'Prix', path: '/gestion/prix', icon: CurrencyDollarIcon, iconSolid: CurrencyDollarIconSolid },
  { name: 'Fournisseurs', path: '/gestion/fournisseurs', icon: TruckIcon, iconSolid: TruckIconSolid },
  { name: 'Paiements', path: '/gestion/paiements', icon: CreditCardIcon, iconSolid: CreditCardIconSolid },
];

const financeNavItems: NavItem[] = [
  { name: 'Dettes', path: '/dettes', icon: ExclamationCircleIcon, iconSolid: ExclamationCircleIconSolid },
];

const alertNavItems: NavItem[] = [
  { name: 'Alertes', path: '/alertes', icon: BellAlertIcon, iconSolid: BellAlertIconSolid, badge: 0 },
];

const adminNavItems: NavItem[] = [
  { name: 'Licences', path: '/admin/licences', icon: KeyIcon, iconSolid: KeyIconSolid, roles: ['SUPER_ADMIN'] },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const userRole = user?.role;

  const renderNavItem = (item: NavItem, isActive: boolean) => {
    const Icon = isActive ? item.iconSolid : item.icon;
    return (
      <>
        <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-secondary-500 group-hover:text-secondary-700'}`} />
        <span className="flex-1">{item.name}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="bg-danger-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </>
    );
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
    }`;

  const shouldShowItem = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole as 'GESTIONNAIRE' | 'SUPER_ADMIN');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-secondary-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-secondary-900">Station Service</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-secondary-100"
          >
            <XMarkIcon className="h-6 w-6 text-secondary-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100%-4rem)]">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-2">
              Principal
            </p>
            <div className="space-y-1">
              {mainNavItems.filter(shouldShowItem).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={navLinkClass}
                  onClick={() => onClose()}
                >
                  {({ isActive }) => renderNavItem(item, isActive)}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div>
            <p className="px-3 text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-2">
              Configuration
            </p>
            <div className="space-y-1">
              {configNavItems.filter(shouldShowItem).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={navLinkClass}
                  onClick={() => onClose()}
                >
                  {({ isActive }) => renderNavItem(item, isActive)}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Finance */}
          <div>
            <p className="px-3 text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-2">
              Finance
            </p>
            <div className="space-y-1">
              {financeNavItems.filter(shouldShowItem).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={navLinkClass}
                  onClick={() => onClose()}
                >
                  {({ isActive }) => renderNavItem(item, isActive)}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div>
            <p className="px-3 text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-2">
              Notifications
            </p>
            <div className="space-y-1">
              {alertNavItems.filter(shouldShowItem).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={navLinkClass}
                  onClick={() => onClose()}
                >
                  {({ isActive }) => renderNavItem(item, isActive)}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Admin (Super Admin only) */}
          {userRole === 'SUPER_ADMIN' && (
            <div>
              <p className="px-3 text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-2">
                Administration
              </p>
              <div className="space-y-1">
                {adminNavItems.filter(shouldShowItem).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={navLinkClass}
                    onClick={() => onClose()}
                  >
                    {({ isActive }) => renderNavItem(item, isActive)}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
