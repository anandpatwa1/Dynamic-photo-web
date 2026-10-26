import { NavLink } from 'react-router-dom';
import { CRM } from '@/routes/paths';
export const BookingNav = () => <nav aria-label="Booking calendar pages" className="mb-5 flex flex-wrap gap-2">{[[CRM.wqBookings,'Calendar'],[`${CRM.wqBookings}/types`,'Booking types & colours']].map(([to,label])=><NavLink key={to} to={to} end className={({isActive})=>`rounded-xl px-4 py-2 text-sm font-semibold ${isActive?'bg-brand-500 text-white':'bg-white text-ink-700 ring-1 ring-ink-200'}`}>{label}</NavLink>)}</nav>;
