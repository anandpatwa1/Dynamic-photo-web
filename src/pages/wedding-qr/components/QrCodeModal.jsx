import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, ExternalLink, QrCode as QrIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, Badge } from '@/components/ui';

export const QrCodeModal = ({ open, onClose, project }) => {
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef(null);

  const getPublicUrl = () => {
    if (!project?.slug) return '';
    const origin = window.location.origin;
    return `${origin}/photos/${project.slug}`;
  };

  const publicUrl = getPublicUrl();

  useEffect(() => {
    if (!open || !publicUrl) return;

    QRCode.toDataURL(publicUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        toast.error('Could not generate QR code preview');
      });
  }, [open, publicUrl]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Public URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const downloadHighResPng = async () => {
    if (!publicUrl) return;
    setDownloading(true);
    try {
      // 1024x1024 high resolution for print signage
      const highResUrl = await QRCode.toDataURL(publicUrl, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      });

      const a = document.createElement('a');
      a.href = highResUrl;
      a.download = `${project.slug}-wedding-qr-print-1024px.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('High-resolution QR code downloaded!');
    } catch (err) {
      console.error('Failed to download QR code:', err);
      toast.error('Could not download QR code image');
    } finally {
      setDownloading(false);
    }
  };

  const downloadSvg = async () => {
    if (!publicUrl) return;
    try {
      const svgString = await QRCode.toString(publicUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.slug}-wedding-qr-vector.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Vector SVG QR code downloaded!');
    } catch (err) {
      console.error('Failed to download SVG QR:', err);
      toast.error('Could not download SVG');
    }
  };

  if (!project) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Wedding Venue QR Code"
      description={`Display or print this QR code at ${project.name} for guests to scan.`}
      size="md"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={downloadSvg}
            >
              SVG (Vector)
            </Button>
            <Button
              variant="brand"
              icon={Download}
              loading={downloading}
              onClick={downloadHighResPng}
            >
              Download Print PNG (1024px)
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center py-2 space-y-4 text-center">
        {/* QR Code Container */}
        <div className="p-4 bg-white border rounded-2xl border-ink-200 shadow-sm inline-block">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR Code for ${project.name}`}
              className="w-56 h-56 rounded-lg object-contain mx-auto"
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-56 h-56 rounded-lg bg-ink-50 text-ink-400">
              <QrIcon className="w-12 h-12 mb-2 animate-pulse" />
              <span className="text-xs">Generating QR...</span>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h4 className="font-semibold text-ink-900">{project.name}</h4>
            <Badge tone={project.isActive ? 'brand' : 'default'} size="sm">
              {project.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {project.description && (
            <p className="text-xs text-ink-500 max-w-sm mx-auto line-clamp-2">
              {project.description}
            </p>
          )}

          {/* URL Box */}
          <div className="flex items-center justify-between max-w-md p-2 mx-auto text-left border rounded-xl bg-ink-50 border-ink-200">
            <span className="font-mono text-xs truncate select-all text-ink-700 mr-2">
              {publicUrl}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="xs"
                variant="ghost"
                icon={copied ? Check : Copy}
                onClick={copyUrl}
                title="Copy URL"
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                as="a"
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                size="xs"
                variant="ghost"
                icon={ExternalLink}
                title="Open Public Page"
              >
                Open
              </Button>
            </div>
          </div>
        </div>

        <p className="text-2xs text-ink-400 max-w-xs">
          Scanning this QR code directs guests to your website landing page to follow your Instagram before unlocking the photo galleries.
        </p>
      </div>
    </Modal>
  );
};

