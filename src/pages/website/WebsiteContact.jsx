import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  PageLoader,
  Select,
  Textarea,
} from '@/components/ui';
import { useWebsiteContent } from './useWebsiteContent';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
];

export const WebsiteContact = () => {
  const { content, loading, saving, save } = useWebsiteContent();
  const [draft, setDraft] = useState({});

  useEffect(() => setDraft(content?.contact ?? {}), [content]);

  if (loading && !content) return <PageLoader label="Loading contact details" />;

  const set = (field) => (event) =>
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));

  const socials = draft.socials ?? [];

  return (
    <>
      <PageHeader
        title="Contact"
        description="How people reach you. These appear in the contact section and the footer."
      />

      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Section copy</CardTitle>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input label="Eyebrow" value={draft.eyebrow ?? ''} onChange={set('eyebrow')} />
            <Input label="Heading" value={draft.title ?? ''} onChange={set('title')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Details</CardTitle>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" value={draft.phone ?? ''} onChange={set('phone')} />
            <Input label="WhatsApp" value={draft.whatsapp ?? ''} onChange={set('whatsapp')} />
            <Input label="Email" type="email" value={draft.email ?? ''} onChange={set('email')} />
            <Input label="Business hours" value={draft.hours ?? ''} onChange={set('hours')} />
            <Textarea
              label="Address"
              rows={2}
              wrapperClassName="sm:col-span-2"
              value={draft.address ?? ''}
              onChange={set('address')}
            />
            <Input
              label="Google Maps embed URL"
              wrapperClassName="sm:col-span-2"
              hint="The src from a Google Maps “Embed a map” iframe."
              value={draft.mapEmbedUrl ?? ''}
              onChange={set('mapEmbedUrl')}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Social profiles</CardTitle>
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  socials: [...socials, { platform: 'instagram', url: '' }],
                }))
              }
            >
              Add
            </Button>
          </CardHeader>
          <CardBody className="space-y-3">
            {socials.length === 0 && (
              <p className="text-sm text-ink-500">No profiles linked yet.</p>
            )}
            {socials.map((social, index) => (
              <div key={index} className="flex items-end gap-3">
                <Select
                  label={index === 0 ? 'Platform' : undefined}
                  options={PLATFORMS}
                  value={social.platform}
                  wrapperClassName="w-44"
                  onChange={(event) => {
                    const next = [...socials];
                    next[index] = { ...social, platform: event.target.value };
                    setDraft((prev) => ({ ...prev, socials: next }));
                  }}
                />
                <Input
                  label={index === 0 ? 'Profile URL' : undefined}
                  wrapperClassName="flex-1"
                  value={social.url}
                  onChange={(event) => {
                    const next = [...socials];
                    next[index] = { ...social, url: event.target.value };
                    setDraft((prev) => ({ ...prev, socials: next }));
                  }}
                />
                <Button
                  variant="ghost"
                  iconOnly
                  icon={Trash2}
                  aria-label={`Remove the ${social.platform} link`}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      socials: socials.filter((_, i) => i !== index),
                    }))
                  }
                />
              </div>
            ))}
          </CardBody>
        </Card>

        <Button
          onClick={() =>
            save({
              contact: {
                ...draft,
                // Drop half-filled rows rather than saving a social icon that
                // links nowhere.
                socials: socials.filter((social) => social.url?.trim()),
              },
            })
          }
          loading={saving}
        >
          Save contact details
        </Button>
      </div>
    </>
  );
};

export default WebsiteContact;
