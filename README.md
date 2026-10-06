# Dimensional SIS

**A free, open-source student information system that sees the whole child, and keeps every student's data on your school's own machines.**

**Who it's for.** Three kinds of schools, each with its own version of the same problem:

- **Districts and traditional schools** that have an SIS and can't get anything new out of it. Start with [the problem you already know](#the-problem-you-already-know).
- **Microschools, learning pods, co-ops and community schools** that have no SIS at all, just paperwork. Go to [microschools and learning pods](#for-microschools-and-learning-pods).
- **Alternative schools** (continuation, credit recovery, independent study, charters, therapeutic programs), whose students the standard SIS reads worst. Go to [alternative schools](#for-alternative-schools).

You can see it working in a public demo with made-up students, with a five-minute guided tour: **https://dimensionalsis.generativeducation.com**

## The problem you already know

Your student information system was built for compliance. It takes attendance, stores grades, prints transcripts, and files the state report. It does those things, and it was never designed to do much more.

Ask it for anything new and the answer is always the same. You might want a way to see which students need a check-in before they fall behind, to know how long kids spend getting to school, or to hear what they said in their speeches and essays. The answer is a feature request, a consultant's quote, or "maybe in next year's release." Anything truly different from what every other district already has is out of reach.

So we work around it. The real knowledge of who a child is lives in the people in the building: the counselor who remembers, the teacher who noticed, the office manager who knows the family. We keep it in spreadsheets, sticky notes and hallway conversations, and we do the best we can. When those people leave, the knowledge leaves with them.

**You don't have to live like this anymore.** Three things have changed:

- **AI can now build the tools you need.** A staff member describes a dashboard or a page in a sentence, and it's built on your own data, the same day.
- **AI can now read for meaning.** It can understand what students and families write, not just count it, and do so on a computer in your own building.
- **The software can be free.** Dimensional SIS is open source. There is no per-student license and no annual contract. It runs on a computer you control, often one you already have. What it asks of you is a machine and some of your IT team's time, not your entire budget.

> We talk all day about AI ethics. Ethics we don't model is just a lecture. Modeling it means AI sovereignty: student, staff and family data stays off someone else's cloud. This is the AI moment. Either accountability starts with us, on hardware we own, or we offload it to big tech and complain about it later.

## Why "dimensional"

Today's systems see a child as one row in a spreadsheet: attendance, grades, discipline, a test score, and a label. Each column is a dimension, and there are only a few of them. Two students with the same grades and the same attendance look identical, even when one is thriving and the other is quietly drowning.

Think of giving directions. "On Main Street" is one dimension, and you still can't find the house. Add the cross street and you have a map. Add "third floor, apartment B" and you can knock on the door. Every dimension you add lets you tell apart things that looked the same.

Dimensional SIS keeps everything your current system tracks and adds about a hundred more dimensions, in six groups:

| Group | What it holds | Who fills it in |
|---|---|---|
| **Record** | Grades by subject, attendance patterns, tests, services, credits | Imported from your current system |
| **In their words** | A short check-in: belonging, feeling safe, sleep, whether there is an adult they trust, hours spent working or caring for family | The student |
| **Journey** | How long the trip to school takes, how they get there, whether the walk feels safe | The family |
| **Voice** | Speeches (such as Project Soapbox) and writing, read by meaning: what they care about and how they make a case | The student's own words |
| **Observed** | Curiosity, persistence, leadership and more, rated by adults who know them and averaged | Teachers and counselors |
| **Place** | Public data about the neighborhood: walkability, parks, heat, air | Public data, joined on your machine |

Every dimension is optional. A gap shows as *unknown*, never zero, and the gaps become a to-do list: "a ten-minute conversation with the family would fill in Journey."

The list is open, too. Anyone on staff can add a new dimension by writing one sentence, such as *"being bullied or made to feel you don't belong."* The system reads every student's shared writing against that sentence and shows the passage behind each result, so a person can always check why.

Two rules come with that depth:

- **Every dimension is a question for a person, never a verdict about a child.** The system says "take a look," never "this student is at risk." Neighborhood data describes the place and never raises a question about a child.
- **Depth is only safe if it stays home.** A fuller picture of a child is exactly the data that must not end up on someone else's servers. Student records stay on your machine and are never sent to an AI company.

## What a school or district gets

- **Everything the state expects.** Attendance, grades, discipline, services, learning plans, enrollment history and compliance records, kept the way your reports need them, with a tamper-evident log of every change.
- **Nothing to retype.** It imports the exports you already have from PowerSchool, Aeries, Infinite Campus or any OneRoster-compatible system, and shows you how it read each column before anything is saved.
- **The whole child,** in the six groups above, on every student's page, with a picture of what is known and what would fill in the rest.
- **Search by meaning.** Search for "students who've written about wanting to build things" and get answers from what people actually wrote, even when they used different words. Narrow it by grade or school with a click.
- **Tools your staff build themselves.** A teacher describes the dashboard, page or assignment they need, and gets a working page with its own web address. It only shows each person what they are allowed to see.
- **Families and students in the record.** They can see their own file, add to it, and flag anything that looks wrong.

**Where it stands:** Dimensional SIS has been built and tested with synthetic students, not yet run in a school. The right first step is a pilot by your technical team using sample data. The section "Status" below lists what has to be in place before a real child's record goes in. There is no sales call and no contract; you download it.

## For microschools and learning pods

*Microschools, learning pods, homeschool co-ops, forest schools and parent-run community schools.*

You started this because you wanted children to be known as whole people, not as grades. Then came the paperwork: attendance, immunizations or exemptions, emergency cards, custody and consent forms, proof of residency, background checks, CPR cards, mandated-reporter training, fire and lockdown drill logs, your adult-to-child ratio, learning plans, and, depending on your state, a private-school filing such as California's affidavit. Software built for districts costs more than your rent and assumes an IT department. Homeschool apps are gradebooks. So it lives in a spreadsheet and a drawer, along with a quiet worry about the day a regulator, an insurer or a new family asks to see it.

**Dimensional SIS Micro** is built for exactly that.

- **It speaks your language.** Learners, guides, pods, age bands and families, not students, teachers and grades.
- **You start from an empty room.** There's nothing to import. A guided setup walks you through your community, learners (a name and birthday is enough), families (siblings entered once), guides and their clearances, the paperwork you hold, and your drills. About twenty minutes of typing for twenty learners.
- **It tells you every day exactly what is missing,** by name. For example: "Paloma has no immunization record on file." "No lockdown drill in 90 days." "Silas's background check is still pending." The checklist covers:
  - immunizations
  - emergency contacts and cards
  - custody and consent
  - residency
  - background checks, mandated-reporter training, and CPR on site
  - fire and lockdown drills
  - your stated adult-to-child ratio
  - a credentialed guide in every pod
  - an individual plan reviewed each term
  - your private-school filing
- **The reports a visitor asks for are ready to print.** Attendance register, enrollment roster, immunization status, staff credentials, learning-plan calendar, incident log and affidavit datasheet, all as plain CSV files.
- **Families are co-owners, not customers.** They join with an invite code, see their own child's file, add what they see at home, and get a to-do list of what their family still owes the school.
- **It comes with four tools ready on day one:** an attendance register, a co-op roster, a learner portfolio and a weekly family update. Describe a fifth in a sentence and it gets built.
- **It keeps the reason you started.** Portfolios, observations, a child's own words and what families notice live in the same record as the compliance paperwork. That's the "dimensional" part, and it's the part no gradebook gives you.

**What it costs:** nothing for the software. It runs on a laptop you already own, set up in about an hour by one parent or guide who is comfortable following instructions. Everything stays on that laptop and leaves with you if you ever stop using it. The step-by-step guide is in [`editions/micro/README.md`](editions/micro/README.md).

## For alternative schools

*Continuation and credit-recovery programs, independent study, charters, therapeutic and day-treatment schools, court and community schools.*

Your students are the ones a standard SIS reads worst. It was built for a comprehensive high school's year, where everyone starts in August, sits in seats and stays. Your students enroll on a Tuesday in March with credits from three schools, an IEP, a job, a younger sibling to get to school, and sometimes a court date. The system reduces them to labels like "chronically absent," "credit deficient" or "behavior." Meanwhile you answer to an authorizer or a county office for apportionment attendance, plan reviews and credits, and you have a fraction of the staff to do it.

**Dimensional SIS Alt** is built around the two numbers that matter to you every day, credits and attendance, and around students who come and go all year.

- **Credits are a first-class number.** Each student's total, how far they are from a diploma, and who is far enough behind that a recovery plan should exist. Credits from earlier schools come in from their transcripts, so a transfer student with 85 credits isn't treated as new.
- **Attendance counts from the day a student actually enrolled,** so a mid-year arrival doesn't distort their rate. An apportionment (ADA) summary is ready each month.
- **Plans have review dates that don't slip.** IEP, 504, behavior support, transition and credit recovery, with overdue reviews listed first. Seniors and students 16 or older without a transition plan are named.
- **Students who drift out don't go quietly.** A weekly list of students to call back, while a phone call still works.
- **Advisors see their own caseload.** Directors see the whole school.
- **The record follows a mobile life.** Every enrollment, withdrawal, transfer and re-enrollment is kept with a reason. Import a vendor export, and enroll the student who walked in this morning by hand in about thirty seconds.
- **Your authorizer's questions are already checks.** Plans reviewed in the last 12 months, a behavior plan after three incidents in 60 days, juniors and seniors on track for credits, transition plans, apportionment attendance complete and coded, plus the core checks on paperwork, clearances and drills.
- **Four tools come ready:** ADA attendance, a credit tracker, plan reviews and re-engagement.

**This is where seeing in dimensions matters most.** The number on the report says a student's attendance is 80%. The dimensions show *why*, as questions for an adult rather than verdicts:
- **Journey:** he leaves at 7:01 for two transfers on a route that doesn't feel safe.
- **In his own words:** he works 20 hours a week.
- **Voice:** his speech about the six-lane crossing outside school.

That changes the conversation from "why is he absent?" to "what would make his mornings possible?" For the students alternative schools serve, that difference is the job.

**What it costs:** nothing for the software, and one server you control. The guide for directors and for the technical person who will run it is [`editions/alt/README.md`](editions/alt/README.md).

Requirements vary by state, by authorizer and by program type. Dimensional SIS is a working checklist against your own rules, not legal advice, and it doesn't file anything for you.

## What it takes

- **A computer that stays on.** A desktop in the office, a small server, or a rented machine in your own name. No cloud account is required.
- **One technical person.** Someone comfortable following setup instructions, or working with an AI coding assistant. The project carries its own instructions for that assistant, so common changes (your vocabulary, your data format, your colors, your server) are guided tasks.
- **About an hour** to see it running with sample data. Longer to make it yours.

---

# For the IT folks

Dimensional SIS is a single Node.js 20 process with no build step, no external services and no cloud account. All of its state is one folder on disk. It runs on a laptop for a demo and on one modest server for a school.

## How it works

**1. A ledger is the source of truth.** Every change (a student record, a note, an attendance row, a dimension value, an app) is appended to `data/ledger.jsonl` as one JSON event. Each event is SHA-256 hash-chained to the one before it, so tampering is detectable: `GET /api/ledger/verify` walks the chain. Everything else on disk is a projection of the ledger and can be rebuilt from it.

**2. SQLite for facts.** A relational projection (`data/librea.sqlite`, via `better-sqlite3`) uses OneRoster 1.1 table shapes plus attendance, discipline, services, contacts, compliance tables and the dimension tables. Every read is scoped by the database itself: per request, the server creates temporary views that hide the rows and columns a role may not see, then runs one read-only `SELECT`. A family account querying `student_dimensions` sees only its own child.

**3. Embeddings, computed locally.** Text written about a student (observations, self-reflections, family notes, speeches) is embedded with `all-MiniLM-L6-v2`, a 384-dimension sentence-embedding model. It runs in-process through `@huggingface/transformers` on ONNX Runtime, at a few milliseconds per text on a laptop. The weights download once into `data/models/`; after that it runs with the network unplugged. It is the only model that ever sees student text. Long pieces such as a speech are split into passages of whole sentences, and each passage gets its own vector, so a five-minute speech isn't squeezed into one point.

**4. ruvector stores and searches the vectors.** If you know embeddings but not ruvector: it is an open-source vector database written in Rust, used here through its Node bindings. Think of it as SQLite for embeddings. It runs inside the process (no separate server), keeps every vector with its metadata in one local file (`data/vectors.db`), and builds an **HNSW index**. That is a layered graph of nearest neighbors, which finds similar vectors without comparing against every vector on disk. Dimensional SIS stores:
- one vector per note or passage
- one mean vector per person

and uses them for meaning-based search ("students who've written about feeling left out") and "students like this one." Two practical notes:
- ruvector applies metadata filters *after* the top-k search, so the code over-fetches and then filters by visibility and scope in JavaScript.
- Visibility is enforced server-side on every hit. A private journal entry never appears in a staff search.

**5. RVF, on the roadmap.** RVF (RuVector Format) is the same project's single-file container for vectors, metadata and the models that produced them. Dimensional SIS does **not** use RVF yet; it is only installed as a dependency of ruvector. The plan is a portable "one file per student" export: a child's record and vectors in one file the district owns and can move anywhere. Until then, exports are plain JSON and CSV, and the ledger itself is the portable copy.

**6. Dimensions.** `src/dimensions/registry.js` defines about 100 dimensions. Each entry declares:
- its group and kind
- its range and which end is favorable
- which roles may write it by hand
- the action that fills it in

Values are `dim.*` ledger events, projected into SQL as `student_dimensions` (one row per value; observed ratings get one row per adult) and `dimension_catalog`.

**Concept dimensions** are defined by a single sentence. The sentence is embedded, and each student's score is the best cosine match among the passages they have shared with the school. That score is calibrated for each concept against the whole student body: the typical student sits at 0 and the strongest matches near 1. The matching passage is stored as evidence. Private writing never counts toward a score that staff can see.

**Similar students** are compared only on the dimensions both students have, and the score shrinks when the overlap is small. Place dimensions are excluded from similarity and from questions.

**7. The app builder.** Staff describe a tool in a sentence. The model provider receives the request and the *schema*, never a record. The resulting page runs in a sandboxed iframe whose content security policy blocks all network access. It reaches data only through a broker that re-checks the viewer's scope on every call and suppresses aggregates over fewer than five students for apps limited to aggregates.

## The sovereignty promise, as of now

This is the part to hand your IT person, your board or your lawyer.

**What lives on disk.** Everything, under `data/` (or `$LIBREA_DATA`):

| File | What it is |
|---|---|
| `data/ledger.jsonl` | The source of truth. One JSON event per line, SHA-256 hash-chained. |
| `data/vectors.db` | The ruvector store: one 384-dimension vector per note or passage, plus a mean vector per person. |
| `data/librea.sqlite` | The relational projection. Deletable; `POST /api/sql/rebuild` rebuilds it from the ledger. |
| `data/snapshot.json` | A boot cache of the in-memory state. Deletable. |
| `data/users.json`, `data/invites.json` | Accounts (scrypt hashes) and invite codes. |
| `data/media/<id>/` | Photos, as files. |
| `data/apps/<slug>/vN.html` | Every version of every app anyone built, as plain HTML. |
| `data/models/` | The embedding model's weights, downloaded once. |

**What leaves the building.** Only what the app builder sends to the model provider you configure, and only ever the *shape* of your data:

- `template` (the default): nothing. No model and no network; apps are assembled from built-in templates.
- `ollama` with a local model: nothing leaves the machine.
- `ollama` with a `:cloud` or `-cloud` model: your request and the schema go to Ollama's servers. The interface says so.
- `anthropic`: your request and the schema go to Anthropic's API. With an Anthropic key, design-first builds also send the school's look and the list of available data "recipes," never rows or records; the school's own server fills the page with data afterwards.

**Student records never go to a model provider.** The system prompt is built in `src/vibe/prompt.js` from schema constants and one fabricated student (`Avery Example`). No real name, id, metric, or anything a child, family or teacher wrote is ever in it. Ask the running server: `GET /api/vibe/provider` returns a plain-language `whatLeaves` statement.

## Quick start

```bash
git clone https://github.com/kmasterfleek/dimensional-sis
cd dimensional-sis
npm install
npm run seed      # 850 synthetic students, 4 schools, notes, speeches, attendance and dimensions
npm start         # http://127.0.0.1:4321
```

Demo logins created by the seed:

| Username | Password | Role |
|---|---|---|
| `admin` | `librea-admin` | admin |
| `teacher.0` | `librea-staff` | staff |
| `stu-0001` | `librea-student` | student |
| `family.stu-0001` | `librea-family` | family |

Every student, speech and neighborhood in the seed is synthetic. The base district comes from [kmasterfleek/student-vectors](https://github.com/kmasterfleek/student-vectors). No real child is in this repository.

Other editions:

```bash
LIBREA_EDITION=micro node editions/micro/seed.js && LIBREA_EDITION=micro npm start
LIBREA_EDITION=alt   node editions/alt/seed.js   && LIBREA_EDITION=alt   npm start
```

> `npm run seed` wipes the ledger, vectors, snapshot, SQLite file and accounts in `$LIBREA_DATA` before writing (pass `--keep` to append). Point `LIBREA_DATA` at a disposable folder if you are only experimenting.

The project was called Librea until October 2026. Settings (`LIBREA_*`), data filenames and the `window.librea` app runtime keep that name so existing installs keep working.

## Make it yours with your coding agent

Dimensional SIS is meant to be forked and changed, not configured. Open the folder in Claude Code (or any coding agent) and point it at [`AGENTS.md`](AGENTS.md): a map of every module, the rules that must not break and the file that enforces each one, and recipes for common changes.

Five skills under `.claude/skills/` cover the usual tasks:

| Skill | What it does |
|---|---|
| `dimensional-adopt` | First-run interview: who you are, which edition, what to rename, what to seed. |
| `dimensional-import` | Map your own SIS export and check the mapping before applying it. |
| `dimensional-brand` | Your name, colors and vocabulary, as an edition. |
| `dimensional-model` | Connect Ollama or Anthropic, and keep the sovereignty statement true. |
| `dimensional-deploy` | Run it on a school server: Docker, environment, backups, restore. |

The changes almost everyone makes:

1. **Your vocabulary and branding:** an edition under `editions/<id>/edition.json` (see `docs/editions.md`).
2. **Your SIS export:** a preset in `src/import/presets.js`, or a corrected mapping in the import screen.
3. **Your definition of "doing well":** the dimension registry in `src/dimensions/registry.js`, the 15 core signals in `src/core/schema.js`, and the flags in `src/core/signal.js`. These are the most opinionated parts of the codebase and the first thing to argue with.
4. **Your own screens:** a page under `public/js/`, or an app described in a sentence.

## Running it on a school server

```bash
cp docs/docker/env.example.txt .env    # edit it
docker compose up -d
```

One service, with `./data` mounted as a volume and `.env` for configuration. Data is never baked into the image. Put a TLS-terminating reverse proxy in front before anyone outside the machine reaches it. Backups and restores are covered in the `dimensional-deploy` skill.

## Model providers

Set with environment variables; nothing else changes.

```bash
LIBREA_MODEL_PROVIDER=template              # default with no API key: offline, deterministic
LIBREA_MODEL_PROVIDER=ollama
LIBREA_OLLAMA_HOST=http://localhost:11434
LIBREA_OLLAMA_MODEL=qwen2.5-coder:7b        # a :cloud tag runs on Ollama's servers
LIBREA_MODEL_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
LIBREA_MODEL=claude-opus-5                  # app-builder model
LIBREA_DESIGN_MODEL=claude-sonnet-5         # design-first builds
```

## Status: demo-grade, not yet pilot-grade

Everything below is true of the code as it stands. A school deserves to know before it puts a child's record in.

- **Data on disk is plaintext.** Use full-disk encryption and file permissions.
- **No HTTPS** on its own. It binds `127.0.0.1` by default; anything beyond one machine needs a reverse proxy terminating TLS.
- **No SSO**, password reset or MFA. Local accounts with scrypt hashes, created by an admin or an invite code.
- **No rate limiting,** including on login.
- **Sessions live in memory** with a 12-hour lifetime, so a restart signs everyone out.
- **Roles are coarse.** Staff see every student unless caseload scoping is turned on for that account.
- **No per-record read audit.** Every write is in the ledger with who made it; reads are not logged yet.

`docs/security.md` lists each gap with a concrete next step.

## Tests and layout

```bash
npm test        # node --test tests/ (123 tests, no network)
npm run build   # imports every module, fails any file over 500 lines
```

```
src/core/        ledger, store, schema, signal vector, embeddings, auth, editions
src/api/         router, request scope, core, export, curriculum, SQL and onboarding routes
src/sql/         SQLite projection, scoped read-only queries, metric derivation
src/import/      CSV parsing, vendor presets, mapping, fact writing, background jobs
src/vibe/        model providers, prompt, app storage, sandbox and broker
src/compliance/  compliance checks, CSV reports, the family to-do list
src/dimensions/  the dimension registry, voice concepts, place data, profiles
public/          the interface: plain JavaScript modules, no bundler, no CDN
editions/        micro, alt
data/seed/       synthetic district, curriculum, sample vendor CSVs
docs/            architecture, security, editions, API
```

## License

GNU General Public License v3.0 or later. See [LICENSE](LICENSE). You may run, study, change and redistribute Dimensional SIS, including for a fee, provided the changes you distribute stay under the same license. A school running it for itself has no obligations beyond that.

## Credits

The synthetic district, the 15 core signals and the original risk formula come from [kmasterfleek/student-vectors](https://github.com/kmasterfleek/student-vectors). Vector storage and search use [ruvector](https://www.npmjs.com/package/ruvector). Embeddings are `Xenova/all-MiniLM-L6-v2` via `@huggingface/transformers`. The relational projection uses `better-sqlite3`.
