import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, CreditCard, FileText, Palette } from 'lucide-react';

import { PageHeader, Tabs, PageLoader } from '@/components/ui';
import {
  fetchSettings,
  selectSettings,
  selectSettingsLoading,
  selectSettingsSaving,
  selectNextNumbers,
  fetchPublicSettings,
} from '@/redux/setting/settingsSlice';
import { CompanyTab } from './CompanyTab';
import { BrandingTab } from './BrandingTab';
import { BankingTab } from './BankingTab';
import { DocumentsTab } from './DocumentsTab';

const TABS = [
  { value: 'company', label: 'Company', icon: Building2 },
  { value: 'branding', label: 'Branding & theme', icon: Palette },
  { value: 'banking', label: 'Banking', icon: CreditCard },
  { value: 'documents', label: 'Documents', icon: FileText },
];

export const Settings = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const loading = useSelector(selectSettingsLoading);
  const saving = useSelector(selectSettingsSaving);
  const nextNumbers = useSelector(selectNextNumbers);

  const [tab, setTab] = useState('company');

  useEffect(() => {
    dispatch(fetchSettings());
    // The public endpoint supplies the "next number" previews.
    dispatch(fetchPublicSettings());
  }, [dispatch]);

  if (loading && !settings) return <PageLoader label="Loading settings" />;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your studio identity, branding and document defaults — everything that ends up on a client's desk."
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-6" />

      <div className="mx-auto max-w-4xl animate-fade-in">
        {tab === 'company' && <CompanyTab settings={settings} saving={saving} />}
        {tab === 'branding' && <BrandingTab settings={settings} saving={saving} />}
        {tab === 'banking' && <BankingTab settings={settings} saving={saving} />}
        {tab === 'documents' && (
          <DocumentsTab settings={settings} saving={saving} nextNumbers={nextNumbers} />
        )}
      </div>
    </>
  );
};

export default Settings;
