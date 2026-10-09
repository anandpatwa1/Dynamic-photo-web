import { useEffect, useState } from 'react';
import { wqBookingApi } from '../api/wqApi';

const empty = { bookings: [], bookingTypes: [], festivals: [], showFestivals: true };

export const useBookingCalendar = (view, refreshKey = 0) => {
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    wqBookingApi.month(view.year, view.month)
      .then((result) => active && setData({ ...empty, ...result }))
      .catch((reason) => active && setError(reason?.response?.data?.message ?? 'Booking calendar could not be loaded'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [view.year, view.month, refreshKey]);

  return { ...data, loading, error };
};
