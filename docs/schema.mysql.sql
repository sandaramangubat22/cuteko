-- ============================================================================
--  JOB PORTAL — MySQL 8 schema (standalone, for MySQL Workbench)
--  Port of docs/schema.sql (PostgreSQL / Supabase) to MySQL.
--  12 tables: the 11 corrected ERD tables + `feedback` (used by the live site).
--
--  Intentional differences from the Postgres original:
--    * no Supabase auth.users here -> `users.user_id` is AUTO_INCREMENT bigint
--      and `users.password_hash` is the local login column (nullable; the
--      deployed app uses Supabase Auth, not this table)
--    * uuid -> bigint, timestamptz -> datetime, boolean -> tinyint(1),
--      `smallint` kept for years (MySQL YEAR is limited to 1901-2155)
--    * the Postgres partial unique index "one default resume per seeker" is
--      emulated with a STORED generated column + unique key
--    * RLS policies, auth triggers, storage buckets and grants are omitted:
--      they belong to Supabase and have no meaning in a local MySQL server
--
--  How to run: MySQL Workbench -> connect -> File > Open SQL Script ->
--  pick this file -> click the lightning bolt. Safe to re-run (it drops).
-- ============================================================================

create database if not exists job_portal
  character set utf8mb4 collate utf8mb4_general_ci;

use job_portal;

set foreign_key_checks = 0;

drop table if exists feedback;
drop table if exists notifications;
drop table if exists interviews;
drop table if exists applications;
drop table if exists job_posting;
drop table if exists skills;
drop table if exists educations;
drop table if exists resumes;
drop table if exists job_seekers;
drop table if exists employers;
drop table if exists companies;
drop table if exists users;

set foreign_key_checks = 1;

