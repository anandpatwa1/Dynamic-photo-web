import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  PageLoader,
  Switch,
} from '@/components/ui';
import { useWebsiteContent } from './useWebsiteContent';
import { SECTION_LABELS } from './sectionMeta';

// Built-in sections that appear in the header menu, with their default wording.
const MENU_DEFAULTS = { hero: 'Home', portfolio: 'Portfolio', packages: 'Packages', about: 'About Us', contact: 'Contact' };

export const WebsiteSettings = () => {
  const { content, loading, saving, save } = useWebsiteContent();
  const [analyticsId, setAnalyticsId] = useState('');
  const [navLabels, setNavLabels] = useState({});
  const [enquiryLabel, setEnquiryLabel] = useState('');

  useEffect(() => {
    setAnalyticsId(content?.settings?.analyticsId ?? '');
    setNavLabels(content?.settings?.navLabels ?? {});
    setEnquiryLabel(content?.settings?.enquiryLabel ?? '');
  }, [content]);

  if (loading && !content) return <PageLoader label="Loading website settings" />;

  const settings = content?.settings ?? {};
  const sectionsEnabled = settings.sectionsEnabled ?? {};

  return (
    <>
      <PageHeader
        title="Website Settings"
        description="Global switches for the public site."
        actions={
          <Button
            as="a"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            iconRight={ExternalLink}
          >
            View website
          </Button>
        }
      />

      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Visibility</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-base font-medium text-ink-900">Maintenance mode</p>
                <p className="mt-1 text-sm text-ink-500">
                  Replaces the site with a holding page. The CRM at /CRM keeps working.
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode ?? false}
                onChange={(event) =>
                  save({ settings: { maintenanceMode: event.target.checked } }, { silent: true })
                }
                aria-label="Maintenance mode"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Sections</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {(settings.sectionOrder ?? []).map((key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-base text-ink-800">{SECTION_LABELS[key] ?? key}</span>
                <Switch
                  checked={sectionsEnabled[key] !== false}
                  disabled={key === 'hero'}
                  onChange={(event) =>
                    save({ settings: { sectionsEnabled: { [key]: event.target.checked } } }, { silent: true })
                  }
                  aria-label={`Show the ${SECTION_LABELS[key] ?? key} section`}
                />
              </div>
            ))}
            <p className="pt-1 text-sm text-ink-500">
              Section order is set on the Homepage screen.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Menu wording</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-ink-500">
              Rename the links in the website header and footer. Leave a box empty to use the default. Sections you add under
              Sections &amp; Videos get their own wording there.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(MENU_DEFAULTS).map(([key, fallback]) => (
                <Input
                  key={key}
                  label={SECTION_LABELS[key] ?? key}
                  value={navLabels[key] ?? ''}
                  placeholder={fallback}
                  maxLength={30}
                  onChange={(event) => setNavLabels((current) => ({ ...current, [key]: event.target.value }))}
                />
              ))}
            </div>
            <Input
              label="Header button"
              value={enquiryLabel}
              placeholder="Enquiry Now"
              maxLength={24}
              onChange={(event) => setEnquiryLabel(event.target.value)}
            />
            <Button onClick={() => save({ settings: { navLabels, enquiryLabel } })} loading={saving}>
              Save menu wording
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Analytics</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Measurement ID"
              placeholder="G-XXXXXXXXXX"
              value={analyticsId}
              onChange={(event) => setAnalyticsId(event.target.value)}
            />
            <Button onClick={() => save({ settings: { analyticsId } })} loading={saving}>
              Save analytics
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default WebsiteSettings;
