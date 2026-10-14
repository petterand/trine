import React from 'react';
import { useApp } from '../context/AppContext';
import { formatBadgeCount } from '../services/badgeService';

interface AppIconBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const AppIconBadge: React.FC<AppIconBadgeProps> = ({
  size = 'md',
  className = '',
  onClick
}) => {
  const { activeAlerts } = useApp();
  const badgeLabel = formatBadgeCount(activeAlerts.length);

  const sizeClasses = {
    sm: 'w-5 h-5 rounded-[5px]',
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-12 h-12 rounded-xl'
  };

  const badgeOffsetClasses = {
    sm: '-top-1.5 -right-2 text-[9px] min-w-[14px] h-[14px] px-0.5',
    md: '-top-1.5 -right-2 text-[10px] min-w-[17px] h-[17px] px-1',
    lg: '-top-2 -right-2.5 text-[11px] min-w-[20px] h-[20px] px-1.5'
  };

  return (
    <div
      className={`relative inline-block shrink-0 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      title={badgeLabel ? `${activeAlerts.length} unchecked reminder alert${activeAlerts.length > 1 ? 's' : ''}` : undefined}
    >
      <img
        src="/src/assets/images/trine_app_icon_1791999108987.jpg"
        alt="Trine App Icon"
        className={`${sizeClasses[size]} object-cover shadow-xs border border-slate-200/80`}
        referrerPolicy="no-referrer"
      />
      {badgeLabel && (
        <span
          className={`absolute ${badgeOffsetClasses[size]} flex items-center justify-center font-bold font-sans tabular-nums text-white bg-red-600 rounded-full border-[1.5px] border-white shadow-sm shadow-red-600/50 animate-bounce duration-1000`}
        >
          {badgeLabel}
        </span>
      )}
    </div>
  );
};
