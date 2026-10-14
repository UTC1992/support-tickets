const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const withoutCountryCode = digits.startsWith("593")
    ? digits.slice(3)
    : digits;
  const nationalNumber = withoutCountryCode.startsWith("0")
    ? withoutCountryCode.slice(1)
    : withoutCountryCode;

  return nationalNumber ? `+593${nationalNumber}` : "";
};

export const formatPhoneForDisplay = (value: string | null | undefined) => {
  if (!value) return "";
  const normalizedPhone = normalizePhone(value);

  return normalizedPhone.startsWith("+593")
    ? `0${normalizedPhone.slice(4)}`
    : value.replace(/\D/g, "");
};

export const getPhoneAuthEmail = (value: string) => {
  const normalizedPhone = normalizePhone(value);
  return `${normalizedPhone.slice(1)}@phone.exitcomp.app`;
};

export default normalizePhone;
