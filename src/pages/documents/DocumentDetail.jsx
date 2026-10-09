import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRightLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Pencil,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Dropdown,
  DropdownDivider,
  DropdownItem,
  PageHeader,
  PageLoader,
  SegmentedControl,
  StatusBadge,
} from '@/components/ui';
import {
  fetchDocument,
  updateDocumentStatus,
  convertDocument,
  duplicateDocument,
  deleteDocument,
  selectCurrentDocument,
  selectDocumentLoading,
  selectDocumentSaving,
  clearCurrentDocument,
} from '@/redux/document/documentSlice';
import { documentApi } from '@/api/documentApi';
import { DocumentPreview } from '@/components/pdf/DocumentPreview';
import { useAuth } from '@/hooks/useAuth';
import { DOCUMENT_STATUS_META, DOCUMENT_TYPE_OPTIONS, PDF_THEMES, PERMISSIONS } from '@/constants';
import { formatCurrency, formatDate } from '@/utils/format';

const STATUS_ACTIONS = [
  { status: 'sent', label: 'Mark as sent', icon: Send },
  { status: 'accepted', label: 'Mark as accepted', icon: Check },
  { status: 'rejected', label: 'Mark as rejected', icon: X },
];

export const DocumentDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const doc = useSelector(selectCurrentDocument);
  const loading = useSelector(selectDocumentLoading);
  const saving = useSelector(selectDocumentSaving);
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.DOCUMENTS_CREATE);
  const canEdit = can(PERMISSIONS.DOCUMENTS_EDIT);
  const canDelete = can(PERMISSIONS.DOCUMENTS_DELETE);

  // Preview theme is local — it never changes the stored document.
  const [previewTheme, setPreviewTheme] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDocument(id));
    return () => dispatch(clearCurrentDocument());
  }, [dispatch, id]);

  useEffect(() => {
    if (doc?.theme) setPreviewTheme(doc.theme);
  }, [doc?.theme]);

  // Re-render the preview whenever the document or the chosen theme changes.
  useEffect(() => {
    if (!doc?._id) return undefined;

    let cancelled = false;
    setPreviewLoading(true);

    documentApi
      .preview(id, previewTheme)
      .then((html) => {
        if (!cancelled) setPreviewHtml(html);
      })
      .catch(() => {
        if (!cancelled) setPreviewHtml('');
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, previewTheme, doc?._id, doc?.updatedAt]);

  const handleStatus = async (status) => {
    const result = await dispatch(updateDocumentStatus({ id, status }));
    if (updateDocumentStatus.fulfilled.match(result)) toast.success('Status updated');
    else toast.error(result.payload?.message ?? 'Could not update the status');
  };

  const handleConvert = async (type) => {
    const result = await dispatch(convertDocument({ id, type }));
    if (convertDocument.fulfilled.match(result)) {
      toast.success(`${result.payload.document.number} created`);
      navigate(`/CRM/documents/${result.payload.document._id}`);
    } else {
      toast.error(result.payload?.message ?? 'Could not convert');
    }
  };

  const handleDuplicate = async () => {
    const result = await dispatch(duplicateDocument(id));
    if (duplicateDocument.fulfilled.match(result)) {
      toast.success('Duplicated');
      navigate(`/CRM/documents/${result.payload.document._id}/edit`);
    }
  };

  const handleDownload = async () => {
    try {
      await documentApi.download(id, { theme: previewTheme, filename: `${doc.number}.pdf` });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Could not generate the PDF');
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteDocument(id));
    if (deleteDocument.fulfilled.match(result)) {
      toast.success('Document removed');
      navigate('/CRM/documents', { replace: true });
    } else {
      toast.error(result.payload?.message ?? 'Could not delete');
      setConfirmOpen(false);
    }
  };

  if (loading && !doc) return <PageLoader label="Loading document" />;

  if (!doc) {
    return (
      <Card>
        <CardBody className="py-16 text-center">
          <p className="text-md text-ink-500">This document could not be found.</p>
          <Button as={Link} to="/CRM/documents" variant="secondary" className="mt-5">
            Back to documents
          </Button>
        </CardBody>
      </Card>
    );
  }

  const convertTargets = DOCUMENT_TYPE_OPTIONS.filter((option) => option.value !== doc.type);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Documents', to: '/documents' }, { label: doc.number }]}
        title={doc.number}
        description={doc.clientSnapshot?.name}
        actions={
          <>
            <Button variant="secondary" icon={ExternalLink} onClick={() => documentApi.openPdf(id, { theme: previewTheme })}>
              Open PDF
            </Button>
            <Button icon={Download} onClick={handleDownload}>
              Download
            </Button>

            {(canCreate || canEdit || canDelete) && (
              <Dropdown
                align="right"
                trigger={({ toggle }) => (
                  <Button variant="secondary" iconOnly icon={Pencil} onClick={toggle} aria-label="More actions" />
                )}
              >
                {canEdit && <DropdownItem as={Link} to={`/CRM/documents/${id}/edit`} icon={Pencil}>Edit document</DropdownItem>}
                {canCreate && <DropdownItem icon={Copy} onClick={handleDuplicate}>Duplicate</DropdownItem>}

                {canEdit && <DropdownDivider />}
                {canEdit && STATUS_ACTIONS.filter((action) => action.status !== doc.status).map((action) => (
                  <DropdownItem key={action.status} icon={action.icon} onClick={() => handleStatus(action.status)}>
                    {action.label}
                  </DropdownItem>
                ))}

                {canCreate && !doc.convertedTo && convertTargets.length > 0 && (
                  <>
                    <DropdownDivider />
                    {convertTargets.map((target) => (
                      <DropdownItem
                        key={target.value}
                        icon={ArrowRightLeft}
                        onClick={() => handleConvert(target.value)}
                      >
                        Convert to {target.label.toLowerCase()}
                      </DropdownItem>
                    ))}
                  </>
                )}

                {canDelete && <>{(canCreate || canEdit) && <DropdownDivider />}<DropdownItem icon={Trash2} danger onClick={() => setConfirmOpen(true)}>Delete</DropdownItem></>}
              </Dropdown>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-md">Preview</CardTitle>
              <SegmentedControl
                options={PDF_THEMES.map((theme) => ({ value: theme.value, label: theme.label }))}
                value={previewTheme ?? doc.theme}
                onChange={setPreviewTheme}
              />
            </CardHeader>
            {/* The preview renders the exact markup the PDF is produced from,
                scaled to the panel so no column is ever clipped. */}
            <DocumentPreview html={previewHtml} loading={previewLoading} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Summary</CardTitle>
              <StatusBadge status={doc.status} meta={DOCUMENT_STATUS_META} />
            </CardHeader>
            <CardBody className="space-y-3">
              {[
                { label: 'Type', value: <span className="capitalize">{doc.type}</span> },
                { label: 'Date', value: formatDate(doc.date) },
                {
                  label: doc.type === 'invoice' ? 'Due by' : 'Valid until',
                  value: formatDate(doc.validUntil),
                },
                { label: 'Subtotal', value: formatCurrency(doc.subtotal) },
                ...(doc.discountTotal > 0
                  ? [{ label: 'Discount', value: `- ${formatCurrency(doc.discountTotal)}`, tone: 'danger' }]
                  : []),
                ...(doc.taxTotal > 0
                  ? [{ label: doc.taxLabel ?? 'Tax', value: formatCurrency(doc.taxTotal) }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink-500">{row.label}</span>
                  <span
                    className={`tabular text-sm font-medium ${
                      row.tone === 'danger' ? 'text-danger-600' : 'text-ink-900'
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between gap-3 border-t border-ink-200/70 pt-3">
                <span className="text-md font-semibold text-ink-900">Total</span>
                <span className="tabular text-lg font-semibold text-ink-900">
                  {formatCurrency(doc.total)}
                </span>
              </div>

              {doc.amountPaid > 0 && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink-500">Received</span>
                    <span className="tabular text-sm font-medium text-success-600">
                      {formatCurrency(doc.amountPaid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink-500">Balance due</span>
                    <span className="tabular text-sm font-semibold text-warning-700">
                      {formatCurrency(doc.balanceDue)}
                    </span>
                  </div>
                </>
              )}

              <p className="border-t border-ink-200/70 pt-3 text-xs italic text-ink-500">
                {doc.amountInWords}
              </p>
            </CardBody>
          </Card>

          {(doc.convertedFrom || doc.convertedTo) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Linked documents</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {doc.convertedFrom && (
                  <Link
                    to={`/CRM/documents/${doc.convertedFrom._id}`}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 ring-1 ring-inset ring-ink-200 transition-colors hover:bg-ink-50"
                  >
                    <FileText className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    <span className="text-sm text-ink-700">
                      Created from <span className="tabular font-medium">{doc.convertedFrom.number}</span>
                    </span>
                  </Link>
                )}
                {doc.convertedTo && (
                  <Link
                    to={`/CRM/documents/${doc.convertedTo._id}`}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 ring-1 ring-inset ring-ink-200 transition-colors hover:bg-ink-50"
                  >
                    <FileText className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    <span className="text-sm text-ink-700">
                      Converted to <span className="tabular font-medium">{doc.convertedTo.number}</span>
                    </span>
                  </Link>
                )}
              </CardBody>
            </Card>
          )}

          {doc.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Internal notes</CardTitle>
                <Badge tone="neutral" size="sm">
                  Not printed
                </Badge>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {doc.internalNotes}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={saving}
        title={`Delete ${doc.number}?`}
        message="Only drafts are deleted outright. An issued document is cancelled instead, so your numbering stays auditable."
        confirmLabel="Delete document"
      />
    </>
  );
};

export default DocumentDetail;
