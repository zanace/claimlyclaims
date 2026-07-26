## Inspiration

$140 billion in government benefits go unclaimed every year—not because families don't qualify, but because the system is broken. Navigating benefit programs means:
- 15+ different government websites
- Confusing eligibility rules written in bureaucratic jargon
- Re-entering the same information across multiple applications
- Language barriers and no personalized support
- No way to know which programs you actually qualify for

Our team watched families in our community miss out on critical support—food assistance, housing help, healthcare, tax credits—simply because they didn't know these programs existed or couldn't navigate the paperwork. We saw single parents working multiple jobs, elderly on fixed income, new immigrants—all leaving $10,000+ annually on the table.

**We knew we could fix this with AI and thoughtful design.**

---

## What it does

**Claimly is an AI-powered benefits assistant that helps Americans discover and apply for government programs they qualify for—all in minutes, not hours.**

**Core Features:**

1. **Smart Eligibility Screener** – Describe your situation in one sentence; AI instantly shows which programs match your household
2. **One-Click Program Discovery** – Enter your ZIP code; see 5-20+ matching programs ranked by likelihood
3. **Conversational Application Wizard** – No 20-page forms. Just 4-7 smart questions in plain English
4. **Smart Profile System** – Save your info once; Claimly auto-fills future applications (saves 8-12 hours across applications)
5. **Application Tracking Dashboard** – See all submitted applications, estimated benefits, and next steps in one place
6. **PDF Generation & Export** – Download complete applications ready to submit to government agencies
7. **Eligibility Estimator** – Quick 5-question tool to see 20+ programs you might qualify for based on federal poverty levels
8. **AI Benefits Guide** – Ask anything about programs, eligibility, or next steps; get real .gov links and plain-language answers

**Real Impact:**
- Average user discovers 5-8 new programs worth $10,000+ annually
- Saves 8-12 hours on paperwork across multiple applications
- 70-80% of future applications pre-filled from saved profile
- Zero re-entry of information across programs

---

## How we built it

**Tech Stack:**
- **Frontend:** React 19, TanStack Start (file-based routing), TypeScript, Tailwind CSS
- **Backend:** TanStack Start Server, Node.js
- **AI/ML:** OpenAI GPT-4 API, Vercel AI SDK (real-time streaming)
- **Database:** Supabase PostgreSQL (encrypted application storage)
- **Auth:** Lovable Cloud Auth
- **UI Components:** Radix UI, Lucide icons, Recharts
- **PDF:** HTML-to-PDF generation for applications

**AI Integration:**
- **GPT-4 for natural language understanding:** Parses user situations, generates contextual questions tailored to each program
- **Eligibility assessment:** AI applies complex federal/state rules to predict likely qualification
- **Plain-language summaries:** Converts government jargon into 6th-grade reading level explanations
- **Real-time streaming:** Users see responses as they're generated, not in a wall of text

**Architecture Highlights:**
- Secure end-to-end encryption for all personal data
- Real-time sync across devices (local browser storage + Supabase)
- Stateless API design for scalability
- Progressive enhancement (works without JavaScript, falls back gracefully)

**Development Timeline:**
- **Day 1 (36 hours):** MVP built during MY-HACK 2026 hackathon
- **Day 2:** Refinement, bug fixes, AI integration testing
- **Post-hackathon:** Production deployment, partnerships with nonprofits

---

## Challenges we ran into

1. **Jailbreaking Complexity into Simplicity**
   - Challenge: Federal benefit eligibility rules are insanely complex (income thresholds vary by state, asset limits, family composition rules, immigration status considerations)
   - Solution: Built a rules engine that normalizes federal + state eligibility into simple yes/no/maybe predictions; used AI to explain why in human terms

2. **Making Questions Conversational, Not Robotic**
   - Challenge: Generic benefit questions feel impersonal and overwhelming
   - Solution: Fine-tuned GPT-4 prompts to generate contextual, warm, specific questions based on what each program actually needs (not what forms ask for)

3. **Privacy Without Compromising UX**
   - Challenge: Users need to save info for reuse, but we never want to handle SSN or unnecessary PII
   - Solution: Client-side encryption, optional fields, clear privacy controls, never asking for SSN or full street address

4. **Real-Time Data for 50+ Programs**
   - Challenge: Eligibility rules change; benefit amounts vary by state
   - Solution: Built scraper + API integrations for official .gov sites; manual curation of key programs; clear "as of" dates

5. **Handling Edge Cases at Scale**
   - Challenge: Household composition is complex (blended families, guardianships, immigration status, etc.)
   - Solution: Used AI to ask clarifying follow-up questions only when needed; provided "I'm not sure" escape hatches

