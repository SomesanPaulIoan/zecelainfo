export type BillingFormSnapshot = {
  firstName: string;
  lastName: string;
  email: string;
  county: string;
  city: string;
  street: string;
  streetNumber: string;
  phone: string;
  invoiceOnCompany: boolean;
  companyName: string;
  companyCui: string;
};

export type BillingProfilePutPayload = {
  firstName: string;
  lastName: string;
  county: string;
  city: string;
  street: string;
  streetNumber: string;
  phone: string;
  invoiceOnCompany: boolean;
  companyName?: string;
  companyCui?: string;
};

export function emptyBillingForm(): BillingFormSnapshot {
  return {
    firstName: "",
    lastName: "",
    email: "",
    county: "",
    city: "",
    street: "",
    streetNumber: "",
    phone: "",
    invoiceOnCompany: false,
    companyName: "",
    companyCui: "",
  };
}

export function buildBillingProfilePayload(form: BillingFormSnapshot): BillingProfilePutPayload {
  const invoiceOnCompany = form.invoiceOnCompany;
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    county: form.county.trim(),
    city: form.city.trim(),
    street: form.street.trim(),
    streetNumber: form.streetNumber.trim(),
    phone: form.phone.trim(),
    invoiceOnCompany,
    ...(invoiceOnCompany
      ? { companyName: form.companyName.trim(), companyCui: form.companyCui.replace(/\s+/g, "").trim() }
      : {}),
  };
}

export function isPersistableBillingForm(form: BillingFormSnapshot): boolean {
  if (!form.email.trim()) return false;
  const phone = form.phone.trim();
  if (phone.length < 6) return false;
  if (!form.firstName.trim() || !form.lastName.trim()) return false;
  if (!form.county.trim() || !form.city.trim() || !form.street.trim() || !form.streetNumber.trim()) return false;
  if (form.invoiceOnCompany) {
    const n = form.companyName.trim();
    const c = form.companyCui.replace(/\s+/g, "").trim();
    if (n.length < 2 || c.length < 2) return false;
  }
  return true;
}
