/**
 * MIST JOB PORTAL — demo data seeder
 * ---------------------------------------------------------------------------
 * Creates demo accounts, companies, jobs, applications, and interviews.
 * Uses the Supabase service_role key, so it bypasses Row Level Security.
 *
 *   1. cp .env.example .env      (fill in URL + service_role key)
 *   2. npm install
 *   3. npm run seed
 *
 * Safe to re-run: it checks for existing rows before inserting.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || SUPABASE_URL.includes("YOUR-PROJECT")) {
  console.error(
    "\nMissing credentials.\nCopy .env.example to .env and fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n"
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = "MistPortal123!";

/* ------------------------------------------------------------------ */
/* demo definitions                                                    */
/* ------------------------------------------------------------------ */

const COMPANIES = [
  {
    name: "TechNova Solutions",
    industry: "Information Technology",
    address: "12F One Ayala Tower, Makati City",
    email: "hr@technova.test",
    phone: "+63 917 100 1001",
    website: "https://technova.test",
    description:
      "TechNova builds web and mobile products for Philippine SMEs. We are a small, product-focused team that ships every week.",
    employer: { first: "Maria", last: "Santos", position: "HR Manager", phone: "+63 917 200 1001" },
  },
  {
    name: "Blue Harbor Logistics",
    industry: "Logistics",
    address: "Km 16 West Service Road, Parañaque City",
    email: "careers@blueharbor.test",
    phone: "+63 917 100 1002",
    website: "https://blueharbor.test",
    description:
      "Blue Harbor moves cargo across Luzon, Visayas, and Mindanao with a fleet of 120 trucks and three warehouses.",
    employer: { first: "Jose", last: "Reyes", position: "Talent Acquisition Lead", phone: "+63 917 200 1002" },
  },
  {
    name: "GreenLeaf Foods",
    industry: "Food & Beverage",
    address: "88 Ortigas Avenue, Pasig City",
    email: "jobs@greenleaf.test",
    phone: "+63 917 100 1003",
    website: "https://greenleaf.test",
    description:
      "GreenLeaf produces ready-to-eat meals from locally sourced ingredients and supplies major supermarket chains.",
    employer: { first: "Angela", last: "Cruz", position: "People Operations", phone: "+63 917 200 1003" },
  },
  {
    name: "Orbit Finance",
    industry: "Finance",
    address: "Ayala Triangle Gardens, Makati City",
    email: "recruit@orbitfinance.test",
    phone: "+63 917 100 1004",
    website: "https://orbitfinance.test",
    description:
      "Orbit Finance provides bookkeeping, payroll, and tax services to growing startups across Southeast Asia.",
    employer: { first: "Daniel", last: "Lim", position: "Finance Manager", phone: "+63 917 200 1004" },
  },
  {
    name: "MIST Software Labs",
    industry: "Software",
    address: "IT Park, Lahug, Cebu City",
    email: "hello@mistlabs.test",
    phone: "+63 917 100 1005",
    website: "https://mistlabs.test",
    description:
      "MIST Software Labs is the partner company for our student project. We build internal tools, dashboards, and job portals.",
    employer: { first: "Harvy", last: "Wagas", position: "Engineering Manager", phone: "+63 917 200 1005" },
  },
  {
    name: "PixelForge Studio",
    industry: "Creative",
    address: "Katipunan Avenue, Quezon City",
    email: "studio@pixelforge.test",
    phone: "+63 917 100 1006",
    website: "https://pixelforge.test",
    description:
      "PixelForge is a design studio working with brands on identity, packaging, and social campaigns.",
    employer: { first: "Bea", last: "Navarro", position: "Creative Director", phone: "+63 917 200 1006" },
  },
  {
    name: "Sunrise Health",
    industry: "Healthcare",
    address: "J.P. Laurel Avenue, Davao City",
    email: "hr@sunrisehealth.test",
    phone: "+63 917 100 1007",
    website: "https://sunrisehealth.test",
    description:
      "Sunrise Health operates three outpatient clinics and a diagnostic center in Davao.",
    employer: { first: "Ramon", last: "Villanueva", position: "HR Officer", phone: "+63 917 200 1007" },
  },
  {
    name: "Northwind Retail",
    industry: "Retail",
    address: "SM City Cebu, Cebu City",
    email: "careers@northwind.test",
    phone: "+63 917 100 1008",
    website: "https://northwind.test",
    description:
      "Northwind Retail runs 40 department store branches nationwide with a focus on home and lifestyle products.",
    employer: { first: "Liza", last: "Mendoza", position: "Store Operations Head", phone: "+63 917 200 1008" },
  },
];

