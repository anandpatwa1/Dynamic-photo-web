import { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Modal, SearchInput, Select } from '@/components/ui';
import { weddingQrApi } from '@/api/weddingQrApi';

export const GuestRegistrationsModal = ({ open, onClose, project, onNotifyClick }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState(project?.eventCycle || 1);
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ total: 0, pages: 1 });

  const fetchRegistrations = useCallback(async () => {
    if (!project?._id) return;
    setLoading(true);
    try {
      const res = await weddingQrApi.listRegistrations(project._id, {
        cycle,
        channel: channelFilter !== 'all' ? channelFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRegistrations(items);
      setMeta(res?.meta || { total: items.length, pages: 1 });
    } catch (err) {
      console.error('Failed to load guest registrations:', err);
      toast.error('Could not load guest list');
    } finally {
      setLoading(false);
    }
  }, [project?._id, cycle, channelFilter, statusFilter, search]);

  useEffect(() => {
    if (open) {
      fetchRegistrations();
    }
  }, [open, fetchRegistrations]);

  const handleExportCsv = () => {
    if (!registrations.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Email Consent', 'WhatsApp Consent', 'Status', 'Registered Date'];
    const rows = registrations.map((r) => [
      `"${r.name || 'Anonymous'}"`,
      `"${r.email || ''}"`,
      `"${r.phone || ''}"`,
      r.consentEmail ? 'Yes' : 'No',
      r.consentWhatsApp ? 'Yes' : 'No',
      `"${r.status}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${project.slug}-guest-registrations-cycle-${cycle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentCycleNum = project?.eventCycle || 1;
  const cycleOptions = Array.from({ length: currentCycleNum }, (_, i) => ({
    value: String(i + 1),
    label: `Cycle #${i + 1}${i + 1 === currentCycleNum ? ' (Current)' : ' (Archived)'}`,
  }));

  return (
    <Modal open={open} onClose={onClose} size="4xl">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-ink-200/70 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-ink-900">Registered Guests</h2>
              <Badge tone="brand" size="xs">
                {meta.total} {meta.total === 1 ? 'Guest' : 'Guests'}
              </Badge>
            </div>
            <p className="text-xs text-ink-500">
              Guests registered through <strong className="text-ink-800">{project?.name}</strong> to be notified when photos are ready.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {project?.galleryStatus === 'ready' && (
              <Button
                size="sm"
                variant="brand"
                onClick={() => {
                  onClose();
                  if (onNotifyClick) onNotifyClick(project);
                }}
              >
                Send Notifications
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              icon={Download}
              onClick={handleExportCsv}
              disabled={!registrations.length}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-ink-50 p-3 rounded-xl border border-ink-200/60">
          <div className="sm:col-span-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email or phone..."
            />
          </div>

          <div>
            <Select
              value={String(cycle)}
              onChange={(e) => setCycle(Number(e.target.value))}
              options={cycleOptions}
              className="text-xs w-full"
            />
          </div>

          <div>
            <Select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Channels' },
                { value: 'email', label: 'Email Eligible' },
                { value: 'whatsapp', label: 'WhatsApp Eligible' },
              ]}
              className="text-xs w-full"
            />
          </div>
        </div>

        {/* Guest Table */}
        <div className="overflow-x-auto rounded-xl border border-ink-200/70 max-h-[420px] scrollbar-slim">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink-100/70 text-ink-600 sticky top-0 border-b border-ink-200/70 z-10">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Guest</th>
                <th className="px-4 py-2.5 font-semibold">Contact Info</th>
                <th className="px-4 py-2.5 font-semibold">Channels</th>
                <th className="px-4 py-2.5 font-semibold">Delivery Status</th>
                <th className="px-4 py-2.5 font-semibold text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/60 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading registered guests...</span>
                    </div>
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-400">
                    No guest registrations found for this event cycle.
                  </td>
                </tr>
              ) : (
                registrations.map((guest) => {
                  const ns = guest.notificationSummary || {};
                  return (
                    <tr key={guest._id} className="hover:bg-ink-50/60 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-900">
                          {guest.name || <span className="text-ink-400 italic">Anonymous Guest</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3 space-y-0.5">
                        {guest.email && (
                          <div className="flex items-center gap-1.5 text-ink-700">
                            <Mail className="w-3 h-3 text-ink-400" />
                            <span>{guest.email}</span>
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center gap-1.5 text-ink-700 font-mono text-2xs">
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>{guest.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {guest.consentEmail && (
                            <Badge tone="brand" size="xs" title="Consented to Email">
                              Email
                            </Badge>
                          )}
                          {guest.consentWhatsApp && (
                            <Badge tone="success" size="xs" title="Consented to WhatsApp">
                              WhatsApp
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {guest.status === 'notified' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Notified</span>
                          </span>
                        ) : guest.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-medium text-2xs" title={ns.error}>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-ink-500 text-2xs">
                            <Clock className="w-3.5 h-3.5 text-ink-400" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right text-ink-400 font-mono text-2xs whitespace-nowrap">
                        {new Date(guest.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-2xs text-ink-400 pt-2 border-t border-ink-200/60">
          <span>
            Cycle #{cycle} · Historical registrations remain permanently isolated per wedding event.
          </span>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

