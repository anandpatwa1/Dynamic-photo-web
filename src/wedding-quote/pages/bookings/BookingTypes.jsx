import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, CardBody, Input, PageHeader } from '@/components/ui';
import { CRM } from '@/routes/paths';
import { wqBookingApi, wqSettingsApi } from '../../api/wqApi';
import { PermissionGate } from '../../components/PermissionGate';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { BookingNav } from './BookingNav';

export default function BookingTypes() { return <PermissionGate anyOf={['viewQuotes','createQuote','editQuote','manageMasters']}><Types /></PermissionGate>; }
function Types() {
  const perms=useWqPermissions();
  const { isSuperAdmin } = useAuth();
  const [types,setTypes]=useState([]),[pages,setPages]=useState({}),[drafts,setDrafts]=useState({});
  const [name,setName]=useState(''),[color,setColor]=useState('#2563EB'),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{let active=true;Promise.all([wqSettingsApi.get(),perms.manageMasters?wqBookingApi.pages():Promise.resolve({pages:[]})]).then(([settings,p])=>{if(!active)return;setTypes(settings.settings.bookingTypes);const map=Object.fromEntries(p.pages.map(v=>[v.typeKey,v]));setPages(map);setDrafts(map);}).catch(e=>active&&setError(e?.response?.data?.message||'Could not load booking types'));return()=>{active=false};},[perms.manageMasters]);
  const saveTypes=async next=>{setBusy(true);try{await wqSettingsApi.update({bookingTypes:next});setTypes(next);setName('');toast.success('Booking types saved');}catch(e){toast.error(e?.response?.data?.message||'Could not save booking types')}finally{setBusy(false)}};
  const add=()=>{const key=`type-${Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}`;saveTypes([...types,{key,name:name.trim(),color}]);};
  const savePage=async type=>{setBusy(true);try{const draft=drafts[type.key]||{};const {page}=await wqBookingApi.savePage(type.key,{slug:draft.slug||'',enabled:draft.enabled??true,...(draft.pin?{pin:draft.pin}:{})});setPages(p=>({...p,[type.key]:page}));setDrafts(p=>({...p,[type.key]:page}));toast.success('Public page saved');}catch(e){toast.error(e?.response?.data?.message||'Could not save public page')}finally{setBusy(false)}};
  const field=(key,prop,value)=>setDrafts(d=>({...d,[key]:{...d[key],[prop]:value}}));
  return <><PageHeader title="Booking types & colours" description="Manage colours, open each type’s bookings, and configure PIN-protected public calendars."/><BookingNav/>{error&&<p role="alert">{error}</p>}
    {perms.manageMasters&&<Card className="mb-5"><CardBody className="flex flex-wrap items-end gap-3"><Input label="New booking type" value={name} maxLength={60} onChange={e=>setName(e.target.value)}/><label className="text-sm">Colour<input aria-label="New type colour" type="color" value={color} onChange={e=>setColor(e.target.value)} className="block h-10 w-14"/></label><Button disabled={busy||!name.trim()||!types.length} onClick={add}>Add booking type</Button><Button variant="secondary" disabled={busy||!types.length} onClick={()=>saveTypes(types)}>Save names & colours</Button></CardBody></Card>}
    <div className="grid gap-4 lg:grid-cols-2">{types.map((type,i)=>{const d=drafts[type.key]||{};return <Card key={type.key} data-booking-type={type.key}><CardBody className="space-y-4"><div className="flex items-end gap-3"><input aria-label={`${type.name} colour`} disabled={!perms.manageMasters} type="color" value={type.color} onChange={e=>setTypes(ts=>ts.map((t,j)=>j===i?{...t,color:e.target.value}:t))} className="h-10 w-12"/><Input label="Booking type" disabled={!perms.manageMasters} value={type.name} maxLength={60} onChange={e=>setTypes(ts=>ts.map((t,j)=>j===i?{...t,name:e.target.value}:t))}/></div><Button as={Link} to={`${CRM.wqBookings}/type/${type.key}`}>View calendar & dated list</Button>
    {perms.manageMasters&&<div className="space-y-3 border-t pt-4"><h3 className="font-semibold">Public booking page</h3>{isSuperAdmin && pages[type.key] && <div className="rounded-lg bg-brand-50 p-3 text-sm">{pages[type.key].savedPin ? <>Current PIN: <code className="ml-2 text-lg font-bold tracking-widest">{pages[type.key].savedPin}</code></> : <>Old PIN is stored as a one-way hash. Set the PIN once below to make it visible here.</>}</div>}<p className="text-xs text-ink-500">Shows this type’s dates, booking titles and colours after entering the PIN. Internal notes stay private.</p><Input label="Page slug" placeholder="my-wedding-bookings" value={d.slug||''} onChange={e=>field(type.key,'slug',e.target.value)} /><Input label={pages[type.key]?'New 4-digit PIN (leave blank to keep)':'4-digit PIN'} type="password" inputMode="numeric" maxLength={4} autoComplete="new-password" value={d.pin||''} onChange={e=>field(type.key,'pin',e.target.value.replace(/\D/g,''))}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.enabled??true} onChange={e=>field(type.key,'enabled',e.target.checked)}/>Enable public page</label><Button disabled={busy} onClick={()=>savePage(type)}>Save public page</Button>{pages[type.key]&&<a className="block break-all text-sm text-brand-700 underline" href={`/booking-calendar/${pages[type.key].slug}`} target="_blank" rel="noreferrer">{location.origin}/booking-calendar/{pages[type.key].slug}</a>}</div>}
    </CardBody></Card>})}</div></>;
}
