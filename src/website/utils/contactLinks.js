/** Ten-digit local numbers use the studio's Indian country code. */
export const contactNumber = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 7 && digits.length <= 15 ? digits : '';
};

export const contactLinks = (contact, values = {}, packageName = '') => {
  const whatsapp = contactNumber(contact?.whatsapp || contact?.phone);
  const phone = contactNumber(contact?.phone);
  const message = [
    'Hello! I would like to enquire about a shoot.',
    values.name && `Name: ${values.name}`,
    values.phone && `Phone: ${values.phone}`,
    values.email && `Email: ${values.email}`,
    values.eventType && `Occasion: ${values.eventType}`,
    values.eventDate && `Date: ${values.eventDate}`,
    packageName && `Package: ${packageName}`,
    values.message,
  ].filter(Boolean).join('\n');
  return {
    whatsapp: whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : '',
    call: phone ? `tel:+${phone}` : '',
  };
};
