import { useEffect, useState } from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  PageLoader,
  Textarea,
} from '@/components/ui';
import { SlotImageUpload } from '@/components/website/SlotImageUpload';
import { useWebsiteContent } from './useWebsiteContent';

/** Google truncates around these lengths; the counters are advisory, not limits. */
const TITLE_IDEAL = 60;
const DESCRIPTION_IDEAL = 155;

const counterTone = (length, ideal) => {
  if (length === 0) return 'text-ink-500';
  if (length > ideal) return 'text-warning-700';
  return 'text-success-700';
};

export const WebsiteSeo = () => {
  const { content, loading, saving, save, uploadImage } = useWebsiteContent();
  const [draft, setDraft] = useState({});

  useEffect(() => setDraft(content?.seo ?? {}), [content]);

  if (loading && !content) return <PageLoader label="Loading SEO settings" />;

  const set = (field) => (event) =>
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));

  const titleLength = (draft.title ?? '').length;
  const descriptionLength = (draft.description ?? '').length;

  return (
    <>
      <PageHeader
        title="SEO"
        description="How the site appears in search results and when someone shares the link."
      />

      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Search listing</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Meta title"
              value={draft.title ?? ''}
              onChange={set('title')}
              maxLength={70}
            />
            <p className={`-mt-2 text-xs ${counterTone(titleLength, TITLE_IDEAL)}`}>
              {titleLength}/{TITLE_IDEAL} characters
              {titleLength > TITLE_IDEAL && ' — Google will truncate this'}
            </p>

            <Textarea
              label="Meta description"
              rows={3}
              value={draft.description ?? ''}
              onChange={set('description')}
              maxLength={200}
            />
            <p className={`-mt-2 text-xs ${counterTone(descriptionLength, DESCRIPTION_IDEAL)}`}>
              {descriptionLength}/{DESCRIPTION_IDEAL} characters
              {descriptionLength > DESCRIPTION_IDEAL && ' — Google will truncate this'}
            </p>

            <Input
              label="Canonical URL"
              placeholder="https://dynamicproduction.com"
              value={draft.canonicalUrl ?? ''}
              onChange={set('canonicalUrl')}
            />

            <Input
              label="Keywords"
              hint="Comma separated. Minor ranking value, but harmless."
              value={(draft.keywords ?? []).join(', ')}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  keywords: event.target.value
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                }))
              }
            />
          </CardBody>
        </Card>

        {/* A live preview is worth more than any amount of guidance about length. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Preview</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="rounded-xl border border-ink-200 p-4">
              <p className="text-xs text-ink-500">
                {draft.canonicalUrl || 'https://your-domain.com'}
              </p>
              <p className="mt-1 truncate text-lg text-info-700">
                {draft.title || 'Your page title will appear here'}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-600">
                {draft.description || 'Your meta description will appear here.'}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Share image</CardTitle>
          </CardHeader>
          <CardBody>
            <SlotImageUpload
              slot="heroDesktop"
              label="Open Graph image — shown on WhatsApp, Facebook and X"
              value={content?.seo?.ogImage}
              onUpload={({ file, slot, alt }) =>
                uploadImage({ path: 'seo.ogImage', slot, alt, file })
              }
            />
          </CardBody>
        </Card>

        <Button onClick={() => save({ seo: { ...draft, ogImage: undefined } })} loading={saving}>
          Save SEO settings
        </Button>
      </div>
    </>
  );
};

export default WebsiteSeo;
