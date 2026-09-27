/** Indian mobile numbers: accepts "98765 43210", "+91 98765-43210", "09876543210". Returns "+919876543210" or null. */
export function normalizeIndianMobile(raw: string | null | undefined): string | null {
  const d = String(raw ?? "").replace(/\D/g, "");
  const ten = d.length === 10 ? d : d.length === 11 && d.startsWith("0") ? d.slice(1) : d.length === 12 && d.startsWith("91") ? d.slice(2) : null;
  return ten && /^[6-9]\d{9}$/.test(ten) ? `+91${ten}` : null;
}
export function displayPhone(p: string | null | undefined) {
  const n = normalizeIndianMobile(p);
  return n ? `+91 ${n.slice(3, 8)} ${n.slice(8)}` : (p ?? "");
}
