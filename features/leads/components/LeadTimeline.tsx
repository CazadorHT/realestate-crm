import React from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  FileText, 
  RefreshCcw, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Database } from '@/lib/database.types';

type LeadActivity = Database['public']['Tables']['lead_activities']['Row'];

interface LeadTimelineProps {
  activities: (LeadActivity & {
    profiles?: { full_name: string | null; avatar_url: string | null } | null;
  })[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'NOTE': return <FileText className="w-4 h-4" />;
    case 'CALL': return <Phone className="w-4 h-4" />;
    case 'EMAIL': return <Mail className="w-4 h-4" />;
    case 'MEETING': return <CheckCircle2 className="w-4 h-4" />;
    case 'STATUS_CHANGE': return <RefreshCcw className="w-4 h-4" />;
    default: return <MessageSquare className="w-4 h-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'NOTE': return 'bg-blue-100 text-blue-600';
    case 'CALL': return 'bg-green-100 text-green-600';
    case 'STATUS_CHANGE': return 'bg-amber-100 text-amber-600';
    default: return 'bg-slate-100 text-slate-600';
  }
};

export const LeadTimeline: React.FC<LeadTimelineProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock className="w-12 h-12 mb-4 opacity-20" />
        <p>ยังไม่มีประวัติกิจกรรม</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, idx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {idx !== activities.length - 1 ? (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className={`relative px-1`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ring-8 ring-white ${getActivityColor(activity.activity_type)}`}>
                    {getActivityIcon(activity.activity_type)}
                  </div>
                </div>
                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="flex justify-between space-x-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {activity.activity_type.replace('_', ' ')}
                        <span className="ml-2 font-normal text-slate-500">
                          โดย {activity.profiles?.full_name || 'ระบบ'}
                        </span>
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-slate-500">
                      {activity.created_at ? format(new Date(activity.created_at), 'd MMM yyyy, HH:mm', { locale: th }) : '-'}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    <p className="whitespace-pre-wrap">{activity.note}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
