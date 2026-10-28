import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  MessageCircle,
  Share2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge, Button, Input, Modal, Select, Textarea } from '@/components/ui';
import { wqQuoteApi } from '../api/wqApi';
import { copyText } from '../utils/download';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'saved', label: 'Ready (Saved)' },
  { value: 'sent', label: 'Sent to Client' },
  { value: 'viewed', label: 'Viewed by Client' },
  { value: 'accepted', label: 'Accepted ✅' },
  { value: 'revision_requested', label: 'Revision Requested 🔄' },
  { value: 'rejected', label: 'Declined' },
  { value: 'expired', label: 'Expired ⏰' },
];

export const ShareQuoteModal = ({ open, onClose, quoteId, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState('');
  const [customName, setCustomName] = useState('');
  const [validDays, setValidDays] = useState('7');
  const [statusVal, setStatusVal] = useState('sent');
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!open || !quoteId) {
      setShareData(null);
      setCopied(false);
      return;
    }

    setLoading(true);
    wqQuoteApi
      .share(quoteId)
      .then((res) => {
        setShareData(res);
        setStatusVal(res.quote?.status || 'sent');
        setCustomName(res.quote?.clientContact?.name || res.quote?.label || '');
        setCustomPhone(res.quote?.clientContact?.phone || '');
        if (res.quote?.validUntil) {
          const diff = Math.ceil((new Date(res.quote.validUntil) - new Date()) / (1000 * 60 * 60 * 24));
          if (diff > 0) setValidDays(String(diff));
        }
        if (onUpdated) onUpdated(res.quote);
      })
      .catch((e) => {
        toast.error(e?.response?.data?.message || 'Could not generate share link');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, quoteId]);

  if (!open) return null;

  const quote = shareData?.quote;
  const shareUrl = shareData?.shareUrl || (quote?.shareToken ? `${window.location.origin}/quote/${quote.shareToken}` : '');

  const handleCopy = async () => {
    if (!shareUrl) return;
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      toast.success('Proposal link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenClientView = () => {
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const handleSaveDetails = async () => {
    if (!quoteId) return;
    setSavingStatus(true);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(validDays || 7));

      const updated = await wqQuoteApi.update(quoteId, {
        status: statusVal,
        validUntil: expiry,
        clientContact: {
          name: customName,
          phone: customPhone,
        },
      });

      toast.success('Quote details updated');
      setShareData((prev) => ({ ...prev, quote: updated.quote }));
      if (onUpdated) onUpdated(updated.quote);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update details');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!shareData?.whatsappText) return;
    const cleanPhone = (customPhone || '').replace(/[^0-9]/g, '');
    let url = '';
    if (cleanPhone) {
      const intl = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      url = `https://wa.me/${intl}?text=${encodeURIComponent(shareData.whatsappText)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.whatsappText)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-brand-600" />
          <span>Share Proposal with Client</span>
          {quote?.quoteCode && (
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold border border-brand-200">
              #{quote.quoteCode}
            </span>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="py-12 text-center text-ink-500">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="mt-3 text-sm">Generating proposal link…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-surface-50 p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-500">Current Status:</span>
              <Badge
                tone={
                  statusVal === 'accepted'
                    ? 'success'
                    : statusVal === 'viewed'
                      ? 'warning'
                      : statusVal === 'sent'
                        ? 'primary'
                        : 'neutral'
                }
              >
                {STATUS_OPTIONS.find((s) => s.value === statusVal)?.label || statusVal}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-ink-400" />
                {quote?.viewCount || 0} views
              </span>
              {quote?.viewedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-ink-400" />
                  Viewed {new Date(quote.viewedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Client Link Box */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Client-Facing Proposal Link
            </label>
            <p className="mt-0.5 text-xs text-ink-500">
              The couple can open this link on mobile or desktop to review the package, dates, deliverables and accept.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 select-all focus:outline-none"
              />
              <Button
                variant="secondary"
                icon={copied ? Check : Copy}
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="ghost"
                iconOnly
                icon={ExternalLink}
                aria-label="Open client view"
                onClick={handleOpenClientView}
                title="Open client view in new tab"
              />
            </div>
          </div>

          {/* WhatsApp Direct Share Button */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  Instant WhatsApp Message
                </p>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  Sends a ready-to-share message with your studio branding, package total &amp; link.
                </p>
              </div>
              <Button
                tone="success"
                icon={MessageCircle}
                onClick={handleSendWhatsApp}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Send via WhatsApp
              </Button>
            </div>
          </div>

          {/* Client Details & Expiry Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-ink-100 pt-5">
            <div>
              <Input
                label="Client Name"
                placeholder="e.g. Rahul &amp; Priya"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Client Phone (WhatsApp)"
                placeholder="10-digit number"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="Offer Validity"
                value={validDays}
                onChange={(e) => setValidDays(e.target.value)}
              >
                <option value="3">3 Days</option>
                <option value="7">7 Days (Recommended)</option>
                <option value="15">15 Days</option>
                <option value="30">30 Days</option>
              </Select>
            </div>
          </div>

          {/* Status Manual Override */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-ink-100 pt-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-700">Update Status:</span>
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-900 focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="secondary"
              size="sm"
              loading={savingStatus}
              onClick={handleSaveDetails}
            >
              Save Details
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ShareQuoteModal;
