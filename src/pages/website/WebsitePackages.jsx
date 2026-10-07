import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package as PackageIcon, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  PageHeader,
  PageLoader,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';
import { SlotImageUpload } from '@/components/website/SlotImageUpload';
import { SortableGrid } from '@/components/website/SortableGrid';
import { websiteApi } from '@/api/websiteApi';
import { CRM } from '@/routes/paths';
import { SectionHeadingCard } from './SectionHeadingCard';
import { ICON_OPTIONS } from './sectionMeta';

/**
 * Decides how CRM packages are presented publicly.
 *
 * Deliberately no create or delete: a package is a CRM entity that gets priced,
 * quoted and invoiced. Duplicating that here would give the studio two places
 * to define what it sells. This screen only answers "does this appear on the
 * website, and how does it read there?".
 *
 * No price field appears anywhere, because the public site never shows one.
 */
export const WebsitePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { packages: rows } = await websiteApi.packages.list();
      setPackages(rows);
      setDrafts(
        Object.fromEntries(
          rows.map((pkg) => [
            pkg._id,
            {
              displayTitle: pkg.website?.displayTitle ?? '',
              tagline: pkg.website?.tagline ?? '',
              highlights: (pkg.website?.highlights ?? []).join('\n'),
            },
          ]),
        ),
      );
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not load packages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (pkg, changes, { silent = false } = {}) => {
    setSavingId(pkg._id);
    try {
      await websiteApi.packages.update(pkg._id, changes);
      if (!silent) toast.success('Saved.');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'That change could not be saved.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading && packages.length === 0) return <PageLoader label="Loading packages" />;

  if (packages.length === 0) {
    return (
      <>
        <PageHeader title="Website Packages" description="Choose which packages appear on the site." />
        <EmptyState
          icon={PackageIcon}
          title="No active packages"
          description="Create a package in the CRM first — this screen only controls how existing packages are presented publicly."
          action={
            <Button as={Link} to={CRM.packages}>
              Go to Packages
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Website Packages"
        description="Which packages appear publicly, and how they read. The site shows Enquire Now instead of a price."
      />

      <SectionHeadingCard sectionKey="packagesSection" label="Section heading">
        {({ draft, setDraft }) => {
          const pillars = Array.isArray(draft.pillars) ? draft.pillars : [];
          const cta = draft.cta ?? {};
          return (
            <>
              <div className="border-t border-ink-200/70 pt-4">
                <p className="mb-3 text-sm font-medium text-ink-800">
                  Pillars — the three icons above the cards
                </p>
                <div className="space-y-3">
                  {pillars.map((pillar, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <Input
                        value={pillar.title ?? ''}
                        wrapperClassName="flex-1"
                        aria-label={`Pillar ${index + 1} title`}
                        onChange={(event) => {
                          const next = [...pillars];
                          next[index] = { ...pillar, title: event.target.value };
                          setDraft((prev) => ({ ...prev, pillars: next }));
                        }}
                      />
                      <Select
                        options={ICON_OPTIONS}
                        value={pillar.icon ?? 'sparkles'}
                        wrapperClassName="w-36"
                        aria-label={`Pillar ${index + 1} icon`}
                        onChange={(event) => {
                          const next = [...pillars];
                          next[index] = { ...pillar, icon: event.target.value };
                          setDraft((prev) => ({ ...prev, pillars: next }));
                        }}
                      />
                      <Button
                        variant="ghost"
                        iconOnly
                        icon={Trash2}
                        aria-label={`Remove pillar ${index + 1}`}
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            pillars: pillars.filter((_, i) => i !== index),
                          }))
                        }
                      />
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        pillars: [...pillars, { title: '', icon: 'sparkles' }],
                      }))
                    }
                  >
                    Add pillar
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 border-t border-ink-200/70 pt-4 sm:grid-cols-3">
                <Input
                  label="CTA heading"
                  value={cta.title ?? ''}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, cta: { ...cta, title: event.target.value } }))
                  }
                />
                <Input
                  label="CTA body"
                  value={cta.body ?? ''}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, cta: { ...cta, body: event.target.value } }))
                  }
                />
                <Input
                  label="CTA button"
                  value={cta.label ?? ''}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, cta: { ...cta, label: event.target.value } }))
                  }
                />
              </div>
            </>
          );
        }}
      </SectionHeadingCard>

      <SortableGrid
        items={packages}
        getKey={(pkg) => pkg._id}
        onReorder={(order) => websiteApi.packages.reorder(order)}
        className="space-y-4"
        itemClassName=""
        renderItem={(pkg) => {
          const draft = drafts[pkg._id] ?? {};
          const visible = pkg.website?.isVisible ?? false;

          return (
            <Card>
              <CardBody className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 pl-7">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Badge tone={visible ? 'success' : 'neutral'} size="sm">
                        {visible ? 'On the website' : 'Hidden'}
                      </Badge>
                    </div>
                    <h3 className="text-md font-semibold text-ink-900">{pkg.name}</h3>
                    <p className="mt-0.5 text-sm text-ink-500">CRM name</p>
                  </div>

                  <Switch
                    checked={visible}
                    onChange={(event) => update(pkg, { isVisible: event.target.checked }, { silent: true })}
                    aria-label={`Show ${pkg.name} on the website`}
                  />
                </div>

                {visible && (
                  <div className="grid gap-5 border-t border-ink-200/70 pt-5 lg:grid-cols-2">
                    <div className="space-y-4">
                      <Input
                        label="Public name"
                        placeholder={pkg.name}
                        value={draft.displayTitle}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [pkg._id]: { ...draft, displayTitle: event.target.value },
                          }))
                        }
                      />
                      <Input
                        label="Tagline"
                        placeholder={pkg.description}
                        value={draft.tagline}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [pkg._id]: { ...draft, tagline: event.target.value },
                          }))
                        }
                      />
                      <Textarea
                        label="Highlights"
                        rows={4}
                        hint="One per line. Leave empty to use the CRM deliverables."
                        value={draft.highlights}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [pkg._id]: { ...draft, highlights: event.target.value },
                          }))
                        }
                      />
                      <Button
                        loading={savingId === pkg._id}
                        onClick={() =>
                          update(pkg, {
                            displayTitle: draft.displayTitle,
                            tagline: draft.tagline,
                            highlights: draft.highlights
                              .split('\n')
                              .map((line) => line.trim())
                              .filter(Boolean),
                          })
                        }
                      >
                        Save presentation
                      </Button>
                    </div>

                    <SlotImageUpload
                      slot="galleryLandscape"
                      label="Package image"
                      value={pkg.website?.coverImage}
                      onUpload={async ({ file, slot, alt }) => {
                        await websiteApi.packages.uploadImage(pkg._id, { file, slot, alt });
                        toast.success('Image uploaded.');
                        await load();
                      }}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          );
        }}
      />
    </>
  );
};

export default WebsitePackages;
