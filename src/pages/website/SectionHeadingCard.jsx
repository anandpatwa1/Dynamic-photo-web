import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Textarea } from '@/components/ui';
import { useWebsiteContent } from './useWebsiteContent';

/**
 * Edits the heading of one public section.
 *
 * Portfolio, Packages and Testimonials each have a title, a lead line and
 * sometimes a button label stored on the WebsiteContent singleton. Those live
 * on the same screen that manages the section's records, rather than being
 * gathered onto a distant "copy" page — an admin renaming the Portfolio heading
 * expects to do it where the portfolio is.
 *
 * `children` lets a screen add fields specific to its section without this
 * component knowing about them.
 */
export const SectionHeadingCard = ({
  sectionKey,
  label = 'Section heading',
  withCta = false,
  children,
}) => {
  const { content, saving, save } = useWebsiteContent();
  const [draft, setDraft] = useState({});

  useEffect(() => setDraft(content?.[sectionKey] ?? {}), [content, sectionKey]);

  const set = (field) => (event) =>
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-md">{label}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Title" value={draft.title ?? ''} onChange={set('title')} />
          {withCta && (
            <Input label="Button label" value={draft.ctaLabel ?? ''} onChange={set('ctaLabel')} />
          )}
        </div>

        <Textarea label="Lead line" rows={2} value={draft.subtitle ?? ''} onChange={set('subtitle')} />

        {typeof children === 'function' ? children({ draft, setDraft }) : children}

        <Button onClick={() => save({ [sectionKey]: draft })} loading={saving}>
          Save heading
        </Button>
      </CardBody>
    </Card>
  );
};
