import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Modal, Textarea } from '@/components/ui';
import { weddingQrApi } from '@/api/weddingQrApi';

export const SendNotificationsModal = ({ open, onClose, project, onComplete }) => {
  const [channel, setChannel] = useState('both');
  const [retryFailedOnly, setRetryFailedOnly] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [providers, setProviders] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      setLoadingProviders(true);
      weddingQrApi
        .getProviderStatus()
        .then((res) => setProviders(res.data || res))
        .catch(() => setProviders(null))
        .finally(() => setLoadingProviders(false));
    }
  }, [open]);

  const handleSend = async () => {
    if (!project?._id) return;
    setSending(true);
    setResult(null);
    try {
      const res = await weddingQrApi.notifyGuests(project._id, {
        channel,
        retryFailedOnly,
        customMessage: customMessage.trim(),
      });
      const data = res?.data || res;
      setResult(data);
      toast.success(res?.message || 'Notification run completed');
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Failed to notify guests:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Could not send notifications');
    } finally {
      setSending(false);
    }
  };

  const galleries = project?.galleries || [];
  const isReady = project?.galleryStatus === 'ready';

  return (
    <Modal open={open} onClose={onClose} size="2xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-ink-200/70 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-ink-900">Notify Registered Guests</h2>
            </div>
            <p className="text-xs text-ink-500">
              Send official photo gallery links to registered guests for <strong className="text-ink-800">{project?.name}</strong>.
            </p>
          </div>
        </div>

        {!isReady ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Galleries are currently marked as &quot;Preparing&quot;</p>
              <p className="text-amber-800 leading-relaxed">
                You must mark photos as <strong>Ready</strong> in the project settings before notifications can be delivered to guests.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Gallery Links Preview */}
            <div className="p-4 rounded-xl bg-ink-50 border border-ink-200/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-600" />
                  Galleries that will be sent:
                </span>
                <span className="text-2xs font-normal text-ink-500">
                  {galleries.length} {galleries.length === 1 ? 'gallery' : 'galleries'} configured
                </span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-slim">
                {galleries.map((g, idx) => (
                  <div
                    key={g._id || idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-ink-200/60 text-xs"
                  >
                    <span className="font-medium text-ink-900 truncate">{g.title}</span>
                    <a
                      href={g.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-2xs text-brand-600 hover:underline flex items-center gap-1 font-mono shrink-0 ml-2"
                    >
                      <span>Preview URL</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Breakdown & Provider Health */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-ink-200/70 bg-white space-y-1.5">
                <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
                  Target Recipients (Cycle #{project?.eventCycle || 1})
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-800">
                  <span className="font-semibold">{project?.totalRegistrations || 0} Total</span>
                  <span>·</span>
                  <span className="text-brand-700">{project?.emailEligibleCount || 0} Email</span>
                  <span>·</span>
                  <span className="text-emerald-700">{project?.whatsappEligibleCount || 0} WhatsApp</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-ink-200/70 bg-white space-y-1.5">
                <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
                  Delivery Providers
                </div>
                <div className="flex items-center gap-2 text-2xs">
                  {providers?.email?.isConfigured ? (
                    <Badge tone="success" size="xs">Email Ready ({providers.email.provider})</Badge>
                  ) : (
                    <Badge tone="warning" size="xs">Email Unset</Badge>
                  )}
                  {providers?.whatsapp?.isConfigured ? (
                    <Badge tone="success" size="xs">WhatsApp Ready</Badge>
                  ) : (
                    <Badge tone="warning" size="xs">WhatsApp Unset</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Channel Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink-700">
                Notification Channel:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { value: 'both', label: 'Email & WhatsApp', icon: Sparkles },
                  { value: 'email', label: 'Email Only', icon: Mail },
                  { value: 'whatsapp', label: 'WhatsApp Only', icon: MessageSquare },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = channel === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setChannel(opt.value)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold shadow-sm'
                          : 'border-ink-200 hover:border-ink-300 text-ink-700 bg-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-700">
                Custom Note to Guests <span className="text-ink-400 font-normal">(optional)</span>:
              </label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={2}
                placeholder="e.g. Thank you for joining our celebration! Feel free to download high-resolution copies."
                className="text-xs"
              />
            </div>

            {/* Retry checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-700">
              <input
                type="checkbox"
                checked={retryFailedOnly}
                onChange={(e) => setRetryFailedOnly(e.target.checked)}
                className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/30"
              />
              <span>Only retry guests whose previous notification failed</span>
            </label>

            {/* Result Report */}
            {result && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  result.status === 'completed'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : result.status === 'partially_failed'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Notification Run: {result.status.replace('_', ' ').toUpperCase()}</span>
                </div>
                <p>
                  Targeted: <strong>{result.targetCount}</strong> · Sent:{' '}
                  <strong className="text-emerald-700">{result.sentCount}</strong> · Failed:{' '}
                  <strong className="text-rose-700">{result.failedCount}</strong>
                </p>
                {result.failedCount > 0 && (
                  <p className="text-2xs opacity-90">
                    Failed deliveries were recorded. Check provider credentials in <code>.env</code> or retry failed recipients above.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ink-200/70 pt-4">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {result ? 'Done' : 'Cancel'}
          </Button>

          {isReady && (
            <Button
              variant="brand"
              size="sm"
              icon={Send}
              loading={sending}
              onClick={handleSend}
            >
              {retryFailedOnly ? 'Retry Failed Deliveries' : 'Confirm & Dispatch Notifications'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

