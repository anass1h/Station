import { Bars3Icon } from '@heroicons/react/24/outline';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
        >
          <Bars3Icon className="h-6 w-6 text-secondary-600" />
        </button>
        <h1 className="text-xl font-semibold text-secondary-900">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