-- ---------------------------------------------------------------------------
-- 1. USERS
--    Supabase stores credentials in auth.users; this table is the local
--    stand-in so the schema works without Supabase.
-- ---------------------------------------------------------------------------
create table users (
  user_id         bigint       not null auto_increment,
  username        varchar(100) not null,
  email           varchar(150) not null,
  password_hash   varchar(255) null comment 'local logins only; Supabase uses auth.users',
  phone_number    varchar(20)  null,
  `role`          varchar(50)  not null default 'job_seeker',
  profile_picture varchar(255) null,
  date_registered datetime     not null default current_timestamp,
  account_status  varchar(50)  not null default 'active',
  primary key (user_id),
  unique key users_username_uq (username),
  unique key users_email_uq (email),
  constraint users_role_chk check (`role` in ('job_seeker', 'employer', 'admin')),
  constraint users_status_chk check (account_status in ('active', 'inactive', 'suspended'))
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 2. COMPANIES
-- ---------------------------------------------------------------------------
create table companies (
  company_id          bigint       not null auto_increment,
  owner_id            bigint       not null,
  company_name        varchar(150) not null,
  company_address     varchar(255) not null,
  industry            varchar(100) not null,
  company_description text         null,
  contact_email       varchar(150) not null,
  contact_number      varchar(20)  not null,
  company_website     varchar(150) not null,
  company_status      varchar(50)  not null default 'active',
  date_registered     datetime     not null default current_timestamp,
  primary key (company_id),
  key companies_owner_idx (owner_id),
  constraint companies_owner_fk foreign key (owner_id) references users (user_id)
    on delete cascade on update cascade,
  constraint companies_status_chk check (company_status in
    ('active', 'inactive', 'pending', 'suspended'))
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 3. EMPLOYERS
-- ---------------------------------------------------------------------------
create table employers (
  employer_id  bigint       not null auto_increment,
  user_id      bigint       not null,
  company_id   bigint       not null,
  first_name   varchar(100) not null,
  last_name    varchar(100) not null,
  `position`   varchar(100) not null,
  phone_number varchar(20)  not null,
  date_joined  datetime     not null default current_timestamp,
  primary key (employer_id),
  unique key employers_user_uq (user_id),
  key employers_company_idx (company_id),
  constraint employers_user_fk foreign key (user_id) references users (user_id)
    on delete cascade on update cascade,
  constraint employers_company_fk foreign key (company_id) references companies (company_id)
    on delete cascade on update cascade
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 4. JOB_SEEKERS
-- ---------------------------------------------------------------------------
create table job_seekers (
  seeker_id    bigint       not null auto_increment,
  user_id      bigint       not null,
  first_name   varchar(100) not null,
  last_name    varchar(100) not null,
  middle_name  varchar(100) null,
  gender       varchar(10)  null,
  address      varchar(255) not null,
  phone_number varchar(20)  not null,
  date_of_birth date        null,
  education    varchar(255) null,
  skills       text         null,
  experience   text         null,
  bio          text         null,
  primary key (seeker_id),
  unique key job_seekers_user_uq (user_id),
  constraint job_seekers_gender_ck check (gender in ('male', 'female')),
  constraint job_seekers_user_fk foreign key (user_id) references users (user_id)
    on delete cascade on update cascade
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 5. RESUMES  — at most one default resume per seeker
-- ---------------------------------------------------------------------------
create table resumes (
  resume_id       bigint       not null auto_increment,
  seeker_id       bigint       not null,
  resume_title    varchar(150) not null,
  work_experience text         null,
  certifications  text         null,
  resume_file     varchar(255) null,
  date_created    datetime     not null default current_timestamp,
  is_default      tinyint(1)   not null default 0,
  -- seeker_id when this row is the default, NULL otherwise: unique key below
  -- then allows many NULLs but only one default per seeker.
  default_owner   bigint generated always as
                    (case when is_default = 1 then seeker_id else null end) stored,
  primary key (resume_id),
  key resumes_seeker_idx (seeker_id),
  unique key resumes_one_default_uq (default_owner),
  constraint resumes_seeker_fk foreign key (seeker_id) references job_seekers (seeker_id)
    on delete cascade on update cascade
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 6. EDUCATIONS
-- ---------------------------------------------------------------------------
create table educations (
  education_id bigint       not null auto_increment,
  seeker_id    bigint       not null,
  school_level varchar(50)  null,
  school_name  varchar(150) null,
  degree       varchar(150) null,
  year_started smallint     null,
  year_ended   smallint     null,
  date_created datetime     not null default current_timestamp,
  primary key (education_id),
  key educations_seeker_idx (seeker_id),
  constraint educations_seeker_fk foreign key (seeker_id) references job_seekers (seeker_id)
    on delete cascade on update cascade
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 7. SKILLS
-- ---------------------------------------------------------------------------
create table skills (
  skill_id          bigint       not null auto_increment,
  seeker_id         bigint       not null,
  skill_name        varchar(100) not null,
  skill_category    varchar(100) null,
  proficiency_level varchar(50)  null,
  primary key (skill_id),
  key skills_seeker_idx (seeker_id),
  constraint skills_seeker_fk foreign key (seeker_id) references job_seekers (seeker_id)
    on delete cascade on update cascade
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 8. JOB_POSTING
-- ---------------------------------------------------------------------------
create table job_posting (
  job_id              bigint       not null auto_increment,
  company_id          bigint       not null,
  employer_id         bigint       not null,
  job_title           varchar(150) not null,
  job_description     text         null,
  qualifications      text         null,
  skills_required     text         null,
  employment_type     varchar(50)  not null,
  salary_min          int          null,
  salary_max          int          null,
  location            varchar(100) not null,
  date_posted         datetime     not null default current_timestamp,
  application_deadline date        null,
  job_status          varchar(50)  not null default 'open',
  primary key (job_id),
  key job_posting_company_idx (company_id),
  key job_posting_employer_idx (employer_id),
  key job_posting_status_idx (job_status),
  constraint job_posting_company_fk foreign key (company_id) references companies (company_id)
    on delete cascade on update cascade,
  constraint job_posting_employer_fk foreign key (employer_id) references employers (employer_id)
    on delete cascade on update cascade,
  constraint job_posting_status_chk check (job_status in ('draft', 'open', 'closed')),
  constraint job_posting_salary_chk check (salary_min is null or salary_min >= 0),
  constraint job_posting_salary_max_chk check (salary_max is null or salary_max >= 0)
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 9. APPLICATIONS — one application per seeker per job
-- ---------------------------------------------------------------------------
create table applications (
  application_id     bigint      not null auto_increment,
  seeker_id          bigint      not null,
  job_id             bigint      not null,
  resume_id          bigint      null,
  application_date   datetime    not null default current_timestamp,
  application_status varchar(50) not null default 'pending',
  cover_letter       text        null,
  primary key (application_id),
  unique key applications_unique_per_job (job_id, seeker_id),
  key applications_seeker_idx (seeker_id),
  key applications_job_idx (job_id),
  key applications_resume_idx (resume_id),
  constraint applications_seeker_fk foreign key (seeker_id) references job_seekers (seeker_id)
    on delete cascade on update cascade,
  constraint applications_job_fk foreign key (job_id) references job_posting (job_id)
    on delete cascade on update cascade,
  constraint applications_resume_fk foreign key (resume_id) references resumes (resume_id)
    on delete set null on update cascade,
  constraint applications_status_chk check (application_status in
    ('pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'))
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 10. INTERVIEWS
-- ---------------------------------------------------------------------------
create table interviews (
  interview_id       bigint       not null auto_increment,
  application_id     bigint       not null,
  interview_date     date         not null,
  interview_time     time         null,
  interview_type     varchar(50)  not null,
  interview_location varchar(255) not null,
  interview_status   varchar(50)  not null default 'scheduled',
  interview_notes    text         null,
  primary key (interview_id),
  key interviews_application_idx (application_id),
  constraint interviews_application_fk foreign key (application_id)
    references applications (application_id) on delete cascade on update cascade,
  constraint interviews_status_chk check (interview_status in
    ('scheduled', 'completed', 'cancelled', 'rescheduled'))
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 11. NOTIFICATIONS
-- ---------------------------------------------------------------------------
create table notifications (
  notification_id   bigint      not null auto_increment,
  user_id           bigint      not null,
  application_id    bigint      null,
  notification_type varchar(50) not null,
  message           text        null,
  date_sent         datetime    not null default current_timestamp,
  is_read           tinyint(1)  not null default 0,
  date_read         datetime    null,
  primary key (notification_id),
  key notifications_user_idx (user_id),
  key notifications_application_idx (application_id),
  constraint notifications_user_fk foreign key (user_id) references users (user_id)
    on delete cascade on update cascade,
  constraint notifications_application_fk foreign key (application_id)
    references applications (application_id) on delete cascade on update cascade
) engine = InnoDB;

-- ---------------------------------------------------------------------------
-- 12. FEEDBACK — issue reports / contact messages from the About page
-- ---------------------------------------------------------------------------
create table feedback (
  feedback_id     bigint       not null auto_increment,
  user_id         bigint       null,
  name            varchar(120) null,
  email           varchar(255) null,
  category        varchar(30)  not null default 'general',
  message         text         not null,
  page_url        varchar(500) null,
  feedback_status varchar(20)  not null default 'new',
  date_sent       datetime     not null default current_timestamp,
  primary key (feedback_id),
  key feedback_status_idx (feedback_status),
  key feedback_date_idx (date_sent),
  constraint feedback_user_fk foreign key (user_id) references users (user_id)
    on delete set null on update cascade,
  constraint feedback_category_chk check (category in ('bug', 'content', 'account', 'general')),
  constraint feedback_status_chk check (feedback_status in ('new', 'read', 'resolved'))
) engine = InnoDB;

-- ============================================================================
--  VERIFY — run these after loading (results should match the comments)
-- ============================================================================
-- select table_name, table_rows from information_schema.tables
--   where table_schema = 'job_portal' order by table_name;      -- 12 tables
-- select count(*) from information_schema.table_constraints
--   where table_schema = 'job_portal' and constraint_type = 'FOREIGN KEY';  -- 16
-- select * from users;
