"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { BillingProfileCheckoutModal } from "@/components/billing/BillingProfileCheckoutModal";
import { AdminMeditatiiAdministrarePanel } from "@/components/meditatii/AdminMeditatiiLeadsPage";
import { PlacementTestCard } from "@/components/meditatii/PlacementTestCard";
import { AdminGrileDashboardWorkspace } from "@/components/grile/AdminGrileDashboardWorkspace";
import { MyHomeworkSection } from "@/components/homework/MyHomeworkSection";
import { MyProblemsHomeworkSection } from "@/components/homework/MyProblemsHomeworkSection";
import { apiFetch, openAuthenticatedDocumentInNewTab } from "@/lib/api";
import type { BillingProfilePutPayload } from "@/lib/billingProfileForm";

type DashboardSectionId =
  | "account"
  | "courses"
  | "bacCorrected"
  | "stats"
  | "examMode"
  | "subscriptions"
  | "classes"
  | "meditations"
  | "adminUsers"
  | "adminMeditations"
  | "adminGrile"
  | "adminDiscountCodes";

type CourseVideo = {
  id: string;
};

type CoursePart = {
  id: string;
  name: string;
  order_index: number;
  videos: CourseVideo[];
};

type Course = {
  id: string;
  slug: string;
  name: string;
  parts?: CoursePart[];
};

type AuthMeResponse = {
  data: {
    id: string;
    email: string;
    username: string;
    role: "student" | "professor" | "admin";
    email_verified: boolean;
    created_at?: string;
  };
};

type GrileStats = {
  attempts_today: number;
  attempts_7d: number;
  attempts_30d: number;
  attempts_total: number;
  correct_attempts_total: number;
  correct_attempts_30d: number;
  solved_today: number;
  solved_7d: number;
  solved_30d: number;
  solved_total: number;
  success_rate_overall: number;
  success_rate_30d: number;
};

type ExamModeAttempt = {
  id: string;
  source_id: string;
  source_name: string;
  score_total: number | null;
  score_without_bonus: number | null;
  bonus_points: number | null;
  question_count: number;
  time_spent_seconds: number | null;
  started_at: string;
  finished_at: string | null;
  status: string;
};

type GrileAccessEvent = {
  id: string;
  plan_code: string;
  plan_name: string;
  starts_at: string;
  ends_at: string;
  is_free: boolean;
  is_paid: boolean;
  paid_amount: number | null;
  currency: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  invoice_issued_at: string | null;
  created_at: string;
};

type GrileAccessHistoryResponse = {
  data: {
    has_access: boolean;
    access_until: string | null;
    trial_used: boolean;
    current_plan_code: string | null;
    events: GrileAccessEvent[];
  };
};

type LegacyGrileImportStats = {
  attempts_correct_inserted: number;
  attempts_wrong_inserted: number;
  my_list_updated: number;
  my_questions_updated: number;
  subscription_applied: boolean;
  skipped_unknown_grila_ids: number[];
  legacy_user_id: number;
  legacy_email: string;
};

type LegacyGrileImportStatusResponse = {
  data: {
    configured: boolean;
    last_import: {
      legacy_user_id: number;
      legacy_email: string;
      imported_at: string;
      meta: Record<string, unknown>;
    } | null;
  };
};

type LegacyCoursesImportStats = {
  parts_granted: number;
  parts_updated: number;
  history_rows_inserted: number;
  skipped_unknown_course_ids: number[];
  skipped_unknown_part_ids: number[];
  skipped_expired_rows: number;
  legacy_user_id: number;
  legacy_email: string;
};

type LegacyCoursesImportStatusResponse = {
  data: {
    configured: boolean;
    last_import: {
      legacy_user_id: number;
      legacy_email: string;
      imported_at: string;
      meta: Record<string, unknown>;
    } | null;
  };
};

type CoursesResponse = {
  data: Course[];
};

type CourseAccessResponse = {
  data: {
    owned_part_ids: string[];
  };
};

type CoursePurchaseHistoryRow = {
  id: string;
  course_id: string;
  course_slug: string;
  course_name: string;
  mode: string;
  parts_count: number;
  amount_total: number;
  currency: string;
  paid_at: string | null;
  access_from: string | null;
  access_until: string | null;
  invoice_number: string | null;
  has_invoice: boolean;
};

type BacCorrectedSubmissionRow = {
  submission_id: string;
  subject_id: number;
  subject_name: string;
  submission_status: "submitted" | "reviewed";
  submitted_at: string | null;
  total_score: number | null;
  reviewed_at: string | null;
  payment_attempt_id: string | null;
  invoice_number: string | null;
  amount_paid: number | null;
};

type OwnedCoursePart = {
  partId: string;
  partName: string;
  partOrder: number;
};

type OwnedCourse = {
  courseId: string;
  courseName: string;
  courseSlug: string;
  ownedParts: OwnedCoursePart[];
};

type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  role: "student" | "professor" | "admin";
  email_verified: boolean;
  created_at: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type AdminManagedUserAccessResponse = {
  data: {
    user: AdminUserRow;
    grile: {
      has_access: boolean;
      access_until: string | null;
      trial_used: boolean;
      current_plan_code: string | null;
      events: Array<{
        id: string;
        plan_code: string;
        plan_name: string;
        starts_at: string;
        ends_at: string;
        is_free: boolean;
        is_paid: boolean;
        created_at: string;
      }>;
    };
    courses: Array<{
      course_id: string;
      course_slug: string;
      course_name: string;
      parts: Array<{
        id: string;
        name: string;
        order_index: number;
        granted_at: string;
      }>;
    }>;
  };
};

type MeditationGroupOption = {
  id: string;
  name: string;
  weekday: number;
  start_time: string;
  end_time: string;
  members_count: number;
};

type UserMeditationGroup = {
  group_id: string;
  name: string;
  weekday: number;
  start_time: string;
  end_time: string;
  assigned_at: string;
};

type AdminDiscountCodeRow = {
  id: string;
  code: string;
  percent_off: number;
  scope: string;
  is_active: boolean;
  uses_count: number;
  created_at: string;
};

type MeditationSessionRow = {
  id: string;
  group_id: string;
  group_name: string;
  weekday: number;
  start_time: string;
  end_time: string;
  session_date: string;
  amount_lei: number;
  is_paid: boolean;
  paid_at: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
};

const SECTIONS: Array<{ id: DashboardSectionId; label: string }> = [
  { id: "account", label: "Informatiile contului" },
  { id: "courses", label: "Cursurile Tale" },
  { id: "bacCorrected", label: "Simulari BAC (corecturi)" },
  { id: "stats", label: "Statistici" },
  { id: "examMode", label: "Mod Examen" },
  { id: "subscriptions", label: "Abonamente" },
  { id: "classes", label: "Teme mele" },
  { id: "meditations", label: "Meditații" },
];

function formatCoursePurchaseDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCourseAccessUntilDay(value: string | null | undefined) {
  if (!value) return "Nelimitat";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

function coursePurchaseModeLabel(mode: string) {
  if (mode === "part") return "O parte";
  if (mode === "remaining") return "Parti ramase (bundle)";
  if (mode === "legacy_import") return "Transfer Zece la Examene";
  return mode;
}

function meditationSessionsListUrl() {
  return `/api/meditations/my-sessions?cb=${Date.now()}`;
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSectionId>("account");
  const [openProblemsTemaId, setOpenProblemsTemaId] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<AuthMeResponse["data"] | null>(null);
  const [ownedCourses, setOwnedCourses] = useState<OwnedCourse[]>([]);
  const [coursePurchaseHistory, setCoursePurchaseHistory] = useState<CoursePurchaseHistoryRow[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [grileStats, setGrileStats] = useState<GrileStats | null>(null);
  const [examAttempts, setExamAttempts] = useState<ExamModeAttempt[]>([]);
  const [loadingExamAttempts, setLoadingExamAttempts] = useState(true);
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const isAdmin = (accountData?.role ?? user?.role) === "admin";
  const [grileAccess, setGrileAccess] = useState<GrileAccessHistoryResponse["data"] | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersSearch, setAdminUsersSearch] = useState("");
  const [managingUserId, setManagingUserId] = useState<string | null>(null);
  const [managedAccess, setManagedAccess] = useState<AdminManagedUserAccessResponse["data"] | null>(null);
  const [managedAccessLoading, setManagedAccessLoading] = useState(false);
  const [adminActionMessage, setAdminActionMessage] = useState<string | null>(null);
  const [downloadingGrileInvoiceEventId, setDownloadingGrileInvoiceEventId] = useState<string | null>(null);
  const [downloadingCourseInvoiceAttemptId, setDownloadingCourseInvoiceAttemptId] = useState<string | null>(null);
  const [bacCorrectedRows, setBacCorrectedRows] = useState<BacCorrectedSubmissionRow[]>([]);
  const [loadingBacCorrected, setLoadingBacCorrected] = useState(true);
  const [downloadingBacInvoiceAttemptId, setDownloadingBacInvoiceAttemptId] = useState<string | null>(null);
  const [grantStartAt, setGrantStartAt] = useState(() => new Date(Date.now() - 5 * 60 * 1000).toISOString().slice(0, 16));
  const [grantEndAt, setGrantEndAt] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [grantingGrile, setGrantingGrile] = useState(false);
  const [revokingGrile, setRevokingGrile] = useState(false);
  const [grantCourseSlug, setGrantCourseSlug] = useState("");
  const [grantCourseMode, setGrantCourseMode] = useState<"all_parts" | "selected_parts">("all_parts");
  const [grantCoursePartIds, setGrantCoursePartIds] = useState<string[]>([]);
  const [grantingCourse, setGrantingCourse] = useState(false);
  const [revokingCourseSlug, setRevokingCourseSlug] = useState<string | null>(null);
  const [allCoursesCatalog, setAllCoursesCatalog] = useState<Course[]>([]);
  const [meditationGroups, setMeditationGroups] = useState<MeditationGroupOption[]>([]);
  const [managedUserMeditationGroups, setManagedUserMeditationGroups] = useState<UserMeditationGroup[]>([]);
  const [selectedMeditationGroupId, setSelectedMeditationGroupId] = useState<string>("");
  const [savingMeditationGroup, setSavingMeditationGroup] = useState(false);
  const [removingMeditationGroupId, setRemovingMeditationGroupId] = useState<string | null>(null);
  const [adminSessionGroupId, setAdminSessionGroupId] = useState<string>("");
  const [myMeditationGroups, setMyMeditationGroups] = useState<UserMeditationGroup[]>([]);
  const [myMeditationSessions, setMyMeditationSessions] = useState<MeditationSessionRow[]>([]);
  const [loadingMeditationSessions, setLoadingMeditationSessions] = useState(false);
  const [payingMeditationSessionId, setPayingMeditationSessionId] = useState<string | null>(null);
  const [meditationPaymentMessage, setMeditationPaymentMessage] = useState<string | null>(null);
  const [downloadingMeditationInvoiceId, setDownloadingMeditationInvoiceId] = useState<string | null>(null);
  const [meditationInvoiceDownloadError, setMeditationInvoiceDownloadError] = useState<string | null>(null);
  const [adminNewSessionDate, setAdminNewSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [adminCreatingSession, setAdminCreatingSession] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [legacyImportUsername, setLegacyImportUsername] = useState("");
  const [legacyImportPassword, setLegacyImportPassword] = useState("");
  const [legacyImportConfigured, setLegacyImportConfigured] = useState<boolean | null>(null);
  const [legacyImportLastAt, setLegacyImportLastAt] = useState<string | null>(null);
  const [legacyImportLastEmail, setLegacyImportLastEmail] = useState<string | null>(null);
  const [importingLegacyGrile, setImportingLegacyGrile] = useState(false);
  const [legacyImportMessage, setLegacyImportMessage] = useState<string | null>(null);
  const [legacyImportError, setLegacyImportError] = useState<string | null>(null);
  const [exameneImportEmail, setExameneImportEmail] = useState("");
  const [exameneImportPassword, setExameneImportPassword] = useState("");
  const [exameneImportConfigured, setExameneImportConfigured] = useState<boolean | null>(null);
  const [exameneImportLastAt, setExameneImportLastAt] = useState<string | null>(null);
  const [exameneImportLastEmail, setExameneImportLastEmail] = useState<string | null>(null);
  const [importingExameneCourses, setImportingExameneCourses] = useState(false);
  const [exameneImportMessage, setExameneImportMessage] = useState<string | null>(null);
  const [exameneImportError, setExameneImportError] = useState<string | null>(null);
  const [discountAdminRows, setDiscountAdminRows] = useState<AdminDiscountCodeRow[]>([]);
  const [discountAdminLoading, setDiscountAdminLoading] = useState(false);
  const [discountAdminMessage, setDiscountAdminMessage] = useState<string | null>(null);
  const [newDiscountPercent, setNewDiscountPercent] = useState("15");
  const [newDiscountScope, setNewDiscountScope] = useState<AdminDiscountCodeRow["scope"]>("site");
  const [newDiscountCustomCode, setNewDiscountCustomCode] = useState("");
  const [creatingDiscount, setCreatingDiscount] = useState(false);
  const [deletingDiscountId, setDeletingDiscountId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("adminMeditations") !== "1") return;
    setActiveSection("adminMeditations");
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("adminGrile") !== "1") return;
    setActiveSection("adminGrile");
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("section") !== "classes") return;
    setActiveSection("classes");
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const temaId = params.get("openProblemsTema");
    if (!temaId) return;
    setActiveSection("classes");
    setOpenProblemsTemaId(temaId);
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
    const meditationSessionId = params.get("meditationSession");
    if (!meditationSessionId) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await apiFetch<{
          data: {
            ok?: boolean;
            payment_status: "paid" | "pending";
            already_paid?: boolean;
            invoice_number?: string | null;
            invoice_url?: string | null;
            revolut_status?: string;
            local_redirect_url?: string;
          };
        }>(`/api/meditations/my-sessions/${meditationSessionId}/confirm-payment`, {
          method: "POST",
        });
        if (cancelled) return;
        if (response.data.payment_status === "paid") {
          setMeditationPaymentMessage(
            response.data.invoice_number
              ? `Plata confirmata. Factura: ${response.data.invoice_number}.`
              : "Plata confirmata. Poti deschide factura din tabel (PDF).",
          );
          setMeditationInvoiceDownloadError(null);
          const refreshed = await apiFetch<{ data: MeditationSessionRow[] }>(meditationSessionsListUrl());
          if (!cancelled) setMyMeditationSessions(refreshed.data ?? []);
          const onNgrok = window.location.hostname.includes("ngrok");
          if (!cancelled && onNgrok && response.data.local_redirect_url) {
            window.location.href = response.data.local_redirect_url;
            return;
          }
        } else {
          setMeditationPaymentMessage(
            `Plata este inca in procesare la Revolut (${response.data.revolut_status ?? "necunoscut"}). Reincarca pagina in cateva secunde.`,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setMeditationPaymentMessage(null);
          setMeditationInvoiceDownloadError(getReadableApiError(error, "Nu am putut confirma plata acum."));
        }
      } finally {
        if (!cancelled) {
          setActiveSection("meditations");
          router.replace("/dashboard", { scroll: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    void apiFetch<AuthMeResponse>("/api/auth/me")
      .then((response) => setAccountData(response.data))
      .catch(() => setAccountData(null));
  }, []);

  useEffect(() => {
    if (activeSection !== "account") return;
    let cancelled = false;
    void apiFetch<LegacyGrileImportStatusResponse>("/api/grile/import-legacy-progress/status")
      .then((response) => {
        if (cancelled) return;
        setLegacyImportConfigured(response.data.configured);
        setLegacyImportLastAt(response.data.last_import?.imported_at ?? null);
        setLegacyImportLastEmail(response.data.last_import?.legacy_email ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setLegacyImportConfigured(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "account") return;
    let cancelled = false;
    void apiFetch<LegacyCoursesImportStatusResponse>("/api/courses/import-legacy-courses/status")
      .then((response) => {
        if (cancelled) return;
        setExameneImportConfigured(response.data.configured);
        setExameneImportLastAt(response.data.last_import?.imported_at ?? null);
        setExameneImportLastEmail(response.data.last_import?.legacy_email ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setExameneImportConfigured(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSection]);

  useEffect(() => {
    let cancelled = false;
    const loadOwnedCourses = async () => {
      if (!user) return;
      setLoadingCourses(true);
      try {
        const [coursesResponse, purchasesPayload] = await Promise.all([
          apiFetch<CoursesResponse>("/api/courses"),
          apiFetch<{ data: CoursePurchaseHistoryRow[] }>("/api/courses/me/paid-purchases").catch(() => ({
            data: [] as CoursePurchaseHistoryRow[],
          })),
        ]);
        const allCourses = coursesResponse.data;
        if (!cancelled) {
          setAllCoursesCatalog(allCourses);
          setCoursePurchaseHistory(Array.isArray(purchasesPayload.data) ? purchasesPayload.data : []);
        }

        const accessResults = await Promise.all(
          allCourses.map(async (course) => {
            try {
              const accessResponse = await apiFetch<CourseAccessResponse>(`/api/courses/${course.slug}/access`);
              return { course, ownedPartIds: new Set(accessResponse.data.owned_part_ids ?? []) };
            } catch {
              return { course, ownedPartIds: new Set<string>() };
            }
          }),
        );

        if (cancelled) return;

        const normalized: OwnedCourse[] = accessResults
          .map(({ course, ownedPartIds }) => {
            const parts = Array.isArray(course.parts) ? course.parts : [];
            const ownedParts = parts
              .filter((part) => ownedPartIds.has(part.id))
              .map((part) => ({
                partId: part.id,
                partName: part.name,
                partOrder: part.order_index,
              }))
              .sort((a, b) => a.partOrder - b.partOrder);

            return {
              courseId: course.id,
              courseName: course.name,
              courseSlug: course.slug,
              ownedParts,
            };
          })
          .filter((course) => course.ownedParts.length > 0);

        setOwnedCourses(normalized);
      } catch {
        if (!cancelled) {
          setOwnedCourses([]);
          setCoursePurchaseHistory([]);
        }
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    };

    void loadOwnedCourses();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingBacCorrected(true);
    void apiFetch<{ data: BacCorrectedSubmissionRow[] }>("/api/bacalaureat/me/corrected-bac-submissions")
      .then((response) => {
        if (!cancelled) setBacCorrectedRows(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (!cancelled) setBacCorrectedRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBacCorrected(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isAdmin || activeSection !== "adminUsers") return;
    let cancelled = false;
    setAdminUsersLoading(true);

    const query = adminUsersSearch.trim();
    const timeout = window.setTimeout(() => {
      const searchParams = new URLSearchParams();
      if (query) searchParams.set("search", query);
      void apiFetch<{ data: AdminUserRow[] }>(`/api/auth/admin/users?${searchParams.toString()}`)
        .then((response) => {
          if (!cancelled) setAdminUsers(response.data ?? []);
        })
        .catch(() => {
          if (!cancelled) setAdminUsers([]);
        })
        .finally(() => {
          if (!cancelled) setAdminUsersLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeSection, adminUsersSearch, isAdmin, user]);

  useEffect(() => {
    if (!user || !isAdmin || activeSection !== "adminDiscountCodes") return;
    let cancelled = false;
    setDiscountAdminLoading(true);
    setDiscountAdminMessage(null);
    void apiFetch<{ data: AdminDiscountCodeRow[] }>("/api/auth/admin/discount-codes")
      .then((response) => {
        if (!cancelled) setDiscountAdminRows(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setDiscountAdminRows([]);
          setDiscountAdminMessage("Nu am putut incarca codurile.");
        }
      })
      .finally(() => {
        if (!cancelled) setDiscountAdminLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSection, isAdmin, user]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    void apiFetch<{ data: MeditationGroupOption[] }>("/api/meditations/admin/groups")
      .then((response) => setMeditationGroups(response.data ?? []))
      .catch(() => setMeditationGroups([]));
  }, [isAdmin, user]);

  useEffect(() => {
    if (!user) return;
    void apiFetch<{ data: GrileStats }>("/api/grile/dashboard/stats")
      .then((response) => setGrileStats(response.data))
      .catch(() => setGrileStats(null));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoadingExamAttempts(true);
    void apiFetch<{ data: ExamModeAttempt[] }>("/api/grile/dashboard/exam-attempts")
      .then((response) => setExamAttempts(response.data))
      .catch(() => setExamAttempts([]))
      .finally(() => setLoadingExamAttempts(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void apiFetch<GrileAccessHistoryResponse>("/api/grile/access/history")
      .then((response) => setGrileAccess(response.data))
      .catch(() => setGrileAccess(null));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void apiFetch<{ data: UserMeditationGroup[] }>("/api/meditations/my-group")
      .then((response) => setMyMeditationGroups(Array.isArray(response.data) ? response.data : []))
      .catch(() => setMyMeditationGroups([]));
  }, [user]);

  useEffect(() => {
    if (!user || activeSection !== "meditations") return;
    setLoadingMeditationSessions(true);
    void apiFetch<{ data: MeditationSessionRow[] }>(meditationSessionsListUrl())
      .then((response) => setMyMeditationSessions(response.data ?? []))
      .catch(() => setMyMeditationSessions([]))
      .finally(() => setLoadingMeditationSessions(false));
  }, [user, activeSection]);

  /** La deschiderea checkout-ului, reîncarcă sumele din server. */
  useEffect(() => {
    if (!user || !payingMeditationSessionId) return;
    void apiFetch<{ data: MeditationSessionRow[] }>(meditationSessionsListUrl())
      .then((response) => setMyMeditationSessions(response.data ?? []))
      .catch(() => {});
  }, [user, payingMeditationSessionId]);

  const stats = useMemo(() => {
    const totalCourses = ownedCourses.length;
    const totalParts = ownedCourses.reduce((acc, course) => acc + course.ownedParts.length, 0);
    return { totalCourses, totalParts };
  }, [ownedCourses]);

  const selectedGrantCourse = useMemo(
    () => allCoursesCatalog.find((course) => course.slug === grantCourseSlug) ?? null,
    [allCoursesCatalog, grantCourseSlug],
  );

  const loadManagedUserAccess = async (targetUserId: string) => {
    setManagedAccessLoading(true);
    setAdminActionMessage(null);
    try {
      const response = await apiFetch<AdminManagedUserAccessResponse>(`/api/auth/admin/users/${targetUserId}/access`);
      setManagedAccess(response.data);
    } catch {
      setManagedAccess(null);
      setAdminActionMessage("Nu am putut incarca accesurile utilizatorului.");
    } finally {
      setManagedAccessLoading(false);
    }
  };

  const loadManagedUserMeditationGroup = async (targetUserId: string) => {
    try {
      const response = await apiFetch<{ data: UserMeditationGroup[] }>(`/api/meditations/admin/users/${targetUserId}/group`);
      const groups = Array.isArray(response.data) ? response.data : [];
      setManagedUserMeditationGroups(groups);
      setSelectedMeditationGroupId("");
      setAdminSessionGroupId(groups[0]?.group_id ?? "");
    } catch {
      setManagedUserMeditationGroups([]);
      setSelectedMeditationGroupId("");
      setAdminSessionGroupId("");
    }
  };

  const handleOpenAdminUser = async (targetUser: AdminUserRow) => {
    setManagingUserId(targetUser.id);
    setGrantCourseSlug("");
    setGrantCourseMode("all_parts");
    setGrantCoursePartIds([]);
    await Promise.all([loadManagedUserAccess(targetUser.id), loadManagedUserMeditationGroup(targetUser.id)]);
  };

  const handleAddMeditationGroup = async () => {
    if (!managingUserId || !selectedMeditationGroupId) return;
    setSavingMeditationGroup(true);
    setAdminActionMessage(null);
    try {
      await apiFetch<{ data: { assigned: boolean } }>(`/api/meditations/admin/users/${managingUserId}/group`, {
        method: "PUT",
        body: JSON.stringify({ group_id: selectedMeditationGroupId }),
      });
      setAdminActionMessage("Elevul a fost adaugat in grupa.");
      await loadManagedUserMeditationGroup(managingUserId);
    } catch (error) {
      setAdminActionMessage(error instanceof Error ? error.message : "Nu am putut adauga elevul in grupa.");
    } finally {
      setSavingMeditationGroup(false);
    }
  };

  const handleRemoveMeditationGroup = async (groupId: string) => {
    if (!managingUserId) return;
    setRemovingMeditationGroupId(groupId);
    setAdminActionMessage(null);
    try {
      await apiFetch<{ data: { removed: boolean } }>(
        `/api/meditations/admin/users/${managingUserId}/groups/${groupId}`,
        { method: "DELETE" },
      );
      setAdminActionMessage("Elevul a fost scos din grupa.");
      await loadManagedUserMeditationGroup(managingUserId);
    } catch (error) {
      setAdminActionMessage(error instanceof Error ? error.message : "Nu am putut scoate elevul din grupa.");
    } finally {
      setRemovingMeditationGroupId(null);
    }
  };

  const handleRemoveAllMeditationGroups = async () => {
    if (!managingUserId) return;
    setSavingMeditationGroup(true);
    setAdminActionMessage(null);
    try {
      await apiFetch<{ data: { assigned: boolean } }>(`/api/meditations/admin/users/${managingUserId}/group`, {
        method: "PUT",
        body: JSON.stringify({ group_id: null }),
      });
      setAdminActionMessage("Elevul a fost scos din toate grupele.");
      await loadManagedUserMeditationGroup(managingUserId);
    } catch (error) {
      setAdminActionMessage(error instanceof Error ? error.message : "Nu am putut elimina grupele.");
    } finally {
      setSavingMeditationGroup(false);
    }
  };

  const handleAdminCreateMeditationSession = async () => {
    if (!managingUserId || !adminNewSessionDate) return;
    setAdminCreatingSession(true);
    setAdminActionMessage(null);
    try {
      await apiFetch<{ data: { id: string; created: boolean } }>(`/api/meditations/admin/users/${managingUserId}/sessions`, {
        method: "POST",
        body: JSON.stringify({
          session_date: adminNewSessionDate,
          amount_lei: 150,
          group_id: adminSessionGroupId || undefined,
        }),
      });
      setAdminActionMessage("Sedinta de meditatii a fost adaugata pentru elev.");
    } catch (error) {
      setAdminActionMessage(error instanceof Error ? error.message : "Nu am putut adauga sedinta.");
    } finally {
      setAdminCreatingSession(false);
    }
  };

  const selectedMeditationSessionToPay = useMemo(
    () => myMeditationSessions.find((session) => session.id === payingMeditationSessionId) ?? null,
    [myMeditationSessions, payingMeditationSessionId],
  );

  const handlePayMeditationSession = async (profile: BillingProfilePutPayload) => {
    if (!payingMeditationSessionId) throw new Error("missing session");
    const response = await apiFetch<{
      data: {
        checkout_url?: string;
        order_id?: string;
        amount_lei?: number;
        paid?: boolean;
        already_paid?: boolean;
      };
    }>(`/api/meditations/my-sessions/${payingMeditationSessionId}/pay`, {
      method: "POST",
      body: JSON.stringify({
        billingProfile: profile,
        acceptTerms: true as const,
      }),
    });
    if (response.data.checkout_url) {
      window.location.href = response.data.checkout_url;
      return;
    }
    if (response.data.already_paid || response.data.paid) {
      const refreshed = await apiFetch<{ data: MeditationSessionRow[] }>(meditationSessionsListUrl());
      setMyMeditationSessions(refreshed.data ?? []);
      setMeditationPaymentMessage("Aceasta sesiune este deja platita.");
      setMeditationInvoiceDownloadError(null);
      return;
    }
    throw new Error("Raspuns neasteptat de la serverul de plati.");
  };

  const handleGrantGrileAccess = async () => {
    if (!managingUserId) return;
    setGrantingGrile(true);
    setAdminActionMessage(null);
    try {
      await apiFetch<{ data: { ok: boolean; granted_until: string } }>(`/api/auth/admin/users/${managingUserId}/grile-access`, {
        method: "POST",
        body: JSON.stringify({
          starts_at: new Date(grantStartAt).toISOString(),
          ends_at: new Date(grantEndAt).toISOString(),
        }),
      });
      setAdminActionMessage("Accesul la grile a fost actualizat.");
      await loadManagedUserAccess(managingUserId);
    } catch (error) {
      setAdminActionMessage(error instanceof Error ? error.message : "Nu am putut acorda acces la grile.");
    } finally {
      setGrantingGrile(false);
    }
  };

  const handleGrantCourseAccess = async () => {
    if (!managingUserId || !grantCourseSlug) return;
    setGrantingCourse(true);
    setAdminActionMessage(null);
    try {
      await apiFetch<{ data: { ok: boolean; granted_parts: number } }>(`/api/auth/admin/users/${managingUserId}/course-access`, {
        method: "POST",
        body: JSON.stringify({
          course_slug: grantCourseSlug,
          grant_mode: grantCourseMode,
          part_ids: grantCourseMode === "selected_parts" ? grantCoursePartIds : undefined,
        }),
      });
      setAdminActionMessage("Accesul la curs a fost acordat.");
      await loadManagedUserAccess(managingUserId);
    } catch (error) {
      setAdminActionMessage(error instanceof Error ? error.message : "Nu am putut acorda acces la curs.");
    } finally {
      setGrantingCourse(false);
    }
  };

  const handleRevokeGrileAccess = async () => {
    if (!managingUserId) return;
    setRevokingGrile(true);
    setAdminActionMessage(null);
    try {
      await apiFetch<{ data: { ok: boolean } }>(`/api/auth/admin/users/${managingUserId}/grile-access`, {
        method: "DELETE",
      });
      setAdminActionMessage("Accesul la grile a fost sters.");
      await loadManagedUserAccess(managingUserId);
    } catch (error) {
      setAdminActionMessage(error instanceof Error ? error.message : "Nu am putut sterge accesul la grile.");
    } finally {
      setRevokingGrile(false);
    }
  };

  const handleRevokeCourseAccess = async (courseSlug: string) => {
    if (!managingUserId) return;
    setRevokingCourseSlug(courseSlug);
    setAdminActionMessage(null);
    try {
      await apiFetch<{ data: { ok: boolean; removed: number } }>(
        `/api/auth/admin/users/${managingUserId}/course-access?course_slug=${encodeURIComponent(courseSlug)}`,
        { method: "DELETE" },
      );
      setAdminActionMessage("Accesul la curs a fost sters.");
      await loadManagedUserAccess(managingUserId);
    } catch (error) {
      setAdminActionMessage(error instanceof Error ? error.message : "Nu am putut sterge accesul la curs.");
    } finally {
      setRevokingCourseSlug(null);
    }
  };

  const handleDeleteExamAttempt = async (attemptId: string) => {
    try {
      setDeletingAttemptId(attemptId);
      await apiFetch<{ data: { deleted: boolean; id: string } }>(`/api/grile/exam-attempts/${attemptId}`, {
        method: "DELETE",
      });
      setExamAttempts((prev) => prev.filter((attempt) => attempt.id !== attemptId));
    } catch {
      // silent fail for now
    } finally {
      setDeletingAttemptId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleImportLegacyGrile = async () => {
    setLegacyImportMessage(null);
    setLegacyImportError(null);
    if (!legacyImportUsername.trim() || !legacyImportPassword) {
      setLegacyImportError("Introdu username-ul si parola contului de pe zecelagrile.ro.");
      return;
    }
    setImportingLegacyGrile(true);
    try {
      const response = await apiFetch<{ data: { stats: LegacyGrileImportStats } }>("/api/grile/import-legacy-progress", {
        method: "POST",
        body: JSON.stringify({
          username: legacyImportUsername.trim(),
          password: legacyImportPassword,
        }),
      });
      const stats = response.data.stats;
      const skipped = stats.skipped_unknown_grila_ids.length;
      const parts = [
        `${stats.attempts_correct_inserted} raspunsuri corecte importate`,
        `${stats.attempts_wrong_inserted} greseli importate`,
        `${stats.my_list_updated} grile in Lista mea`,
        `${stats.my_questions_updated} grile in Intrebari`,
      ];
      if (stats.subscription_applied) {
        parts.push("abonament activ transferat");
      }
      setLegacyImportMessage(
        `Import reusit de pe ${stats.legacy_email}: ${parts.join(", ")}.` +
          (skipped > 0 ? ` ${skipped} grile nu au fost gasite in baza noua (ID vechi lipsa).` : ""),
      );
      setLegacyImportPassword("");
      setLegacyImportLastAt(new Date().toISOString());
      setLegacyImportLastEmail(stats.legacy_email);
      void apiFetch<GrileAccessHistoryResponse>("/api/grile/access/history")
        .then((accessResponse) => setGrileAccess(accessResponse.data))
        .catch(() => undefined);
    } catch (importError) {
      setLegacyImportError(getReadableApiError(importError, "Nu am putut importa progresul."));
    } finally {
      setImportingLegacyGrile(false);
    }
  };

  const handleImportLegacyCourses = async () => {
    setExameneImportMessage(null);
    setExameneImportError(null);
    if (!exameneImportEmail.trim() || !exameneImportPassword) {
      setExameneImportError("Introdu emailul si parola contului de pe zecelaexamene.ro.");
      return;
    }
    setImportingExameneCourses(true);
    try {
      const response = await apiFetch<{ data: { stats: LegacyCoursesImportStats; message?: string } }>(
        "/api/courses/import-legacy-courses",
        {
          method: "POST",
          body: JSON.stringify({
            email: exameneImportEmail.trim(),
            password: exameneImportPassword,
          }),
        },
      );
      const { stats, message } = response.data;
      if (message?.trim()) {
        setExameneImportMessage(message.trim());
      } else {
        const parts = [
          `${stats.parts_granted} parti de curs acordate`,
          stats.parts_updated > 0 ? `${stats.parts_updated} parti actualizate` : null,
          stats.history_rows_inserted > 0
            ? `${stats.history_rows_inserted} inregistrari in istoricul de plati`
            : null,
        ].filter(Boolean);
        setExameneImportMessage(`Transfer reusit de pe ${stats.legacy_email}: ${parts.join(", ")}.`);
      }
      setExameneImportPassword("");
      setExameneImportLastAt(new Date().toISOString());
      setExameneImportLastEmail(stats.legacy_email);
    } catch (importError) {
      setExameneImportError(getReadableApiError(importError, "Nu am putut realiza transferul."));
    } finally {
      setImportingExameneCourses(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordChangeMessage(null);
    setPasswordChangeError(null);
    if (newPassword.length < 6) {
      setPasswordChangeError("Parola noua trebuie sa aiba minim 6 caractere.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("Parolele noi nu coincid.");
      return;
    }
    setChangingPassword(true);
    try {
      const response = await apiFetch<{ data: { ok: boolean; message: string } }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmNewPassword,
        }),
      });
      setPasswordChangeMessage(response.data.message || "Parola a fost actualizata.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (changeError) {
      setPasswordChangeError(getReadableApiError(changeError, "Nu am putut actualiza parola."));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCreateAdminDiscount = async () => {
    const pct = Number.parseInt(newDiscountPercent, 10);
    if (!Number.isFinite(pct) || pct < 5 || pct > 100) {
      setDiscountAdminMessage("Procentul trebuie sa fie intre 5 si 100.");
      return;
    }
    setCreatingDiscount(true);
    setDiscountAdminMessage(null);
    try {
      const trimmed = newDiscountCustomCode.trim();
      await apiFetch<{ data: AdminDiscountCodeRow }>("/api/auth/admin/discount-codes", {
        method: "POST",
        body: JSON.stringify({
          percent_off: pct,
          scope: newDiscountScope,
          code: trimmed.length > 0 ? trimmed : null,
        }),
      });
      setDiscountAdminMessage("Cod creat.");
      setNewDiscountCustomCode("");
      const refreshed = await apiFetch<{ data: AdminDiscountCodeRow[] }>("/api/auth/admin/discount-codes");
      setDiscountAdminRows(Array.isArray(refreshed.data) ? refreshed.data : []);
    } catch (error) {
      setDiscountAdminMessage(getReadableApiError(error, "Nu am putut crea codul."));
    } finally {
      setCreatingDiscount(false);
    }
  };

  const handleDeleteAdminDiscount = async (id: string) => {
    setDeletingDiscountId(id);
    setDiscountAdminMessage(null);
    try {
      await apiFetch(`/api/auth/admin/discount-codes/${encodeURIComponent(id)}`, { method: "DELETE" });
      setDiscountAdminMessage("Cod sters.");
      setDiscountAdminRows((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      setDiscountAdminMessage(getReadableApiError(error, "Nu am putut sterge codul."));
    } finally {
      setDeletingDiscountId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-none px-3 py-8 sm:px-4 lg:px-6 2xl:px-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-sky-100 bg-sky-50/50 p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-zinc-900">Dashboard</p>
          <nav className="space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  activeSection === section.id
                    ? "border border-yellow-600 bg-yellow-400 text-slate-900"
                    : "border border-transparent text-zinc-700 hover:border-yellow-400 hover:bg-yellow-100"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
          {(accountData?.role ?? user?.role) === "admin" ? (
            <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Meniu Admin</p>
              <div className="mt-2 space-y-1">
                {(
                  [
                    { kind: "section" as const, id: "adminUsers" as const, label: "Admin Users" },
                    { kind: "link" as const, href: "/admin/subiecte-bac", label: "Subiecte BAC" },
                    { kind: "link" as const, href: "/admin/corecteaza-subiecte-bac", label: "Corecteaza BAC" },
                    { kind: "section" as const, id: "adminGrile" as const, label: "Admin Grile" },
                    { kind: "link" as const, href: "/admin#admin-probleme", label: "Admin Probleme" },
                    { kind: "link" as const, href: "/admin/cursuri", label: "Admin Cursuri" },
                    { kind: "link" as const, href: "/admin/fisiere-claude", label: "Fisiere Claude" },
                    { kind: "section" as const, id: "adminMeditations" as const, label: "Admin Meditatii" },
                    { kind: "section" as const, id: "adminDiscountCodes" as const, label: "Coduri reducere" },
                  ] as const
                ).map((item) =>
                  item.kind === "link" ? (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-2 py-1.5 text-sm font-medium text-sky-900 transition hover:bg-yellow-100"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`block w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-sm font-medium transition ${
                        activeSection === item.id
                          ? "border border-yellow-600 bg-yellow-400 text-slate-900"
                          : "border border-transparent text-sky-900 hover:bg-yellow-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : null}
        </aside>

        <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          {activeSection === "account" ? (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-zinc-900">Informatiile contului</h1>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Username</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{accountData?.username ?? user?.username ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Email</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{accountData?.email ?? user?.email ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rol</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-zinc-900">{accountData?.role ?? user?.role ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cont verificat</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{(accountData?.email_verified ?? user?.email_verified) ? "Da" : "Nu"}</p>
                </div>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                <p className="text-sm font-semibold text-zinc-900">Transfera progresul de pe zecelagrile.ro</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Daca ai cont pe site-ul vechi, poti importa abonamentul activ, grilele rezolvate, greselile, Lista mea si
                  sectiunea Intrebari. Datele de conectare sunt trimise doar catre serverul nostru, nu sunt salvate. Fiecare
                  cont de pe zecelagrile.ro poate fi folosit o singura data pentru transfer.
                </p>
                {legacyImportConfigured === false ? (
                  <p className="mt-3 text-sm text-amber-800">
                    Importul nu este disponibil momentan pe acest mediu. Contacteaza suportul daca ai nevoie de ajutor.
                  </p>
                ) : null}
                {legacyImportLastAt ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Ai importat deja progresul de pe {legacyImportLastEmail ?? "zecelagrile.ro"} la{" "}
                    {new Date(legacyImportLastAt).toLocaleString("ro-RO")}. Transferul se face o singura data per cont vechi.
                  </p>
                ) : null}
                <div className="mt-3 grid max-w-xl grid-cols-1 gap-2">
                  <input
                    type="text"
                    value={legacyImportUsername}
                    onChange={(event) => setLegacyImportUsername(event.target.value)}
                    placeholder="Username (sau email) de pe zecelagrile.ro"
                    autoComplete="username"
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                  />
                  <input
                    type="password"
                    value={legacyImportPassword}
                    onChange={(event) => setLegacyImportPassword(event.target.value)}
                    placeholder="Parola cont zecelagrile.ro"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                  />
                  <button
                    type="button"
                    onClick={() => void handleImportLegacyGrile()}
                    disabled={
                      importingLegacyGrile ||
                      legacyImportConfigured === false ||
                      legacyImportLastAt !== null ||
                      !legacyImportUsername.trim() ||
                      !legacyImportPassword
                    }
                    className="w-fit rounded-lg border border-sky-700 bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {importingLegacyGrile ? "Se importa..." : "Importa progresul"}
                  </button>
                </div>
                {legacyImportMessage ? <p className="mt-3 text-sm text-emerald-700">{legacyImportMessage}</p> : null}
                {legacyImportError ? <p className="mt-3 text-sm text-rose-700">{legacyImportError}</p> : null}
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                <p className="text-sm font-semibold text-zinc-900">Transfer acces cursuri de pe zecelaexamene.ro</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Daca ai avut cont pe vechea platforma Zece la Examene, iti poti transfera gratuit accesul la cursuri in
                  noua platforma Zece la Info. Introdu emailul si parola contului tau de pe Zece la Examene. Datele de
                  conectare sunt trimise doar catre serverul nostru, nu sunt salvate. Fiecare cont de pe zecelaexamene.ro
                  poate fi folosit o singura data pentru transfer.
                </p>
                {exameneImportConfigured === false ? (
                  <p className="mt-3 text-sm text-amber-800">
                    Importul nu este disponibil momentan pe acest mediu. Contacteaza suportul daca ai nevoie de ajutor.
                  </p>
                ) : null}
                {exameneImportLastAt ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Ai importat deja cursurile de pe {exameneImportLastEmail ?? "zecelaexamene.ro"} la{" "}
                    {new Date(exameneImportLastAt).toLocaleString("ro-RO")}. Transferul se face o singura data per cont vechi.
                  </p>
                ) : null}
                <div className="mt-3 grid max-w-xl grid-cols-1 gap-2">
                  <input
                    type="email"
                    value={exameneImportEmail}
                    onChange={(event) => setExameneImportEmail(event.target.value)}
                    placeholder="Email de pe zecelaexamene.ro"
                    autoComplete="username"
                    className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-300/40 focus:ring"
                  />
                  <input
                    type="password"
                    value={exameneImportPassword}
                    onChange={(event) => setExameneImportPassword(event.target.value)}
                    placeholder="Parola cont zecelaexamene.ro"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-300/40 focus:ring"
                  />
                  <button
                    type="button"
                    onClick={() => void handleImportLegacyCourses()}
                    disabled={
                      importingExameneCourses ||
                      exameneImportConfigured === false ||
                      exameneImportLastAt !== null ||
                      !exameneImportEmail.trim() ||
                      !exameneImportPassword
                    }
                    className="w-fit rounded-lg border border-indigo-700 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {importingExameneCourses ? "Se transfera..." : "Transfera accesul la cursuri"}
                  </button>
                </div>
                {exameneImportMessage ? <p className="mt-3 text-sm text-emerald-700">{exameneImportMessage}</p> : null}
                {exameneImportError ? <p className="mt-3 text-sm text-rose-700">{exameneImportError}</p> : null}
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Securitate cont</p>
                <p className="mt-1 text-sm text-zinc-600">Poti schimba parola oricand. Pentru securitate, confirma parola veche.</p>
                <div className="mt-3 grid max-w-xl grid-cols-1 gap-2">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Parola veche"
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Parola noua (minim 6 caractere)"
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                  />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    placeholder="Confirma parola noua"
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleChangePassword()}
                      disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                      className="rounded-lg border border-yellow-600 bg-yellow-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-600 disabled:opacity-60"
                    >
                      {changingPassword ? "Se actualizeaza..." : "Actualizeaza parola"}
                    </button>
                  </div>
                </div>
                {passwordChangeMessage ? <p className="mt-3 text-sm text-emerald-700">{passwordChangeMessage}</p> : null}
                {passwordChangeError ? <p className="mt-3 text-sm text-rose-700">{passwordChangeError}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="rounded-lg border border-yellow-600 bg-yellow-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-600"
                  >
                    Deconectare
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "courses" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-zinc-900">Cursurile Tale</h2>
              <p className="text-sm text-zinc-600">
                Mai jos ai istoricul comenzilor platite (acces si facturi). Factura se deschide intr-un tab nou (poti si
                descarca de acolo). Sub el, lista cursurilor la care ai acces acum — butonul te duce in pagina cursului, la zona
                de parti.
              </p>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-zinc-900">Istoric plati & acces</h3>
                {loadingCourses ? (
                  <p className="text-sm text-zinc-600">Se incarca...</p>
                ) : coursePurchaseHistory.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600">
                    Nu ai inca comenzi platite inregistrate. Dupa ce cumperi o parte sau un bundle, vei vedea aici perioada de
                    acces si vei putea deschide factura intr-un tab nou.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-sky-200/80 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-amber-50/40">
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                              Plata
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                              Curs
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                              Tip
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                              Suma
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                              Acces de la
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                              Acces pana la
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                              Factura
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {coursePurchaseHistory.map((row) => (
                            <tr key={row.id} className="bg-white transition hover:bg-sky-50/40">
                              <td className="whitespace-nowrap px-4 py-3 text-zinc-800">
                                {formatCoursePurchaseDateTime(row.paid_at)}
                              </td>
                              <td className="px-4 py-3">
                                <Link
                                  href={`/cursuri/${row.course_slug}`}
                                  className="font-medium text-sky-800 underline decoration-sky-300 underline-offset-2 hover:text-sky-950"
                                >
                                  {row.course_name}
                                </Link>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                  {row.parts_count} {row.parts_count === 1 ? "parte" : "parti"}
                                </p>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">{coursePurchaseModeLabel(row.mode)}</td>
                              <td className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-900">
                                {Number(row.amount_total).toFixed(2)} {row.currency}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                                {formatCoursePurchaseDateTime(row.access_from)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                                {formatCourseAccessUntilDay(row.access_until)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                {row.has_invoice ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDownloadingCourseInvoiceAttemptId(row.id);
                                      void openAuthenticatedDocumentInNewTab(`/api/courses/me/paid-purchases/${row.id}/invoice`)
                                        .catch((err) => {
                                          window.alert(
                                            err instanceof Error ? err.message : "Nu am putut deschide factura. Incearca din nou.",
                                          );
                                        })
                                        .finally(() => setDownloadingCourseInvoiceAttemptId(null));
                                    }}
                                    disabled={downloadingCourseInvoiceAttemptId === row.id}
                                    className="rounded-lg border border-yellow-600 bg-yellow-500 px-2.5 py-1 text-xs font-semibold text-slate-900 hover:bg-yellow-600 disabled:opacity-60"
                                  >
                                    {downloadingCourseInvoiceAttemptId === row.id ? "Se deschide..." : "Vezi factura"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-zinc-500">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-zinc-900">Acces curent pe parti</h3>
                <p className="text-sm text-zinc-600">
                  Accesurile acordate manual de admin nu apar in tabelul de plati de mai sus, dar apar aici daca sunt active.
                </p>
              {loadingCourses ? <p className="text-sm text-zinc-600">Se incarca cursurile tale...</p> : null}
              {!loadingCourses && ownedCourses.length === 0 ? (
                <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  Nu ai inca acces la parti de curs.
                </p>
              ) : null}
              {!loadingCourses ? (
                <div className="space-y-3">
                  {ownedCourses.map((course) => (
                    <article key={course.courseId} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                      <button
                        type="button"
                        onClick={() => setOpenCourseId((prev) => (prev === course.courseId ? null : course.courseId))}
                        className="flex w-full items-center justify-between rounded-lg border border-sky-200 bg-white px-3 py-2 text-left hover:bg-sky-50"
                      >
                        <span className="text-base font-semibold text-zinc-900">{course.courseName}</span>
                        <span className="text-xs font-semibold text-sky-800">
                          {openCourseId === course.courseId ? "Ascunde" : "Arata"} parti ({course.ownedParts.length})
                        </span>
                      </button>
                      {openCourseId === course.courseId ? (
                        <div className="mt-3 space-y-2">
                          {course.ownedParts.map((part) => (
                            <div
                              key={part.partId}
                              className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <p className="text-sm text-zinc-800">
                                Partea {part.partOrder}: <span className="font-semibold">{part.partName}</span>
                              </p>
                              <Link
                                href={`/cursuri/${course.courseSlug}#part-${part.partId}`}
                                className="inline-flex cursor-pointer items-center rounded-lg border border-yellow-600 bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-yellow-600"
                              >
                                Vezi cursul
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}
              </section>
            </div>
          ) : null}

          {activeSection === "bacCorrected" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900">Simulari BAC — corecturi</h2>
              <p className="text-sm text-zinc-600">
                Vezi simularile trimise la corectare (in asteptare sau deja corectate), nota cand e gata, data corectarii si
                factura dupa plata.
              </p>
              {loadingBacCorrected ? (
                <p className="text-sm text-zinc-600">Se incarca...</p>
              ) : bacCorrectedRows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600">
                  Nu ai inca subiecte trimise spre corectare. Dupa ce platesti si trimiti rezolvarea, le vei vedea aici pana primesti
                  nota si feedback-ul.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-sky-200/80 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-[720px] w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-amber-50/40">
                          <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                            Subiect
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                            Nota
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                            Corectat la
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                            Feedback
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sky-900">
                            Factura
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {bacCorrectedRows.map((row) => {
                          const isReviewed = row.submission_status === "reviewed";
                          const nota =
                            isReviewed && row.total_score != null && Number.isFinite(Number(row.total_score))
                              ? (Number(row.total_score) / 10).toFixed(2)
                              : null;
                          const canInvoice = Boolean(row.payment_attempt_id && row.invoice_number);
                          return (
                            <tr key={row.submission_id} className="bg-white transition hover:bg-sky-50/40">
                              <td className="px-4 py-3">
                                <Link
                                  href={`/bacalaureat/subiect/${row.subject_id}`}
                                  className="font-medium text-sky-800 underline decoration-sky-300 underline-offset-2 hover:text-sky-950"
                                >
                                  {row.subject_name}
                                </Link>
                              </td>
                              <td className="px-4 py-3">
                                {nota != null ? (
                                  <span className="font-semibold text-zinc-900">{nota}</span>
                                ) : (
                                  <span className="text-sm font-medium text-amber-800">In proces de corectare</span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                                {isReviewed && row.reviewed_at
                                  ? formatCoursePurchaseDateTime(row.reviewed_at)
                                  : "—"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                {isReviewed ? (
                                  <Link
                                    href={`/bacalaureat/subiect/${row.subject_id}/feedback/${row.submission_id}`}
                                    className="rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-100"
                                  >
                                    Vezi feedback
                                  </Link>
                                ) : (
                                  <span className="text-xs text-zinc-500">In asteptare</span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                {canInvoice ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDownloadingBacInvoiceAttemptId(row.payment_attempt_id);
                                      void openAuthenticatedDocumentInNewTab(
                                        `/api/bacalaureat/correction-payments/${row.payment_attempt_id}/invoice`,
                                      )
                                        .catch((err) => {
                                          window.alert(
                                            err instanceof Error ? err.message : "Nu am putut deschide factura. Incearca din nou.",
                                          );
                                        })
                                        .finally(() => setDownloadingBacInvoiceAttemptId(null));
                                    }}
                                    disabled={downloadingBacInvoiceAttemptId === row.payment_attempt_id}
                                    className="rounded-lg border border-yellow-600 bg-yellow-500 px-2.5 py-1 text-xs font-semibold text-slate-900 hover:bg-yellow-600 disabled:opacity-60"
                                  >
                                    {downloadingBacInvoiceAttemptId === row.payment_attempt_id ? "Se deschide..." : "Vezi factura"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-zinc-500">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {activeSection === "stats" ? (
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Progresul tau</p>
                <h2 className="mt-1 text-2xl font-bold text-sky-950">Statistici cont</h2>
                <p className="mt-1 max-w-xl text-sm text-zinc-600">
                  Grile la care ai raspuns corect cel putin o data — inclusiv din modul examen si din practica obisnuita.
                </p>
              </div>

              {!grileStats ? (
                <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-zinc-700">Se incarca statisticile...</p>
                  <p className="mt-1 text-xs text-zinc-500">Daca dureaza prea mult, reincarca pagina.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-600 via-sky-700 to-sky-900 p-6 text-white shadow-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/90">Total grile rezolvate corect</p>
                    <p className="mt-2 text-5xl font-extrabold tabular-nums tracking-tight">{grileStats.solved_total}</p>
                    <p className="mt-3 text-sm text-sky-100/85">
                      Rata de succes (toate timpurile):{" "}
                      <span className="font-semibold text-white">{grileStats.success_rate_overall.toFixed(1)}%</span>
                      <span className="text-sky-200/80"> · </span>
                      ultimele 30 zile:{" "}
                      <span className="font-semibold text-white">{grileStats.success_rate_30d.toFixed(1)}%</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { label: "Azi", value: grileStats.solved_today, hint: "grile noi corecte" },
                      { label: "Ultimele 7 zile", value: grileStats.solved_7d, hint: "grile corecte" },
                      { label: "Ultimele 30 zile", value: grileStats.solved_30d, hint: "grile corecte" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/60 p-4 shadow-sm"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-wide text-sky-800/80">{item.label}</p>
                        <p className="mt-2 text-3xl font-extrabold tabular-nums text-sky-950">{item.value}</p>
                        <p className="mt-1 text-xs text-zinc-500">{item.hint}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-yellow-50/80 p-4 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/30 text-lg font-extrabold text-amber-900">
                    C
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900/70">Cursuri detinute</p>
                    <p className="text-2xl font-extrabold tabular-nums text-amber-950">{stats.totalCourses}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50 to-white p-4 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-lg font-extrabold text-sky-800">
                    P
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sky-800/70">Parti detinute</p>
                    <p className="text-2xl font-extrabold tabular-nums text-sky-950">{stats.totalParts}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "subscriptions" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900">Abonamente</h2>
              {grileAccess?.has_access ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                  Ai abonament activ la grile pana la {grileAccess.access_until ? new Date(grileAccess.access_until).toLocaleDateString("ro-RO") : "-"}.
                </p>
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                  Nu ai abonament activ la grile in acest moment.
                </p>
              )}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Istoric abonamente grile</p>
                {!grileAccess || grileAccess.events.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-600">Nu exista inca abonamente activate.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-600">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Plan</th>
                          <th className="px-3 py-2 font-semibold">Inceput</th>
                          <th className="px-3 py-2 font-semibold">Sfarsit</th>
                          <th className="px-3 py-2 font-semibold">Status</th>
                          <th className="px-3 py-2 font-semibold">Factura</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grileAccess.events.map((event) => {
                          const isActive = new Date(event.ends_at).getTime() > Date.now();
                          const isCurrentPlan =
                            grileAccess.current_plan_code === event.plan_code && grileAccess.access_until === event.ends_at;
                          const isRevokedManual = event.plan_code === "admin_manual" && !isCurrentPlan;
                          return (
                            <tr key={event.id} className="border-t border-zinc-200 text-zinc-800">
                              <td className="px-3 py-2">
                                <p className="font-semibold">{event.plan_name}</p>
                                <p className="text-xs text-zinc-500">
                                  {event.is_free ? "Trial gratuit" : event.paid_amount != null ? `${event.paid_amount} ${event.currency ?? "RON"}` : "Abonament platit"}
                                </p>
                              </td>
                              <td className="px-3 py-2">{new Date(event.starts_at).toLocaleDateString("ro-RO")}</td>
                              <td className="px-3 py-2">{new Date(event.ends_at).toLocaleDateString("ro-RO")}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    isRevokedManual
                                      ? "border border-rose-200 bg-rose-50 text-rose-700"
                                      : isActive
                                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border border-zinc-200 bg-zinc-50 text-zinc-600"
                                  }`}
                                >
                                  {isRevokedManual ? "Revocat" : isActive ? "Activ" : "Expirat"}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {event.invoice_number ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDownloadingGrileInvoiceEventId(event.id);
                                      void openAuthenticatedDocumentInNewTab(`/api/grile/access/history/${event.id}/invoice`)
                                        .catch((downloadError) => {
                                          const message =
                                            downloadError instanceof Error
                                              ? downloadError.message
                                              : "Nu am putut deschide factura.";
                                          window.alert(message);
                                        })
                                        .finally(() => {
                                          setDownloadingGrileInvoiceEventId((current) => (current === event.id ? null : current));
                                        });
                                    }}
                                    disabled={downloadingGrileInvoiceEventId === event.id}
                                    className="inline-flex items-center rounded-lg border border-yellow-500 bg-yellow-200 px-2.5 py-1 text-xs font-semibold text-slate-900 hover:bg-yellow-300 disabled:opacity-60"
                                  >
                                    {downloadingGrileInvoiceEventId === event.id ? "Se deschide..." : "Vezi factura"}
                                  </button>
                                ) : event.is_paid ? (
                                  <span className="text-xs text-zinc-500">Factura indisponibila momentan</span>
                                ) : (
                                  <span className="text-xs text-zinc-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeSection === "examMode" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900">Mod Examen</h2>
              <p className="text-sm text-zinc-600">
                Vezi toate examenele sustinute si intra pe detalii ca sa revezi ce ai gresit si ce ai rezolvat corect.
              </p>
              {loadingExamAttempts ? <p className="text-sm text-zinc-600">Se incarca examenele...</p> : null}
              {!loadingExamAttempts && examAttempts.length === 0 ? (
                <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  Nu ai examene finalizate momentan.
                </p>
              ) : null}
              {!loadingExamAttempts && examAttempts.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-zinc-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Sursa</th>
                        <th className="px-3 py-2 font-semibold">Data</th>
                        <th className="px-3 py-2 font-semibold">Nota</th>
                        <th className="px-3 py-2 font-semibold">Punctaj grile</th>
                        <th className="px-3 py-2 font-semibold">Intrebari</th>
                        <th className="px-3 py-2 font-semibold">Durata</th>
                        <th className="px-3 py-2 font-semibold">Actiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examAttempts.map((attempt) => (
                        <tr key={attempt.id} className="border-t border-zinc-200 text-zinc-800">
                          <td className="px-3 py-2">{attempt.source_name}</td>
                          <td className="px-3 py-2">{new Date(attempt.finished_at ?? attempt.started_at).toLocaleString("ro-RO")}</td>
                          <td className="px-3 py-2 font-semibold">{((attempt.score_total ?? 0) / 10).toFixed(2)} / 10</td>
                          <td className="px-3 py-2">{((attempt.score_without_bonus ?? 0) / 10).toFixed(2)} / 9</td>
                          <td className="px-3 py-2">{attempt.question_count}</td>
                          <td className="px-3 py-2">{formatTimeFromSeconds(attempt.time_spent_seconds ?? 0)}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/grile/source/${attempt.source_id}/exam?attempt=${attempt.id}`}
                                className="inline-flex cursor-pointer items-center rounded-lg border border-yellow-500 bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-yellow-500"
                              >
                                Detalii
                              </Link>
                              <button
                                type="button"
                                onClick={() => void handleDeleteExamAttempt(attempt.id)}
                                disabled={deletingAttemptId === attempt.id}
                                className="inline-flex cursor-pointer items-center rounded-lg border border-yellow-600 bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-yellow-600 disabled:opacity-60"
                              >
                                {deletingAttemptId === attempt.id ? "Se sterge..." : "Sterge"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeSection === "classes" ? (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900">Teme grile</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Teme de grile din toate grupele tale de meditatii. Poti rezolva oricand, inclusiv dupa expirare.
                </p>
                <MyHomeworkSection />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900">Teme probleme</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Teme de probleme din toate grupele tale de meditatii. O problema conteaza ca rezolvata in tema doar daca
                  ai rezolvat-o corect dupa data la care a fost pusa tema.
                </p>
                <MyProblemsHomeworkSection initialOpenAssignmentId={openProblemsTemaId} />
              </div>
            </div>
          ) : null}

          {activeSection === "meditations" ? (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-900">Meditații</h2>
              <PlacementTestCard />
              {myMeditationGroups.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-emerald-800">Ai acces la meditatii.</p>
                  {myMeditationGroups.map((group) => (
                    <div key={group.group_id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm text-emerald-700">
                        Grupa: <span className="font-semibold">{group.name}</span>
                      </p>
                      <p className="mt-1 text-sm text-emerald-700">
                        Program: {weekdayLabel(group.weekday)}, {group.start_time} - {group.end_time}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">Nu ai acces la meditatii.</p>
              )}

              <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-semibold text-zinc-900">Sedintele la care ai participat</p>
                {meditationPaymentMessage ? <p className="mt-2 text-sm text-emerald-700">{meditationPaymentMessage}</p> : null}
                {meditationInvoiceDownloadError ? (
                  <p className="mt-2 text-sm text-rose-700">{meditationInvoiceDownloadError}</p>
                ) : null}
                {loadingMeditationSessions ? <p className="mt-2 text-sm text-zinc-600">Se incarca sedintele...</p> : null}
                {!loadingMeditationSessions ? (
                  <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-600">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Data</th>
                          <th className="px-3 py-2 font-semibold">Grupa</th>
                          <th className="px-3 py-2 font-semibold">Program</th>
                          <th className="px-3 py-2 font-semibold">Suma</th>
                          <th className="px-3 py-2 font-semibold">Status</th>
                          <th className="px-3 py-2 font-semibold">Factura / Plata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myMeditationSessions.map((session) => (
                          <tr key={session.id} className="border-t border-zinc-200 text-zinc-800">
                            <td className="px-3 py-2">{new Date(session.session_date).toLocaleDateString("ro-RO")}</td>
                            <td className="px-3 py-2">{session.group_name}</td>
                            <td className="px-3 py-2">{weekdayLabel(session.weekday)} {session.start_time}-{session.end_time}</td>
                            <td className="px-3 py-2">{Number(session.amount_lei).toFixed(0)} lei</td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  session.is_paid ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700"
                                }`}
                              >
                                {session.is_paid ? "Platita" : "Neplatita"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {session.is_paid ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMeditationInvoiceDownloadError(null);
                                    setDownloadingMeditationInvoiceId(session.id);
                                    void openAuthenticatedDocumentInNewTab(`/api/meditations/my-sessions/${session.id}/invoice`)
                                      .catch((downloadError) => {
                                        setMeditationInvoiceDownloadError(
                                          downloadError instanceof Error
                                            ? downloadError.message
                                            : "Nu am putut deschide factura.",
                                        );
                                      })
                                      .finally(() => setDownloadingMeditationInvoiceId(null));
                                  }}
                                  disabled={downloadingMeditationInvoiceId === session.id}
                                  className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                                >
                                  {downloadingMeditationInvoiceId === session.id ? "Se deschide..." : "Vezi factura"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPayingMeditationSessionId(session.id)}
                                  className="inline-flex items-center rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100"
                                >
                                  Plateste
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {myMeditationSessions.length === 0 ? (
                          <tr className="border-t border-zinc-200 text-zinc-600">
                            <td className="px-3 py-3" colSpan={6}>
                              Nu ai sedinte inregistrate momentan.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeSection === "adminUsers" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900">Admin Users</h2>
              <p className="text-sm text-zinc-600">Cauta dupa nume/prenume sau email si vezi toti utilizatorii inregistrati.</p>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <input
                  value={adminUsersSearch}
                  onChange={(event) => setAdminUsersSearch(event.target.value)}
                  placeholder="Cauta dupa nume, prenume sau email..."
                  className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                />
              </div>

              {adminUsersLoading ? <p className="text-sm text-zinc-600">Se incarca utilizatorii...</p> : null}

              {!adminUsersLoading ? (
                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-zinc-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Nume / Prenume</th>
                        <th className="px-3 py-2 font-semibold">Email</th>
                        <th className="px-3 py-2 font-semibold">Username</th>
                        <th className="px-3 py-2 font-semibold">Rol</th>
                        <th className="px-3 py-2 font-semibold">Verificat</th>
                        <th className="px-3 py-2 font-semibold">Creat la</th>
                        <th className="px-3 py-2 font-semibold">Actiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((entry) => {
                        const name =
                          `${entry.first_name ?? ""} ${entry.last_name ?? ""}`.trim() || entry.full_name || "-";
                        return (
                          <tr key={entry.id} className="border-t border-zinc-200 text-zinc-800">
                            <td className="px-3 py-2">{name}</td>
                            <td className="px-3 py-2">{entry.email}</td>
                            <td className="px-3 py-2">{entry.username}</td>
                            <td className="px-3 py-2 capitalize">{entry.role}</td>
                            <td className="px-3 py-2">{entry.email_verified ? "Da" : "Nu"}</td>
                            <td className="px-3 py-2">{new Date(entry.created_at).toLocaleString("ro-RO")}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => void handleOpenAdminUser(entry)}
                                className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100"
                              >
                                Administrare
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {adminUsers.length === 0 ? (
                        <tr className="border-t border-zinc-200 text-zinc-600">
                          <td className="px-3 py-3" colSpan={7}>
                            Nu exista utilizatori pentru filtrul curent.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {managingUserId ? (
                <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-sky-950">
                      Administrare utilizator:{" "}
                      <span className="font-bold">{managedAccess?.user.email ?? managingUserId}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setManagingUserId(null);
                        setManagedAccess(null);
                        setAdminActionMessage(null);
                      }}
                      className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50"
                    >
                      Inchide administrare
                    </button>
                  </div>

                  {managedAccessLoading ? <p className="text-sm text-zinc-600">Se incarca accesurile...</p> : null}
                  {adminActionMessage ? <p className="mb-3 text-sm text-zinc-700">{adminActionMessage}</p> : null}

                  {!managedAccessLoading && managedAccess ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-zinc-200 bg-white p-3">
                        <p className="text-sm font-semibold text-zinc-900">Acces curent la grile</p>
                        <p className="mt-1 text-sm text-zinc-700">
                          {managedAccess.grile.has_access && managedAccess.grile.access_until
                            ? `Activ pana la ${new Date(managedAccess.grile.access_until).toLocaleString("ro-RO")}`
                            : "Inactiv"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Plan curent: {managedAccess.grile.current_plan_code ?? "-"} • Trial folosit: {managedAccess.grile.trial_used ? "Da" : "Nu"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-zinc-200 bg-white p-3">
                        <p className="text-sm font-semibold text-zinc-900">Acorda acces la grile (calendar)</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                          <label className="text-xs text-zinc-700">
                            Data inceput
                            <input
                              type="datetime-local"
                              value={grantStartAt}
                              onChange={(event) => setGrantStartAt(event.target.value)}
                              className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                            />
                          </label>
                          <label className="text-xs text-zinc-700">
                            Data final
                            <input
                              type="datetime-local"
                              value={grantEndAt}
                              onChange={(event) => setGrantEndAt(event.target.value)}
                              className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleGrantGrileAccess()}
                          disabled={grantingGrile}
                          className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
                        >
                          {grantingGrile ? "Se acorda..." : "Acorda acces grile"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRevokeGrileAccess()}
                          disabled={revokingGrile}
                          className="ml-2 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                        >
                          {revokingGrile ? "Se sterge..." : "Sterge acces grile"}
                        </button>
                      </div>

                      <div className="rounded-lg border border-zinc-200 bg-white p-3">
                        <p className="text-sm font-semibold text-zinc-900">Acorda acces la cursuri</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                          <label className="text-xs text-zinc-700">
                            Curs
                            <select
                              value={grantCourseSlug}
                              onChange={(event) => {
                                setGrantCourseSlug(event.target.value);
                                setGrantCoursePartIds([]);
                              }}
                              className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                            >
                              <option value="">Selecteaza curs...</option>
                              {allCoursesCatalog.map((course) => (
                                <option key={course.id} value={course.slug}>
                                  {course.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs text-zinc-700">
                            Mod acordare
                            <select
                              value={grantCourseMode}
                              onChange={(event) => {
                                const mode = event.target.value as "all_parts" | "selected_parts";
                                setGrantCourseMode(mode);
                                if (mode === "all_parts") setGrantCoursePartIds([]);
                              }}
                              className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                            >
                              <option value="all_parts">Toate partile</option>
                              <option value="selected_parts">Parti selectate</option>
                            </select>
                          </label>
                        </div>

                        {grantCourseMode === "selected_parts" && selectedGrantCourse ? (
                          <div className="mt-2 grid grid-cols-1 gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                            {(selectedGrantCourse.parts ?? []).map((part) => (
                              <label key={part.id} className="flex items-center gap-2 text-xs text-zinc-700">
                                <input
                                  type="checkbox"
                                  checked={grantCoursePartIds.includes(part.id)}
                                  onChange={(event) =>
                                    setGrantCoursePartIds((prev) =>
                                      event.target.checked ? [...prev, part.id] : prev.filter((id) => id !== part.id),
                                    )
                                  }
                                />
                                <span>
                                  Partea {part.order_index}: {part.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => void handleGrantCourseAccess()}
                          disabled={grantingCourse || !grantCourseSlug}
                          className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
                        >
                          {grantingCourse ? "Se acorda..." : "Acorda acces curs"}
                        </button>
                      </div>

                      <div className="rounded-lg border border-zinc-200 bg-white p-3">
                        <p className="text-sm font-semibold text-zinc-900">Acces la meditatii (grupe)</p>
                        {managedUserMeditationGroups.length > 0 ? (
                          <ul className="mt-2 space-y-2">
                            {managedUserMeditationGroups.map((group) => (
                              <li
                                key={group.group_id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                              >
                                <span>
                                  {group.name} ({weekdayLabel(group.weekday)} {group.start_time}-{group.end_time})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void handleRemoveMeditationGroup(group.group_id)}
                                  disabled={removingMeditationGroupId === group.group_id}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-60"
                                >
                                  {removingMeditationGroupId === group.group_id ? "Se scoate..." : "Scoate"}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-zinc-600">Elevul nu este in nicio grupa.</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <select
                            value={selectedMeditationGroupId}
                            onChange={(event) => setSelectedMeditationGroupId(event.target.value)}
                            className="min-w-[260px] rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                          >
                            <option value="">Alege grupa de adaugat</option>
                            {meditationGroups
                              .filter((g) => !managedUserMeditationGroups.some((m) => m.group_id === g.id))
                              .map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name} - {weekdayLabel(group.weekday)} {group.start_time}-{group.end_time}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleAddMeditationGroup()}
                            disabled={savingMeditationGroup || !selectedMeditationGroupId}
                            className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
                          >
                            {savingMeditationGroup ? "Se adauga..." : "Adauga in grupa"}
                          </button>
                          {managedUserMeditationGroups.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => void handleRemoveAllMeditationGroups()}
                              disabled={savingMeditationGroup}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-60"
                            >
                              Scoate din toate grupele
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-3 border-t border-zinc-200 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sedinte participare</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {managedUserMeditationGroups.length > 1 ? (
                              <select
                                value={adminSessionGroupId}
                                onChange={(event) => setAdminSessionGroupId(event.target.value)}
                                className="min-w-[220px] rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                              >
                                {managedUserMeditationGroups.map((group) => (
                                  <option key={group.group_id} value={group.group_id}>
                                    {group.name}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                            <input
                              type="date"
                              value={adminNewSessionDate}
                              onChange={(event) => setAdminNewSessionDate(event.target.value)}
                              className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => void handleAdminCreateMeditationSession()}
                              disabled={adminCreatingSession || managedUserMeditationGroups.length === 0}
                              className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
                            >
                              {adminCreatingSession ? "Se adauga..." : "Adauga sedinta (150 lei)"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-zinc-200 bg-white p-3">
                        <p className="text-sm font-semibold text-zinc-900">Accesuri curente la cursuri</p>
                        {managedAccess.courses.length === 0 ? (
                          <p className="mt-2 text-sm text-zinc-600">Nu are accesuri la cursuri.</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {managedAccess.courses.map((course) => (
                              <div key={course.course_id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-zinc-900">{course.course_name}</p>
                                    <p className="text-xs text-zinc-500">{course.parts.length} parti acordate</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => void handleRevokeCourseAccess(course.course_slug)}
                                    disabled={revokingCourseSlug === course.course_slug}
                                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                  >
                                    {revokingCourseSlug === course.course_slug ? "Se sterge..." : "Sterge acces"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeSection === "adminMeditations" ? <AdminMeditatiiAdministrarePanel /> : null}

          {activeSection === "adminGrile" ? <AdminGrileDashboardWorkspace /> : null}

          {activeSection === "adminDiscountCodes" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900">Coduri de reducere</h2>
              <p className="text-sm text-zinc-600">
                Genereaza coduri intre 5% si 100%. Domeniu: tot site-ul (orice checkout compatibil), doar cursuri, doar abonament
                grile sau doar corecturi BAC. Stergerea este permanenta.
              </p>
              {discountAdminMessage ? <p className="text-sm text-zinc-700">{discountAdminMessage}</p> : null}

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Adauga cod</p>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="text-xs text-zinc-700">
                    Reducere (%)
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={newDiscountPercent}
                      onChange={(e) => setNewDiscountPercent(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="text-xs text-zinc-700">
                    Unde e valabil
                    <select
                      value={newDiscountScope}
                      onChange={(e) => setNewDiscountScope(e.target.value as AdminDiscountCodeRow["scope"])}
                      className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="site">Tot site-ul (checkout compatibil)</option>
                      <option value="courses">Doar cursuri</option>
                      <option value="grile">Doar abonamente grile</option>
                      <option value="bac_correction">Doar corecturi BAC</option>
                    </select>
                  </label>
                  <label className="text-xs text-zinc-700">
                    Cod personalizat (optional)
                    <input
                      value={newDiscountCustomCode}
                      onChange={(e) => setNewDiscountCustomCode(e.target.value)}
                      placeholder="Lasa gol pentru cod aleator"
                      className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreateAdminDiscount()}
                  disabled={creatingDiscount}
                  className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
                >
                  {creatingDiscount ? "Se creeaza..." : "Creeaza cod"}
                </button>
              </div>

              {discountAdminLoading ? <p className="text-sm text-zinc-600">Se incarca...</p> : null}
              {!discountAdminLoading ? (
                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-zinc-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Cod</th>
                        <th className="px-3 py-2 font-semibold">%</th>
                        <th className="px-3 py-2 font-semibold">Domeniu</th>
                        <th className="px-3 py-2 font-semibold">Folosiri</th>
                        <th className="px-3 py-2 font-semibold">Creat</th>
                        <th className="px-3 py-2 font-semibold">Actiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discountAdminRows.map((row) => (
                        <tr key={row.id} className="border-t border-zinc-200 text-zinc-800">
                          <td className="px-3 py-2 font-mono font-semibold">{row.code}</td>
                          <td className="px-3 py-2">{row.percent_off}%</td>
                          <td className="px-3 py-2">{row.scope}</td>
                          <td className="px-3 py-2">{row.uses_count}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{new Date(row.created_at).toLocaleString("ro-RO")}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => void handleDeleteAdminDiscount(row.id)}
                              disabled={deletingDiscountId === row.id}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                            >
                              {deletingDiscountId === row.id ? "..." : "Sterge"}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {discountAdminRows.length === 0 ? (
                        <tr className="border-t border-zinc-200 text-zinc-600">
                          <td className="px-3 py-3" colSpan={6}>
                            Nu exista coduri inca.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
      {selectedMeditationSessionToPay ? (
        <BillingProfileCheckoutModal
          open
          fieldIdPrefix="meditations-session-payment"
          summary={
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Plata sedinta meditatii</p>
              <p className="mt-1 text-lg font-bold text-sky-950">{selectedMeditationSessionToPay.group_name}</p>
              <p className="mt-0.5 text-sm text-slate-700">
                {new Date(selectedMeditationSessionToPay.session_date).toLocaleDateString("ro-RO")} •{" "}
                {weekdayLabel(selectedMeditationSessionToPay.weekday)} {selectedMeditationSessionToPay.start_time}-
                {selectedMeditationSessionToPay.end_time}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {Number(selectedMeditationSessionToPay.amount_lei).toFixed(0)} lei
              </p>
            </div>
          }
          submitLabel="Plateste"
          onClose={() => setPayingMeditationSessionId(null)}
          onConfirm={handlePayMeditationSession}
        />
      ) : null}
    </main>
  );
}

function formatTimeFromSeconds(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function weekdayLabel(value: number) {
  if (value === 1) return "Luni";
  if (value === 2) return "Marti";
  if (value === 3) return "Miercuri";
  if (value === 4) return "Joi";
  if (value === 5) return "Vineri";
  if (value === 6) return "Sambata";
  if (value === 7) return "Duminica";
  return `Ziua ${value}`;
}

function getReadableApiError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const marker = ": ";
  const markerIndex = error.message.indexOf(marker);
  if (markerIndex < 0) return error.message || fallback;
  const maybeJson = error.message.slice(markerIndex + marker.length);
  try {
    const parsed = JSON.parse(maybeJson) as { error?: string; message?: string };
    if (parsed?.message?.trim()) return parsed.message.trim();
    if (parsed?.error?.trim()) return parsed.error.trim();
  } catch {
    // keep original message
  }
  return error.message || fallback;
}
