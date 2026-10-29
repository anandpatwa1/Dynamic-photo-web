import { groupBookings } from '../../utils/bookingGroups';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar } from '../../components/Calendar';

export default function PublicBookingCalendar() {
  const { slug } = useParams();
  const now=new Date();
  const [view,setView]=useState({year:now.getFullYear(),month:now.getMonth()+1});
  const [listMode,setListMode]=useState(false);
  const [pin,setPin]=useState(''),[credential,setCredential]=useState(''),[data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[selected,setSelected]=useState([]);
  useEffect(()=>{setCredential('');setPin('');setData(null);setSelected([]);},[slug]);
  useEffect(()=>{
    if(!credential)return;
    const controller=new AbortController();setLoading(true);setError('');setData(null);
    const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5100/api/v1' : 'https://apinew.duckdns.org/api/v1')).replace(/\/$/, '');
    fetch(`${base}/booking-calendar/${encodeURIComponent(slug)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...view,pin:credential,scope:listMode?'all':'month'}),signal:controller.signal}).then(async r=>{const body=await r.json().catch(()=>({}));if(!r.ok)throw new Error(body.message || (r.status===429?'Too many attempts. Try again later.':'Could not open calendar'));return body.data;}).then(setData).catch(e=>{if(e.name!=='AbortError'){setError(e.message);setCredential('');}}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return()=>controller.abort();
  },[slug,credential,view.year,view.month,listMode]);
  const selectedKey=selected[0]?`${selected[0].year}-${String(selected[0].month).padStart(2,'0')}-${String(selected[0].day).padStart(2,'0')}`:null;
  const rows=(data?.bookings||[]).filter(b=>!selectedKey||b.dateKey===selectedKey);
  return <main className="min-h-screen bg-ink-50 px-4 py-10"><div className="mx-auto max-w-5xl"><h1 className="text-3xl font-bold text-ink-900">{data?.type.name || 'Booking calendar'}</h1><p className="mt-2 mb-6 text-sm text-ink-500">View booking dates and the date-wise list.</p>
    {!credential&&<form onSubmit={e=>{e.preventDefault();setCredential(pin)}} className="max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow"><label className="block text-sm font-semibold">4-digit PIN<input aria-label="4-digit PIN" type="password" inputMode="numeric" pattern="[0-9]{4}" required maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} className="mt-2 block w-full rounded-lg border p-3 text-base"/></label><button className="rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white">Open calendar</button></form>}
    {error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}{loading&&<p role="status">Loading calendar…</p>}
    {credential&&<><button className="mb-4 text-sm underline" onClick={()=>{setCredential('');setPin('');setData(null);setSelected([])}}>Lock calendar</button><div className="mb-4 flex gap-3"><button className="rounded-lg border bg-white px-3 py-2 text-sm" aria-pressed={!listMode} onClick={()=>{setListMode(false);setSelected([])}}>Calendar view</button><button className="rounded-lg border bg-white px-3 py-2 text-sm" aria-pressed={listMode} onClick={()=>{setListMode(true);setSelected([])}}>List view — all bookings</button></div><div className={listMode?'space-y-5':'grid gap-5 md:grid-cols-2'}>{!listMode&&<section className="rounded-2xl bg-white p-4 shadow"><Calendar view={view} onViewChange={v=>{setView(v);setSelected([])}} selected={selected} onToggle={d=>setSelected(s=>s[0]?.day===d.day?[]:[d])} bookings={data?.bookings||[]} showSelectionOrder={false}/></section>}<section className="rounded-2xl bg-white p-5 shadow"><h2 className="mb-4 text-lg font-semibold">{listMode?'All booked events':selectedKey||'Bookings this month'}</h2>{selectedKey&&<button className="mb-4 text-sm underline" onClick={()=>setSelected([])}>Show whole month</button>}{!loading&&!rows.length&&<p>No bookings for these dates.</p>}<ul className="space-y-3">{groupBookings(rows).map(b=><li key={b._id} className="flex items-center gap-3 rounded-xl border p-3"><span className="h-4 w-4 shrink-0 rounded-full" style={{background:b.resolvedColor}}/><div><p className="font-semibold">{b.title||b.typeName}</p><time className="text-sm text-ink-500" dateTime={b.dateKey}>{b.dateLabel}{b.dates.length > 1 ? ` · ${b.dates.length} dates` : ''}</time></div></li>)}</ul></section></div></>}
  </div></main>;
}
