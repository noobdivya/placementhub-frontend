// ---------------------------------------------------------------------------
// Shared types (they mirror the backend's JSON — see placementhub-backend/openapi.yaml),
// UI constants, small helpers, and the default copy for the public home page.
// ---------------------------------------------------------------------------

import type { Role } from "./api";
export type { Role };

export type JobType = "Full-time" | "Internship";
export type JobStatus = "Draft" | "Pending" | "Open" | "Closed" | "Rejected";
/** The five pipeline stages. `Withdrawn` is a student-side outcome, shown but never a column. */
export type Stage = "Applied" | "Shortlisted" | "Interview" | "Offered" | "Rejected";
export type ApplicationStage = Stage | "Withdrawn";
export type StudentStatus = "Placed" | "In process" | "Unplaced";

export const STAGES: Stage[] = ["Applied", "Shortlisted", "Interview", "Offered", "Rejected"];
export const BRANCHES = ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "BBA", "BCA", "MBA"] as const;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Job {
  id: string;
  companyId: string;
  company: string;
  color: string; // brand tint for the logo tile
  role: string;
  type: JobType;
  location: string;
  ctc: number; // LPA (or stipend ×12 for internships)
  minCgpa: number;
  branches: string[];
  skills: string[];
  deadline: string; // YYYY-MM-DD
  openings: number;
  applicants: number;
  status: JobStatus;
  description: string;
  allowBacklogs: boolean;
  rejectReason?: string;
}

export interface BlockReason {
  code: string;
  message: string;
}

/** A job as a student sees it: with their own eligibility verdict. */
export interface StudentJob extends Job {
  eligible: boolean;
  applied: boolean;
  applicationId: string | null;
  canApply: boolean;
  blockReason: BlockReason | null;
}

export interface OfferInfo {
  id: string;
  status: "Pending" | "Accepted" | "Declined" | "Expired" | "Rescinded";
  ctc: number;
  validUntil: string;
}

export interface Application {
  id: string;
  jobId: string;
  company: string;
  color: string;
  role: string;
  appliedOn: string;
  stage: ApplicationStage;
  note: string;
  updatedAt: string;
  offer: OfferInfo | null;
}

/** An applicant to one of the company's jobs. `id` is the application id. */
export interface Candidate {
  id: string;
  studentId: string;
  name: string;
  branch: string;
  cgpa: number;
  jobId: string;
  role: string;
  stage: ApplicationStage;
  skills: string[];
  appliedOn: string;
  note: string;
  hasResume: boolean;
  offer: OfferInfo | null;
}

export interface Student {
  id: string;
  name: string;
  roll: string;
  email: string;
  branch: string;
  cgpa: number;
  active: boolean;
  status: StudentStatus;
  company?: string;
  ctc?: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  roll: string;
  email: string;
  phone: string;
  branch: string;
  year: string;
  cgpa: number;
  backlogs: number;
  tenth: number | null;
  twelfth: number | null;
  skills: string[];
  links: { github: string; linkedin: string };
  about: string;
  resume: { filename: string; sizeBytes: number; uploadedAt: string } | null;
  placement: { status: StudentStatus; offerId?: string; company?: string; role?: string; ctc?: number };
}

export interface CompanyRecord {
  id: string;
  name: string;
  color: string;
  industry: string;
  hr: string;
  email: string;
  phone: string;
  status: "Approved" | "Pending" | "Rejected";
  statusReason: string;
  openRoles: number;
  hires: number;
  lastVisit: string | null;
}

export interface Drive {
  id: string;
  companyId: string;
  company: string;
  color: string;
  jobId: string | null;
  title: string;
  date: string; // ISO
  time: string;
  durationMinutes: number;
  mode: "On-campus" | "Virtual" | "Off-campus";
  venue: string;
  registered: number;
  eligible: number;
  status: "Upcoming" | "Ongoing" | "Completed";
  minCgpa: number;
  branches: string[];
  allowBacklogs: boolean;
}

export interface StudentDrive extends Drive {
  isRegistered: boolean;
  canRegister: boolean;
  blockReason: BlockReason | null;
}

export interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface Overview {
  stats: { totalStudents: number; placed: number; avgCtc: number; highestCtc: number; companiesVisited: number; offers: number };
  monthlyOffers: { label: string; value: number }[];
  branchStats: { branch: string; total: number; placed: number }[];
  ctcBands: { label: string; value: number }[];
  topRecruiters: { name: string; hires: number; color: string }[];
  recentOffers: { student: string; company: string; role: string; ctc: number; date: string; status: string }[];
}

/** Portal home for each role. */
export const ROLE_HOME = { student: "/students", company: "/companies", admin: "/placementcell" } as const;

