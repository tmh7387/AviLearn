-- ============================================================
-- 00009: Lesson Plans, Module Objective Mapping & Quiz Questions
-- ============================================================

-- Lesson Plans (one per COURSE — the master instructional design document)
create table public.lesson_plans (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade unique,

  -- Header fields
  course_title text not null,
  total_time_minutes int,
  instructor text,
  audience_description text,
  target_group_size text,

  -- Core instructional design fields
  rationale text,                    -- WIIFM: "Why is this course important?"
  learning_objectives jsonb,         -- Array of SMART objective objects (course-level)
  evaluation_strategy text,          -- "How will course learning be evaluated?"
  instructional_aids text[],         -- Materials, equipment, resources for the course

  -- 3-phase instructional strategy (START → CONDUCT → WRAP-UP)
  phases jsonb,

  -- Instructor notes
  notes text,
  instructor_reflection text,

  -- AI generation metadata
  generated_by text,                 -- agent name or 'manual'
  generation_confidence numeric,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Module → Course Objective mapping
alter table public.modules
  add column if not exists objective_indices int[];

-- Quiz questions (structured data for analytics + question banks)
create table public.quiz_questions (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,

  question_type text not null check (question_type in (
    'mcq_single', 'mcq_multi', 'true_false', 'fill_blank', 'sequence', 'hotspot'
  )),
  question_text text not null,
  options jsonb,                     -- Array of { text, isCorrect, feedback }
  correct_answer text,               -- For fill_blank type
  explanation text,                  -- Why the correct answer is correct
  bloom_level text check (bloom_level in (
    'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'
  )),
  difficulty int check (difficulty between 1 and 5),
  objective_index int,               -- Index into course-level learning objectives
  sort_order int default 0,

  created_at timestamptz default now()
);

-- RLS
alter table public.lesson_plans enable row level security;
create policy "Service role full access" on public.lesson_plans
  for all using (true) with check (true);

alter table public.quiz_questions enable row level security;
create policy "Service role full access" on public.quiz_questions
  for all using (true) with check (true);

-- Indexes
create index idx_lesson_plans_course on public.lesson_plans(course_id);
create index idx_quiz_questions_lesson on public.quiz_questions(lesson_id);
create index idx_quiz_questions_module on public.quiz_questions(module_id);