const SEEKERS = [
  { first: "Juan", last: "Dela Cruz", middle: "Ramos", education: "BS Information Technology", skills: "JavaScript, HTML, CSS, React", address: "Quezon City", phone: "+63 918 300 2001" },
  { first: "Ana", last: "Garcia", middle: "Lopez", education: "BS Accountancy", skills: "Excel, bookkeeping, SAP", address: "Makati City", phone: "+63 918 300 2002" },
  { first: "Mark", last: "Bautista", middle: "Santos", education: "BS Computer Science", skills: "Node.js, PostgreSQL, Git", address: "Cebu City", phone: "+63 918 300 2003" },
  { first: "Grace", last: "Ramos", middle: "Cruz", education: "BS Nursing", skills: "Patient care, triage, BLS", address: "Davao City", phone: "+63 918 300 2004" },
  { first: "Paolo", last: "Mendoza", middle: "Reyes", education: "BS Marketing", skills: "Social media, copywriting, Canva", address: "Pasig City", phone: "+63 918 300 2005" },
  { first: "Kim", last: "Torres", middle: "Aquino", education: "BS Industrial Engineering", skills: "Inventory, process improvement, Excel", address: "Iloilo City", phone: "+63 918 300 2006" },
];

const JOBS = [
  { company: 0, title: "Junior Web Developer", type: "Full-time", location: "Makati City", salary: "₱25,000 – ₱35,000 / month", days: 14, description: "Build and maintain customer-facing web pages using HTML, CSS, and JavaScript. Work closely with designers and backend developers.", qualifications: "BS in IT or Computer Science, or equivalent portfolio. Fresh graduates are welcome.", skills: "HTML, CSS, JavaScript, Git" },
  { company: 0, title: "IT Support Specialist", type: "Full-time", location: "Quezon City", salary: "₱22,000 – ₱28,000 / month", days: 21, description: "Provide first-line support for hardware, software, and network issues across two offices.", qualifications: "1 year of helpdesk experience preferred.", skills: "Windows, networking, troubleshooting" },
  { company: 0, title: "QA Tester", type: "Contract", location: "Remote", salary: "₱20,000 – ₱30,000 / month", days: 10, description: "Write and execute test plans for web and mobile releases. Log defects clearly and verify fixes.", qualifications: "Experience with manual testing and bug trackers.", skills: "Testing, Jira, attention to detail" },
  { company: 1, title: "Warehouse Supervisor", type: "Full-time", location: "Cavite", salary: "₱30,000 – ₱40,000 / month", days: 30, description: "Oversee daily warehouse operations, including receiving, storage, and dispatch.", qualifications: "3 years in warehouse operations, 1 year in a supervisory role.", skills: "Inventory, leadership, safety compliance" },
  { company: 1, title: "Logistics Coordinator", type: "Full-time", location: "Laguna", salary: "₱22,000 – ₱30,000 / month", days: 25, description: "Coordinate deliveries, track shipments, and communicate with drivers and clients.", qualifications: "Degree in Logistics or related field.", skills: "Planning, communication, Excel" },
  { company: 2, title: "Sales Associate", type: "Full-time", location: "Pasig City", salary: "₱18,000 – ₱22,000 / month", days: 18, description: "Handle retail accounts and support supermarket partners with orders and promotions.", qualifications: "Excellent communication skills. Field sales experience is a plus.", skills: "Sales, negotiation, customer service" },
  { company: 2, title: "Food Safety Officer", type: "Full-time", location: "Bulacan", salary: "₱28,000 – ₱35,000 / month", days: 20, description: "Implement food safety standards across the production facility and conduct regular audits.", qualifications: "Degree in Food Technology or related field. HACCP training preferred.", skills: "HACCP, audits, documentation" },
  { company: 3, title: "Accounting Staff", type: "Full-time", location: "Makati City", salary: "₱20,000 – ₱26,000 / month", days: 15, description: "Prepare journal entries, reconcile bank statements, and assist with monthly closing.", qualifications: "BS Accountancy or Accounting Technology.", skills: "Bookkeeping, Excel, attention to detail" },
  { company: 3, title: "Financial Analyst", type: "Full-time", location: "Makati City", salary: "₱35,000 – ₱45,000 / month", days: 28, description: "Build financial models, prepare variance reports, and support client planning sessions.", qualifications: "2 years in financial analysis. CPA is a plus.", skills: "Financial modeling, Excel, reporting" },
  { company: 4, title: "Frontend Developer", type: "Full-time", location: "Remote", salary: "₱40,000 – ₱60,000 / month", days: 30, description: "Own the frontend of our internal products using modern JavaScript, HTML, and CSS. Ship accessible, responsive interfaces.", qualifications: "Strong JavaScript fundamentals and a portfolio of shipped work.", skills: "JavaScript, CSS, accessibility, Git" },
  { company: 4, title: "Backend Developer", type: "Full-time", location: "Cebu City", salary: "₱45,000 – ₱65,000 / month", days: 30, description: "Design APIs and data models on PostgreSQL. Keep services fast, observable, and secure.", qualifications: "Experience with Node.js and relational databases.", skills: "Node.js, PostgreSQL, SQL, REST" },
  { company: 4, title: "UI/UX Designer", type: "Part-time", location: "Remote", salary: "₱25,000 – ₱35,000 / month", days: 22, description: "Turn product requirements into wireframes, prototypes, and polished UI specs.", qualifications: "Portfolio with web or mobile product work.", skills: "Figma, prototyping, user research" },
  { company: 4, title: "Software Engineer Intern", type: "Internship", location: "Manila", salary: "₱8,000 – ₱12,000 / month", days: 12, description: "Join a product squad for a 3-month internship. Work on real tickets with a mentor.", qualifications: "Currently enrolled in an IT or CS program.", skills: "Any programming language, willingness to learn" },
  { company: 5, title: "Graphic Designer", type: "Full-time", location: "Quezon City", salary: "₱24,000 – ₱32,000 / month", days: 19, description: "Create brand assets, packaging layouts, and campaign visuals for client accounts.", qualifications: "Strong portfolio and proficiency in Adobe tools.", skills: "Illustrator, Photoshop, layout" },
  { company: 5, title: "Social Media Manager", type: "Part-time", location: "Remote", salary: "₱18,000 – ₱25,000 / month", days: 16, description: "Plan and publish content across client social channels and report on performance.", qualifications: "Experience managing brand accounts.", skills: "Content planning, copywriting, analytics" },
  { company: 6, title: "Registered Nurse", type: "Full-time", location: "Davao City", salary: "₱28,000 – ₱36,000 / month", days: 27, description: "Deliver outpatient nursing care, assist physicians, and maintain patient records.", qualifications: "Licensed RN in the Philippines.", skills: "Patient care, triage, documentation" },
  { company: 6, title: "Medical Records Clerk", type: "Full-time", location: "Davao City", salary: "₱16,000 – ₱20,000 / month", days: 24, description: "Organize and maintain patient records, ensuring accuracy and confidentiality.", qualifications: "Associate or bachelor's degree. Healthcare experience is a plus.", skills: "Records management, confidentiality, Excel" },
  { company: 7, title: "Store Manager", type: "Full-time", location: "Cebu City", salary: "₱35,000 – ₱45,000 / month", days: 29, description: "Lead a branch team, manage inventory, and hit sales targets.", qualifications: "3 years of retail experience with supervisory responsibility.", skills: "Leadership, inventory, sales" },
  { company: 7, title: "Cashier", type: "Part-time", location: "Iloilo City", salary: "₱12,000 – ₱15,000 / month", days: 20, description: "Process customer payments accurately and assist with basic store inquiries.", qualifications: "High school graduate or college level.", skills: "Customer service, accuracy, POS" },
  { company: 7, title: "Inventory Clerk", type: "Full-time", location: "Iloilo City", salary: "₱16,000 – ₱20,000 / month", days: 23, description: "Track stock levels, receive deliveries, and reconcile physical counts.", qualifications: "Experience in retail inventory preferred.", skills: "Inventory, Excel, organization" },
];

