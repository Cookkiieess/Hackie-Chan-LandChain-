import {
  Bell,
  ChevronRight,
  FileBadge2,
  Landmark,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getNotifications, markNotificationRead } from "../../utils/api";

const TYPE_STYLES = {
  DEED_RECEIVED: {
    stripe: "bg-violet-500",
    icon: FileBadge2,
    iconWrap: "bg-violet-100 text-violet-600",
  },
  TRANSFER_REQUEST: {
    stripe: "bg-sky-500",
    icon: Landmark,
    iconWrap: "bg-sky-100 text-sky-600",
  },
  STATUS_UPDATE: {
    stripe: "bg-emerald-500",
    icon: ShieldCheck,
    iconWrap: "bg-emerald-100 text-emerald-600",
  },
  TAX_REMINDER: {
    stripe: "bg-amber-500",
    icon: Receipt,
    iconWrap: "bg-amber-100 text-amber-600",
  },
};

function formatRelativeTime(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function Inbox({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const { data } = await getNotifications(userId);
        if (mounted) {
          setNotifications(data);
        }
      } catch (error) {
        if (mounted) {
          setNotifications([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const handleOpenNotification = async (notification) => {
    if (!notification.read) {
      try {
        const { data } = await markNotificationRead(notification._id);
        setNotifications((current) =>
          current.map((item) => (item._id === data._id ? data : item))
        );
      } catch (error) {
        return;
      }
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inbox</h1>
          <p className="text-sm text-slate-500">Track every handoff, approval, and reminder.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          {unreadCount} unread
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-[24px] border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Bell className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-slate-900">No notifications yet</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Your approvals, offers, and reminders will appear here as soon as activity starts.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const typeStyle = TYPE_STYLES[notification.type] || TYPE_STYLES.STATUS_UPDATE;
            const Icon = typeStyle.icon;

            return (
              <button
                key={notification._id}
                type="button"
                onClick={() => handleOpenNotification(notification)}
                className={`group relative flex w-full items-stretch overflow-hidden rounded-[24px] border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  notification.read ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className={`w-1.5 ${typeStyle.stripe}`} />
                <div className="flex flex-1 items-start gap-4 p-5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${typeStyle.iconWrap}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                      </div>
                      {!notification.read ? (
                        <span className="mt-1 h-3 w-3 rounded-full bg-sky-500" />
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition group-hover:text-slate-800">
                        Open
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