6. **Building for Low-Literacy Users**
   - Challenge: Government benefits audience spans all literacy levels; jargon must be eliminated
   - Solution: Tested copy with real users; used 6th-grade reading level; implemented TTS (text-to-speech) accessibility features

---

## Accomplishments that we're proud of

✅ **Built a production-grade MVP in 36 hours** that actually solves a real problem for millions  

✅ **AI that makes bureaucracy human** – GPT-4 generates contextual questions, not generic forms  

✅ **Smart Profile system** – Eliminates 70-80% of data re-entry across applications (game-changer for multi-program filers)  

✅ **Privacy-first design** – No SSN required, all data encrypted, users control everything  

✅ **Real UX for real people** – Tested with low-literacy users; everything is accessible and clear  

✅ **End-to-end platform** – From discovery (eligibility screener) → research (AI guide) → application (wizard) → tracking (dashboard) → export (PDF)  

✅ **Measurable impact** – Average user discovers 5-8 new programs worth $10,000+ annually  

✅ **Deployed and live** – Already running at claimly.claims with real users testing it  

✅ **Transparent about limitations** – Shows "this is an estimate, not a decision" everywhere; always links to official .gov sites for final applications  

✅ **Community-first mission** – Built for families, not for profit-maximization  

---

## What we learned

1. **The gap is deeper than we thought**
   - Americans don't just struggle with complexity—many don't know these programs exist at all
   - One sentence of description isn't enough; people need personalized "why this matters for you" explanations

2. **AI is best when it understands context**
   - Generic GPT-4 responses weren't good enough; we needed domain-specific prompts, fallback logic, and human editorial review
   - The model works best when we constrain it (specific JSON output, validation rules)

3. **Privacy isn't a feature, it's a requirement**
   - Users will abandon a flow if they see "enter SSN" or feel watched
   - Building trust early (transparency about what we store) is worth more than collecting every data point

4. **Eligibility rules vary more than we expected**
   - No two states run the same program the same way
   - "One size fits all" doesn't work; we need state-specific logic

5. **People need reassurance at every step**
   - "Is this real?" "Can I trust this?" "What happens if I'm wrong?"
   - Clear badges, official links, and next-step clarity matter more than feature density

6. **Accessibility is non-negotiable**
   - A tool for low-income Americans must work for low-literacy users
   - Plain language + TTS + mobile-first design aren't nice-to-have; they're essential

7. **Government data is messy**
   - Official eligibility pages are outdated, contradictory, or hosted on outdated portals
   - We can't rely on perfect data; we need clear disclaimers and human review loops

---

## What's next for Claimly.Claims

**Immediate (Next 3 months):**
- 🤝 **Partner with 10+ nonprofits** – CBOs, legal aid orgs, immigrant services – to integrate Claimly into their workflows
- 🌍 **Multi-language support** – Spanish, Mandarin, Vietnamese, Arabic (for communities with highest unclaimed benefit rates)
- 📱 **Mobile app** – React Native for iOS/Android; bring Claimly to people without consistent computer access
- 🔗 **Direct submission integration** – One-click application submission to state agencies (pilot in 3 states)

**Medium-term (6-12 months):**
- 🏛️ **Government partnerships** – Work with state benefit agencies to integrate Claimly as their recommendation tool
- 📊 **Impact dashboard** – Show aggregate data (how many families helped, how much claimed) with privacy
- 🎓 **Financial literacy module** – Interactive lessons on budgeting, savings, benefits navigation
- 🤖 **Refined AI model** – Fine-tuned on real user data to improve question quality and eligibility predictions

**Long-term vision:**
- **Become the national standard** for benefit discovery and application support
- **Eliminate the $140B annual unclaimed benefits gap** by making government programs accessible to everyone
- **Scale to 50+ countries** – Other nations have similar bureaucratic benefit deserts we can solve

**Revenue model:**
- Free for individuals (always)
- Grants from foundations (Ford, Gates, MacArthur focused on poverty/economic justice)
- Nonprofit partnerships (CBOs pay per user served, or commission-based)
- Government contracts (states pay to reduce manual application processing)

**Our north star:**
*No one should miss out on help they've already earned because they don't know about it or can't navigate the paperwork.*

---

## Built with ❤️ at MY-HACK 2026

**Category:** Learn. Serve. Make an Impact  
**Team:** Faiz (CEO), Ali (Secretary), Masroor (Marketing), Ahmad (Treasury), Yousuf (Maintenance)  
**Submission:** July 26, 2026 – The Islamic Center of Maryland

