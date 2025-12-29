import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = (n: any) => {
    markAsRead(n.id);
    // Navigate based on role
    let base = '/police';
    if (user?.role === 'JUDGE') base = '/judge';
    else if (user?.role === 'COURT_CLERK') base = '/court';
    else if (user?.role === 'SHO') base = '/sho';
    
    setOpen(false);
    nav(`${base}/cases/${n.relatedCaseId}`);
  };

  return (
    <div className="relative">
      <button className="p-2 rounded hover:bg-gray-100" onClick={() => setOpen(!open)} aria-label="Notifications">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border rounded shadow-md z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="font-medium">Notifications</div>
            <div>
              <button onClick={markAllRead} className="text-sm text-blue-600">Mark all read</button>
            </div>
          </div>
          <div className="max-h-72 overflow-auto">
            {notifications.length === 0 && <div className="p-3 text-sm text-gray-600">No notifications</div>}
            {notifications.slice(0, 10).map((n) => (
              <div key={n.id} className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${n.isRead ? 'bg-white' : 'bg-gray-50'}`} onClick={() => handleClick(n)}>
                <div className="flex justify-between">
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{n.message}</div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t text-right">
            <Button variant="ghost" onClick={() => { setOpen(false); nav('/notifications'); }}>View all</Button>
          </div>
        </div>
      )}
    </div>
  );
};
