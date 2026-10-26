import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { PageHeader, PageLoader, Button, Card, CardBody, CardHeader, CardTitle, Input, Select, Textarea, Switch } from '@/components/ui';
import { SlotImageUpload } from '@/components/website/SlotImageUpload';
import { SortableGrid } from '@/components/website/SortableGrid';
import { useWebsiteContent } from './useWebsiteContent';
import { SECTION_LABELS, ICON_OPTIONS } from './sectionMeta';

/** Local draft state so typing does not fire a request per keystroke. */
const useDraft = (source) => {
  const [draft, setDraft] = useState(source ?? {});
  useEffect(() => setDraft(source ?? {}), [source]);
  const set = (field) => (event) =>
    setDraft((prev) => ({ ...prev, [field]: event?.target ? event.target.value : event }));
  return [draft, set, setDraft];
};

export const Homepage = () => {
  const { content, loading, saving, save, uploadImage } = useWebsiteContent();

  const [hero, setHero] = useDraft(content?.hero);
  const [featured, setFeatured] = useDraft(content?.featured);
  const [stats, , setStats] = useDraft(content?.stats);
  const [brand, setBrand] = useDraft(content?.brand);
  const [about, setAbout] = useDraft(content?.about);
  const [featuredIn, , setFeaturedIn] = useDraft(content?.featuredIn);

  if (loading && !content) return <PageLoader label="Loading website content" />;

  const sectionsEnabled = content?.settings?.sectionsEnabled ?? {};
  const sectionOrder = content?.settings?.sectionOrder ?? [];
  const statList = Array.isArray(stats) ? stats : [];
  const cards = Array.isArray(featured.cards) ? featured.cards : [];
  const aboutPillars = Array.isArray(about.pillars) ? about.pillars : [];
  const featuredInList = Array.isArray(featuredIn) ? featuredIn : [];

  return (
    <>
      <PageHeader
        title="Homepage"
        description="The hero, the opening statement and the numbers — everything above the portfolio."
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Brand</CardTitle>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input label="Studio name" value={brand.name ?? ''} onChange={setBrand('name')} />
            <Input
              label="Monogram"
              value={brand.monogram ?? ''}
              onChange={setBrand('monogram')}
              maxLength={4}
            />
            <Input
              label="Tagline"
              wrapperClassName="sm:col-span-2"
              value={brand.tagline ?? ''}
              onChange={setBrand('tagline')}
            />
            <div className="sm:col-span-2">
              <Button onClick={() => save({ brand })} loading={saving}>
                Save brand
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Hero</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Eyebrow" value={hero.eyebrow ?? ''} onChange={setHero('eyebrow')} />
              <Input label="Headline" value={hero.title ?? ''} onChange={setHero('title')} />
              <Input
                label="Script line"
                hint="Set in the signature script, as in “of Love”."
                value={hero.titleScript ?? ''}
                onChange={setHero('titleScript')}
              />
              <Input label="Subtitle" value={hero.subtitle ?? ''} onChange={setHero('subtitle')} />
              <Input label="Button label" value={hero.ctaLabel ?? ''} onChange={setHero('ctaLabel')} />
              <Input label="Button link" value={hero.ctaHref ?? ''} onChange={setHero('ctaHref')} />
            </div>

            <Input
              label="Pillars"
              hint="Comma separated — shown down the right edge of the hero."
              value={(hero.pillars ?? []).join(', ')}
              onChange={(event) =>
                setHero('pillars')(
                  event.target.value
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                )
              }
            />

            <Button onClick={() => save({ hero: { ...hero, slides: undefined } })} loading={saving}>
              Save hero copy
            </Button>

            <div className="border-t border-ink-200/70 pt-5">
              <p className="mb-3 text-sm font-medium text-ink-800">Hero images</p>
              <div className="grid gap-5 sm:grid-cols-2">
                {[0, 1, 2].map((index) => (
                  <SlotImageUpload
                    key={index}
                    slot="heroDesktop"
                    label={`Slide ${index + 1} — desktop`}
                    value={content?.hero?.slides?.[index]}
                    onUpload={({ file, slot, alt }) =>
                      uploadImage({ path: `hero.slides.${index}`, slot, alt, file })
                    }
                  />
                ))}
                <SlotImageUpload
                  slot="heroMobile"
                  label="Mobile crop"
                  value={content?.hero?.slidesMobile?.[0]}
                  onUpload={({ file, slot, alt }) =>
                    uploadImage({ path: 'hero.slidesMobile.0', slot, alt, file })
                  }
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Opening statement</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Eyebrow" value={featured.eyebrow ?? ''} onChange={setFeatured('eyebrow')} />
              <Input label="Heading" value={featured.title ?? ''} onChange={setFeatured('title')} />
            </div>
            <Textarea label="Body" rows={3} value={featured.body ?? ''} onChange={setFeatured('body')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Button label" value={featured.ctaLabel ?? ''} onChange={setFeatured('ctaLabel')} />
              <Input label="Button link" value={featured.ctaHref ?? ''} onChange={setFeatured('ctaHref')} />
            </div>
            <Button onClick={() => save({ featured: { ...featured, cards: undefined } })} loading={saving}>
              Save statement
            </Button>

            <div className="border-t border-ink-200/70 pt-5">
              <p className="mb-1 text-sm font-medium text-ink-800">Category cards</p>
              <p className="mb-4 text-sm text-ink-500">
                The three images beside the statement. Text saves on this card; each
                image uploads on its own.
              </p>

              <div className="grid gap-6 sm:grid-cols-3">
                {[0, 1, 2].map((index) => {
                  const card = cards[index] ?? {};
                  return (
                    <div key={index} className="space-y-3">
                      <Input
                        label={`Card ${index + 1} title`}
                        value={card.title ?? ''}
                        onChange={(event) => {
                          const next = [...cards];
                          next[index] = { ...card, title: event.target.value };
                          setFeatured('cards')(next);
                        }}
                      />
                      <Input
                        label="Caption"
                        value={card.caption ?? ''}
                        onChange={(event) => {
                          const next = [...cards];
                          next[index] = { ...card, caption: event.target.value };
                          setFeatured('cards')(next);
                        }}
                      />
                      <SlotImageUpload
                        slot="portfolioCover"
                        value={content?.featured?.cards?.[index]?.image}
                        onUpload={({ file, slot, alt }) =>
                          uploadImage({ path: `featured.cards.${index}.image`, slot, alt, file })
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <Button
                className="mt-4"
                loading={saving}
                // Images live on the stored document, so only the text is sent —
                // posting the draft's `image` objects back would overwrite the
                // processed assets with whatever the form happens to hold.
                onClick={() =>
                  save({
                    featured: {
                      ...featured,
                      cards: cards.map(({ image, ...text }) => text),
                    },
                  })
                }
              >
                Save card text
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">About us</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Eyebrow" value={about.eyebrow ?? ''} onChange={setAbout('eyebrow')} />
              <Input label="Heading" value={about.title ?? ''} onChange={setAbout('title')} />
            </div>
            <Textarea label="Body" rows={4} value={about.body ?? ''} onChange={setAbout('body')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Signature"
                hint="Set in the script face, under the body copy."
                value={about.signature ?? ''}
                onChange={setAbout('signature')}
              />
              <Input label="Button label" value={about.ctaLabel ?? ''} onChange={setAbout('ctaLabel')} />
            </div>

            <div className="grid gap-5 border-t border-ink-200/70 pt-5 sm:grid-cols-2">
              <SlotImageUpload
                slot="portfolioCover"
                label="Portrait"
                value={content?.about?.portrait}
                onUpload={({ file, slot, alt }) =>
                  uploadImage({ path: 'about.portrait', slot, alt, file })
                }
              />

              <div>
                <p className="mb-3 text-sm font-medium text-ink-800">
                  Pillars — the dark strip below About
                </p>
                <div className="space-y-3">
                  {aboutPillars.map((pillar, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <Input
                        value={pillar.title ?? ''}
                        wrapperClassName="flex-1"
                        aria-label={`Pillar ${index + 1} title`}
                        onChange={(event) => {
                          const next = [...aboutPillars];
                          next[index] = { ...pillar, title: event.target.value };
                          setAbout('pillars')(next);
                        }}
                      />
                      <Select
                        options={ICON_OPTIONS}
                        value={pillar.icon ?? 'camera'}
                        wrapperClassName="w-36"
                        aria-label={`Pillar ${index + 1} icon`}
                        onChange={(event) => {
                          const next = [...aboutPillars];
                          next[index] = { ...pillar, icon: event.target.value };
                          setAbout('pillars')(next);
                        }}
                      />
                      <Button
                        variant="ghost"
                        iconOnly
                        icon={Trash2}
                        aria-label={`Remove pillar ${index + 1}`}
                        onClick={() => setAbout('pillars')(aboutPillars.filter((_, i) => i !== index))}
                      />
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => setAbout('pillars')([...aboutPillars, { title: '', icon: 'camera' }])}
                  >
                    Add pillar
                  </Button>
                </div>
              </div>
            </div>

            {/* `portrait` is omitted: it is uploaded separately, and posting the
                draft's copy back would overwrite the processed asset. */}
            <Button
              onClick={() => save({ about: { ...about, portrait: undefined } })}
              loading={saving}
            >
              Save about
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Featured in</CardTitle>
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => setFeaturedIn([...featuredInList, { name: '' }])}
            >
              Add
            </Button>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-ink-500">
              The publication names in the strip under the hero.
            </p>
            {featuredInList.map((entry, index) => (
              <div key={index} className="flex items-end gap-2">
                <Input
                  value={entry.name ?? ''}
                  wrapperClassName="flex-1"
                  aria-label={`Publication ${index + 1}`}
                  onChange={(event) => {
                    const next = [...featuredInList];
                    next[index] = { name: event.target.value };
                    setFeaturedIn(next);
                  }}
                />
                <Button
                  variant="ghost"
                  iconOnly
                  icon={Trash2}
                  aria-label={`Remove publication ${index + 1}`}
                  onClick={() => setFeaturedIn(featuredInList.filter((_, i) => i !== index))}
                />
              </div>
            ))}
            <Button
              onClick={() => save({ featuredIn: featuredInList.filter((e) => e.name?.trim()) })}
              loading={saving}
            >
              Save publications
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Statistics</CardTitle>
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => setStats([...statList, { value: '', label: '', icon: 'camera' }])}
            >
              Add
            </Button>
          </CardHeader>
          <CardBody className="space-y-3">
            {statList.map((stat, index) => (
              <div key={index} className="flex items-end gap-3">
                <Input
                  label={index === 0 ? 'Figure' : undefined}
                  value={stat.value ?? ''}
                  wrapperClassName="w-32"
                  onChange={(event) => {
                    const next = [...statList];
                    next[index] = { ...stat, value: event.target.value };
                    setStats(next);
                  }}
                />
                <Input
                  label={index === 0 ? 'Caption' : undefined}
                  value={stat.label ?? ''}
                  wrapperClassName="flex-1"
                  onChange={(event) => {
                    const next = [...statList];
                    next[index] = { ...stat, label: event.target.value };
                    setStats(next);
                  }}
                />
                <Button
                  variant="ghost"
                  iconOnly
                  icon={Trash2}
                  aria-label={`Remove statistic ${index + 1}`}
                  onClick={() => setStats(statList.filter((_, i) => i !== index))}
                />
              </div>
            ))}
            <Button onClick={() => save({ stats: statList })} loading={saving}>
              Save statistics
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Sections</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="space-y-3">
              {sectionOrder.map((key) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-base text-ink-800">{SECTION_LABELS[key] ?? key}</span>
                  <Switch
                    checked={sectionsEnabled[key] !== false}
                    // The hero is not optional — a page with no opening is not a
                    // layout choice, it is a broken page.
                    disabled={key === 'hero'}
                    onChange={(event) =>
                      save(
                        { settings: { sectionsEnabled: { [key]: event.target.checked } } },
                        { silent: true },
                      )
                    }
                    aria-label={`Show the ${SECTION_LABELS[key] ?? key} section`}
                  />
                </div>
              ))}
            </div>

            <div className="border-t border-ink-200/70 pt-5">
              <p className="mb-3 text-sm font-medium text-ink-800">
                Order — drag, or focus an item and hold Alt with the arrow keys
              </p>
              <SortableGrid
                items={sectionOrder}
                getKey={(key) => key}
                onReorder={(order) => save({ settings: { sectionOrder: order } }, { silent: true })}
                className="space-y-2"
                itemClassName="border border-ink-200 bg-white px-4 py-3"
                renderItem={(key) => (
                  <span className="pl-7 text-base text-ink-800">{SECTION_LABELS[key] ?? key}</span>
                )}
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default Homepage;
