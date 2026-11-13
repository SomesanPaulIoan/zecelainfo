import { z } from "zod";
import { pgPool } from "../db/postgres";

export const billingProfileActivateSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    county: z.string().trim().min(1).max(100),
    city: z.string().trim().min(1).max(120),
    street: z.string().trim().min(1).max(160),
    streetNumber: z.string().trim().min(1).max(40),
    phone: z.string().trim().min(6).max(32),
    invoiceOnCompany: z.boolean().optional().default(false),
    companyName: z.string().trim().max(200).optional(),
    companyCui: z.string().trim().max(40).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.invoiceOnCompany) return;
    const name = (data.companyName ?? "").trim();
    const cui = (data.companyCui ?? "").replace(/\s+/g, "");
    if (name.length < 2) {
      ctx.addIssue({ code: "custom", message: "Completeaza denumirea firmei", path: ["companyName"] });
    }
    if (cui.length < 2) {
      ctx.addIssue({ code: "custom", message: "Completeaza CUI-ul firmei", path: ["companyCui"] });
    }
  });

export type BillingProfileActivatePayload = z.infer<typeof billingProfileActivateSchema>;

type Queryable = Pick<typeof pgPool, "query">;

export async function persistUserBillingProfile(
  userId: string,
  billingProfile: BillingProfileActivatePayload,
  client: Queryable = pgPool,
) {
  await client.query(
    `UPDATE users
     SET phone = $2,
         first_name = $3,
         last_name = $4
     WHERE id = $1`,
    [userId, billingProfile.phone, billingProfile.firstName, billingProfile.lastName],
  );
  await client.query(
    `INSERT INTO user_billing_profiles (
       user_id, county, city, street, street_number,
       invoice_on_company, company_name, company_cui, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       county = EXCLUDED.county,
       city = EXCLUDED.city,
       street = EXCLUDED.street,
       street_number = EXCLUDED.street_number,
       invoice_on_company = EXCLUDED.invoice_on_company,
       company_name = EXCLUDED.company_name,
       company_cui = EXCLUDED.company_cui,
       updated_at = NOW()`,
    [
      userId,
      billingProfile.county,
      billingProfile.city,
      billingProfile.street,
      billingProfile.streetNumber,
      Boolean(billingProfile.invoiceOnCompany),
      billingProfile.invoiceOnCompany ? (billingProfile.companyName ?? "").trim() || null : null,
      billingProfile.invoiceOnCompany ? (billingProfile.companyCui ?? "").replace(/\s+/g, "").trim() || null : null,
    ],
  );
}
