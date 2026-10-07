import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Ban, Mail, MessageSquare, Phone, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Badge,
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PageLoader,
  Select,
  Toolbar,
} from '@/components/ui';
import { websiteApi } from '@/api/websiteApi';
import { CRM } from '@/routes/paths';
import { formatDate } from '@/utils/format';
import { INQUIRY_STATUS_META } from './sectionMeta';

const STATUS_FILTERS = [
  { value: '', label: 'All enquiries' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
  { value: 'spam', label: 'Spam' },
];

/**
 * The moderation queue between the public form and the CRM.
 *
 * Nothing here writes to Clients automatically — see the note on the Inquiry
 * model. Converting is a deliberate, one-click act by a human, which is what
 * keeps bot submissions out of the studio's real client list.
 */
export const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [converting, setConverting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { inquiries: rows } = await websiteApi.inquiries.list({ status: status || undefined });
      setInquiries(rows);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not load enquiries.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const setInquiryStatus = async (inquiry, next) => {
    setBusyId(inquiry._id);
    try {
      await websiteApi.inquiries.setStatus(inquiry._id, next);
      toast.success(`Marked as ${INQUIRY_STATUS_META[next]?.label.toLowerCase()}.`);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'That could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  const convert = async () => {
    const inquiry = converting;
    setConverting(null);
    setBusyId(inquiry._id);

    try {
      const { message } = await websiteApi.inquiries.convert(inquiry._id);
      // The server distinguishes a new lead from a link to an existing client,
      // and the admin needs to know which happened.
      toast.success(message ?? 'Converted to a lead.');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'That enquiry could not be converted.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading && inquiries.length === 0) return <PageLoader label="Loading enquiries" />;

  return (
    <>
      <PageHeader
        title="Website Inquiries"
        description="Everything submitted through the public enquiry form. Convert the real ones into CRM leads."
      />

      <Toolbar className="mb-6">
        <Select
          options={STATUS_FILTERS}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter enquiries by status"
          className="w-56"
        />
      </Toolbar>

      {inquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No enquiries yet"
          description="Submissions from the website's contact form will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inquiry) => {
            const meta = INQUIRY_STATUS_META[inquiry.status] ?? INQUIRY_STATUS_META.new;
            const busy = busyId === inquiry._id;

            return (
              <li key={inquiry._id}>
                <Card>
                  <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-md font-semibold text-ink-900">{inquiry.name}</h3>
                        <Badge tone={meta.tone} size="sm">
                          {meta.label}
                        </Badge>
                        {inquiry.packageInterest && (
                          <Badge tone="brand" size="sm">
                            {inquiry.packageInterest}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-600">
                        {inquiry.phone && (
                          <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1.5 hover:text-ink-900">
                            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                            {inquiry.phone}
                          </a>
                        )}
                        {inquiry.email && (
                          <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1.5 hover:text-ink-900">
                            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                            {inquiry.email}
                          </a>
                        )}
                        {inquiry.eventType && <span>{inquiry.eventType}</span>}
                        {inquiry.eventDate && <span>{formatDate(inquiry.eventDate)}</span>}
                      </div>

                      {inquiry.message && (
                        <p className="mt-3 text-pretty text-sm leading-relaxed text-ink-600">
                          {inquiry.message}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-ink-400">
                        Received {formatDate(inquiry.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {inquiry.client ? (
                        <Button
                          as={Link}
                          to={CRM.client(inquiry.client._id ?? inquiry.client)}
                          variant="secondary"
                          size="sm"
                          iconRight={ArrowRight}
                        >
                          View client
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            icon={UserPlus}
                            loading={busy}
                            onClick={() => setConverting(inquiry)}
                          >
                            Convert to Lead
                          </Button>
                          {inquiry.status === 'new' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busy}
                              onClick={() => setInquiryStatus(inquiry, 'contacted')}
                            >
                              Mark contacted
                            </Button>
                          )}
                          {inquiry.status !== 'spam' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Ban}
                              disabled={busy}
                              onClick={() => setInquiryStatus(inquiry, 'spam')}
                              aria-label={`Mark the enquiry from ${inquiry.name} as spam`}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(converting)}
        onClose={() => setConverting(null)}
        onConfirm={convert}
        title="Convert to a CRM lead?"
        message={
          converting
            ? `${converting.name} will be added to Clients as a lead with source “website”. ` +
              'If they are already a client, this links the enquiry to that record instead of creating a duplicate.'
            : ''
        }
        confirmLabel="Convert to Lead"
        // Not destructive — the default danger tone would dress a positive
        // action up as a delete.
        tone="warning"
      />
    </>
  );
};

export default Inquiries;
