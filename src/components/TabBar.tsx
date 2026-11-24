import { BarChart3, CalendarDays, CircleCheckBig } from 'lucide-react';

export type Tab = 'today' | 'calendar' | 'stats';

const TABS: { id: Tab; label: string; Icon: typeof CircleCheckBig }[] = [
  { id: 'today', label: 'Today', Icon: CircleCheckBig },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'stats', label: 'Stats', Icon: BarChart3 },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-inner">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab${tab === id ? ' active' : ''}`}
            onClick={() => onChange(id)}
            aria-current={tab === id ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={2.3} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