const APPLICATION_PLAN = [
  { seeker: 0, job: 0, status: "shortlisted" },
  { seeker: 0, job: 2, status: "pending" },
  { seeker: 0, job: 9, status: "reviewed" },
  { seeker: 1, job: 7, status: "reviewed" },
  { seeker: 1, job: 8, status: "shortlisted" },
  { seeker: 2, job: 10, status: "interview" },
  { seeker: 2, job: 4, status: "rejected" },
  { seeker: 3, job: 15, status: "hired" },
  { seeker: 3, job: 16, status: "pending" },
  { seeker: 4, job: 13, status: "shortlisted" },
  { seeker: 4, job: 14, status: "pending" },
  { seeker: 5, job: 17, status: "reviewed" },
  { seeker: 5, job: 19, status: "pending" },
];

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const stats = { users: 0, companies: 0, employers: 0, seekers: 0, resumes: 0, jobs: 0, applications: 0, interviews: 0 };

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function makePdf(lines) {
  const escape = (s) => String(s).replace(/([()\\])/g, "\\$1");
  let content = "BT /F1 16 Tf 72 770 Td 22 TL\n";
  for (const line of lines) content += `(${escape(line)}) Tj T*\n`;
  content += "ET";

  const objects = {
    1: "<< /Type /Catalog /Pages 2 0 R >>",
    2: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    3: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    4: `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    5: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  };

  let pdf = "%PDF-1.4\n";
  const offsets = {};
  for (const id of [1, 2, 3, 4, 5]) {
    offsets[id] = Buffer.byteLength(pdf);
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (const id of [1, 2, 3, 4, 5]) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "binary");
}

async function findOne(table, match) {
  let query = admin.from(table).select("*").limit(1);
  for (const [column, value] of Object.entries(match)) query = query.eq(column, value);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

/* ------------------------------------------------------------------ */
/* run                                                                 */
/* ------------------------------------------------------------------ */

console.log("\nMIST JOB PORTAL — seeding demo data\n");

const { data: userList, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) {
  console.error("Could not list users:", listError.message);
  process.exit(1);
}
const byEmail = new Map(userList.users.map((u) => [String(u.email).toLowerCase(), u]));

async function ensureUser(email, username, role, metadata = {}) {
  let user = byEmail.get(email.toLowerCase());
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username, role, ...metadata },
    });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    user = data.user;
    byEmail.set(email.toLowerCase(), user);
    stats.users += 1;
  }

  const { error: profileError } = await admin.from("users").upsert(
    { user_id: user.id, username, email, role, account_status: "active" },
    { onConflict: "user_id" }
  );
  if (profileError) throw new Error(`public.users ${email}: ${profileError.message}`);

  return user;
}

// 1. admin
await ensureUser("admin@mist.test", "mist_admin", "admin");
console.log("  admin account ready");

// 2. employers + companies
const companyIds = [];
const employerIds = [];

for (let i = 0; i < COMPANIES.length; i += 1) {
  const company = COMPANIES[i];
  const email = `employer${i + 1}@mist.test`;
  const username = company.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  const user = await ensureUser(email, username, "employer");

  let companyRow = await findOne("companies", { company_name: company.name });
  if (!companyRow) {
    const { data, error } = await admin
      .from("companies")
      .insert({
        owner_id: user.id,
        company_name: company.name,
        company_address: company.address,
        industry: company.industry,
        company_description: company.description,
        contact_email: company.email,
        contact_number: company.phone,
        company_website: company.website,
        company_status: "active",
      })
      .select("*")
      .single();
    if (error) throw new Error(`companies: ${error.message}`);
    companyRow = data;
    stats.companies += 1;
  }

  let employerRow = await findOne("employers", { user_id: user.id });
  if (!employerRow) {
    const { data, error } = await admin
      .from("employers")
      .insert({
        user_id: user.id,
        company_id: companyRow.company_id,
        first_name: company.employer.first,
        last_name: company.employer.last,
        position: company.employer.position,
        phone_number: company.employer.phone,
      })
      .select("*")
      .single();
    if (error) throw new Error(`employers: ${error.message}`);
    employerRow = data;
    stats.employers += 1;
  }

  companyIds.push(companyRow.company_id);
  employerIds.push(employerRow.employer_id);
}

console.log(`  ${COMPANIES.length} companies / employers ready`);

// 3. job seekers + resumes
const seekerIds = [];
const resumeIds = [];

for (let i = 0; i < SEEKERS.length; i += 1) {
  const seeker = SEEKERS[i];
  const email = `seeker${i + 1}@mist.test`;
  const username = `${seeker.first.toLowerCase()}_${seeker.last.toLowerCase().replace(/\s+/g, "")}`;

  const user = await ensureUser(email, username, "job_seeker");

  let seekerRow = await findOne("job_seekers", { user_id: user.id });
  if (!seekerRow) {
    const { data, error } = await admin
      .from("job_seekers")
      .insert({
        user_id: user.id,
        first_name: seeker.first,
        last_name: seeker.last,
        middle_name: seeker.middle,
        address: seeker.address,
        phone_number: seeker.phone,
        education: seeker.education,
        skills: seeker.skills,
        experience: "Entry level — see resume for details.",
        bio: `${seeker.first} is looking for a role in ${seeker.education.replace(/^BS /, "")}.`,
      })
      .select("*")
      .single();
    if (error) throw new Error(`job_seekers: ${error.message}`);
    seekerRow = data;
    stats.seekers += 1;
  }

  let resumeRow = await findOne("resumes", { seeker_id: seekerRow.seeker_id });
  if (!resumeRow) {
    const path = `${user.id}/seed-resume.pdf`;
    const pdf = makePdf([
      "MIST JOB PORTAL",
      "Demo Resume",
      "",
      `${seeker.first} ${seeker.middle} ${seeker.last}`,
      seeker.education,
      `Address: ${seeker.address}`,
      `Phone: ${seeker.phone}`,
      "",
      "Skills",
      seeker.skills,
      "",
      "This is generated demo data for the student project.",
    ]);

    await admin.storage.from("resumes").upload(path, pdf, {
      contentType: "application/pdf",
      upsert: true,
    });

    const { data, error } = await admin
      .from("resumes")
      .insert({
        seeker_id: seekerRow.seeker_id,
        resume_title: `${seeker.first} ${seeker.last} — Resume`,
        work_experience: "Entry level",
        certifications: null,
        resume_file: path,
        is_default: true,
      })
      .select("*")
      .single();
    if (error) throw new Error(`resumes: ${error.message}`);
    resumeRow = data;
    stats.resumes += 1;
  }

  seekerIds.push(seekerRow.seeker_id);
  resumeIds.push(resumeRow.resume_id);
}

console.log(`  ${SEEKERS.length} job seekers + resumes ready`);

// 4. jobs
const jobIds = [];

for (let i = 0; i < JOBS.length; i += 1) {
  const job = JOBS[i];
  const companyId = companyIds[job.company];

  let jobRow = await findOne("job_posting", { job_title: job.title, company_id: companyId });
  if (!jobRow) {
    const [salaryMin, salaryMax] = (job.salary.match(/[0-9][0-9,]*/g) || []).map((n) => Number(n.replace(/,/g, "")));
    const { data, error } = await admin
      .from("job_posting")
      .insert({
        company_id: companyId,
        employer_id: employerIds[job.company],
        job_title: job.title,
        job_description: job.description,
        qualifications: job.qualifications,
        skills_required: job.skills,
        employment_type: job.type,
        salary_min: salaryMin ?? null,
        salary_max: salaryMax ?? null,
        location: job.location,
        application_deadline: daysFromNow(job.days),
        job_status: "open",
      })
      .select("*")
      .single();
    if (error) throw new Error(`job_posting: ${error.message}`);
    jobRow = data;
    stats.jobs += 1;
  }

  jobIds.push(jobRow.job_id);
}

console.log(`  ${JOBS.length} job posts ready`);

// 5. applications
for (const plan of APPLICATION_PLAN) {
  const jobId = jobIds[plan.job];
  const seekerId = seekerIds[plan.seeker];

  const existing = await findOne("applications", { job_id: jobId, seeker_id: seekerId });
  if (existing) continue;

  const { error } = await admin.from("applications").insert({
    seeker_id: seekerId,
    job_id: jobId,
    resume_id: resumeIds[plan.seeker],
    application_status: plan.status,
    cover_letter:
      "I am interested in this role and believe my background fits the requirements. My resume is attached for your review.",
  });
  if (error) throw new Error(`applications: ${error.message}`);
  stats.applications += 1;
}

console.log(`  ${APPLICATION_PLAN.length} applications ready`);

// 6. interviews for applications marked "interview"
const interviewPlan = APPLICATION_PLAN.map((plan, index) => ({ ...plan, index })).filter(
  (plan) => plan.status === "interview"
);

for (const plan of interviewPlan) {
  const jobId = jobIds[plan.job];
  const seekerId = seekerIds[plan.seeker];

  const application = await findOne("applications", { job_id: jobId, seeker_id: seekerId });
  if (!application) continue;

  const existing = await findOne("interviews", { application_id: application.application_id });
  if (existing) continue;

  const { error } = await admin.from("interviews").insert({
    application_id: application.application_id,
    interview_date: daysFromNow(3 + plan.index),
    interview_time: "10:00:00",
    interview_type: "Online",
    interview_location: "https://meet.example.com/mist-interview",
    interview_status: "scheduled",
    interview_notes: "Demo interview created by the seed script.",
  });
  if (error) throw new Error(`interviews: ${error.message}`);
  stats.interviews += 1;
}

console.log(`  ${interviewPlan.length} interviews ready`);

/* ------------------------------------------------------------------ */
/* summary                                                             */
/* ------------------------------------------------------------------ */

console.log("\nDone.\n");
console.log("Created this run:", stats);
console.log("\nDemo accounts (password for all: " + PASSWORD + ")");
console.log("  Admin    : admin@mist.test");
console.log("  Employers: employer1@mist.test … employer8@mist.test");
console.log("  Seekers  : seeker1@mist.test … seeker6@mist.test");
console.log("\nTip: sign in as seeker1 to apply, or employer1 to review applicants.\n");