// ---- Small helpers --------------------------------------------------------

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  if (!iso.includes("-")) return iso;
  const d = iso.length > 10 ? new Date(iso) : new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function shortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/** Internships are stored as an annualised CTC; show them as a monthly stipend. */
export function payLabel(j: { type: JobType; ctc: number }) {
  return j.type === "Internship" ? `₹${Math.round((j.ctc * 100) / 12)}k/mo` : `${j.ctc} LPA`;
}

export function fileSize(bytes: number) {
  return bytes >= 1 << 20 ? `${(bytes / (1 << 20)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// ---- Public home page content --------------------------------------------
// Defaults only. The home page overlays whatever the API returns from
// /site-config, /notices and /recruiters on top of these, so it still renders
// if the backend is unreachable. Edit the live copy with PUT /admin/site-config.

export interface SiteConfig {
  name: string;
  college: string;
  address: string;
  email: string;
  phones: string[];
  hours: string;
  brochure: string;
  socials: { label: string; href: string }[];
  heroSlides: HeroSlide[];
  deskMessages: { role: string; name: string; title: string; text: string }[];
  testimonials: { name: string; batch: string; company: string; quote: string }[];
  stats: { placed: number; companiesVisited: number; avgCtc: number; highestCtc: number };
}

export interface HeroSlide {
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  gradient: string;
}

export const defaultSite: SiteConfig = {
  name: "Placement Hub",
  college: "Your College Name",
  address: "College Road, Your Area, City, State - 000000",
  email: "placements@yourcollege.edu",
  phones: ["+91 00000 00000", "+91 00000 00001"],
  hours: "Mon – Fri, 10:00 AM – 5:00 PM",
  brochure: "#",
  socials: [
    { label: "Facebook", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "Twitter", href: "#" },
  ],
  heroSlides: [
    {
      eyebrow: "Recruitment brochure 2026–27",
      title: "Hire the next generation of talent from campus",
      text: "Everything recruiters need to know about our batch, programmes and hiring process.",
      cta: "Download brochure",
      href: "#",
      gradient: "from-indigo-100 via-indigo-50 to-violet-100 dark:from-indigo-950 dark:via-indigo-900 dark:to-violet-900",
    },
    {
      eyebrow: "Placement season 2026 is live",
      title: "Explore openings from visiting companies",
      text: "Browse eligible roles, apply in one click and track every stage of your journey.",
      cta: "Browse opportunities",
      href: "/students/jobs",
      gradient: "from-sky-100 via-sky-50 to-cyan-100 dark:from-sky-950 dark:via-sky-900 dark:to-cyan-900",
    },
    {
      eyebrow: "For recruiters",
      title: "Post a role and reach the right students",
      text: "Set eligibility, shortlist candidates and schedule drives — all in one place.",
      cta: "Recruiter portal",
      href: "/companies",
      gradient: "from-emerald-100 via-emerald-50 to-teal-100 dark:from-emerald-950 dark:via-emerald-900 dark:to-teal-900",
    },
  ],
  deskMessages: [
    {
      role: "Principal's desk",
      name: "Prof. Firstname Lastname",
      title: "Principal",
      text: "Since its founding, our institution has stood for sincerity, integrity and excellence. The Placement Cell carries that commitment forward by preparing students for the world of work and connecting them with organisations that value them.",
    },
    {
      role: "Convenor's desk",
      name: "Ms. Firstname Lastname",
      title: "Convenor, Placement Cell",
      text: "Education finds its true meaning when knowledge is translated into skills, confidence and meaningful career opportunities. Our aim is to make that translation smooth for every student, in every discipline.",
    },
    {
      role: "President's desk",
      name: "Firstname Lastname",
      title: "President, Placement Cell 2026–27",
      text: "This year we aim to widen our corporate outreach and to measure success by more than placement numbers — by the fit, growth and satisfaction of every student who goes through the process.",
    },
  ],
  testimonials: [
    { name: "Sneha Iyer", batch: "2026 · CSE", company: "Nimbus Labs", quote: "The cell's mock interviews and resume reviews made the real thing feel familiar. I walked into my technical round confident." },
    { name: "Simran Kaur", batch: "2026 · ECE", company: "Quantra Systems", quote: "Getting drive updates and eligibility in one place meant I never missed a deadline. The team followed up at every step." },
    { name: "Meera Kapoor", batch: "2026 · CSE", company: "Helix Health", quote: "From the pre-placement talks to the final offer, the cell supported us like a family. I'm grateful for the guidance." },
  ],
  // No public statistics endpoint exists; the placement cell can publish these via `stats` in site-config.
  stats: { placed: 412, companiesVisited: 58, avgCtc: 11.8, highestCtc: 42 },
};

export interface NoticeItem {
  id: string;
  date: string;
  tag: string;
  title: string;
}
