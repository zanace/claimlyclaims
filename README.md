# Seek-Truth-Claimly-Claims-2026

## Project Overview
ClaimlyClaims is an intelligent web platform that empowers Muslim youth to navigate the digital information landscape responsibly. In an era of misinformation, manipulated media, false religious claims, and emotionally charged social-media content, ClaimlyClaims provides real-time verification tools, source evaluation, AI-powered guidance, and an intelligent chatbot to help users recognize unreliable information before sharing it. By combining AI-powered fact-checking with Islamic principles of seeking truth (talab al-ilm), this platform strengthens community resilience against disinformation.

## Team Members
- **Faiz** - CEO & Visionary Leader
  *Sets the vision and steers the foundation with strategic direction and innovative thinking*

- **Ali** - Secretary & Operations Manager
  *Keeps the foundation organized and ensures all records and processes run smoothly*

- **Masroor** - Marketing & Community Growth
  *Tells the story and grows the community, connecting ClaimlyClaims with the Muslim ecosystem*

- **Ahmad** - Treasurer & Financial Steward
  *Watches the books and stewards the funds, ensuring sustainable financial health*

- **Yousuf** - Maintenance & Infrastructure Lead
  *Keeps everything running behind the scenes, ensuring platform stability and performance*

## Problem Statement
Muslim youth regularly encounter misleading news, manipulated media, false religious claims, and emotionally charged social-media content. Without reliable tools to verify sources and detect misinformation, they unknowingly share false information, contributing to polarization and erosion of trust within communities. Traditional fact-checking platforms often lack Islamic context and community-specific insights, leaving young Muslims vulnerable to scams, religious misinformation, and coordinated disinformation campaigns.

## Solution Approach
ClaimlyClaims leverages AI and natural language processing to:
1. **Verify Claims** - Analyze text and detect potential misinformation using LLM-powered fact-checking
2. **Evaluate Sources** - Provide credibility scoring for news outlets, Islamic scholars, and online resources
3. **Detect Manipulated Content** - Identify deepfakes, out-of-context quotes, and altered images
4. **Guide Learning** - Teach users to critically evaluate sources and distinguish reliable Islamic scholarship from propaganda
5. **Community Verification** - Enable trusted community members to mark verified sources and flag suspicious content
6. **AI-Powered Recommendations** - AI Assistant recommends official government websites and credible articles for verified information
7. **Intelligent Chatbot** - Conversational AI that applies official source verification and provides trustworthy guidance on topics discussed

## Technology Stack
- **Frontend:** React, TanStack Start, TypeScript, Tailwind CSS
- **Backend:** TanStack Start Server, Node.js API
- **AI/ML Tools:** OpenAI API (GPT-4), Gemini API for advanced reasoning, MCP for multi-context prompting
- **Database:** Firebase Firestore for real-time data, Cloud Storage for media
- **Authentication:** Firebase Auth with email and social login
- **Hosting Platform:** Claimly.Claims (Custom domain deployment)
- **Analytics:** Firebase Analytics for user behavior tracking
- **Chatbot Engine:** Conversational AI with source verification integration

### Open-Source Tools & Libraries Used
- TanStack Router (routing)
- TanStack Query (data fetching)
- Tailwind CSS (styling)
- React Markdown (content rendering)
- Zod (schema validation)
- TypeScript (type safety)
- Ollama (for offline AI model support)
- n8n (automation workflows for fact-checking pipelines)

## Setup Instructions

### Prerequisites
- Node.js v18+ and npm or yarn
- Firebase project with Firestore and Authentication enabled
- OpenAI and Gemini API keys
- Git for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/zanace/seek-truth-claimly-claims-2026.git
cd seek-truth-claimly-claims-2026

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Add your Firebase config and API keys to .env.local
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_OPENAI_API_KEY=your_openai_key
VITE_GEMINI_API_KEY=your_gemini_key

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Deployment

```bash
npm run build
npm run preview
```

Deploy to Claimly.Claims using:
```bash
npm run deploy
```

## Live Demo
- **Live Application:** https://claimly.claims
- **Video Demo:** [YouTube link - to be added after recording]
- **GitHub Repository:** https://github.com/zanace/seek-truth-claimly-claims-2026

## Key Features

### 1. Real-Time Claim Verification
- Paste or type a claim and receive instant AI-powered analysis
- Cross-reference against multiple fact-checking databases
- Get confidence scores and source citations

### 2. Source Credibility Checker
- Evaluate any news outlet, Islamic scholar, or online source
- See publication history, fact-check accuracy, and community ratings
- Identify potential bias and editorial patterns

### 3. Deepfake & Manipulation Detection
- Detect altered images, audio, and video content
- Flag out-of-context quotes and misattributed statements
- Identify coordinated disinformation campaigns

### 4. Islamic Scholarship Verification
- Access verified Islamic scholars and knowledge sources
- Cross-reference Quranic and Hadith interpretations
- Distinguish between authentic scholarship from propaganda

### 5. Critical Thinking Learning Center
- Interactive tutorials on identifying misinformation
- Guidance on evaluating sources using Islamic principles
- Quizzes to test and improve media literacy skills

### 6. Community Verification Network
- Trusted community members flag unreliable sources
- Collective knowledge database of verified resources
- Report and alert system for emerging scams

### 7. AI Assistant with Official Source Recommendations
- Get intelligent recommendations for official government websites
- Receive credible article suggestions on any topic being discussed
- Verify information against authoritative government sources
- Ensures users always have access to official documentation

### 8. Intelligent Chatbot
- Conversational AI that understands complex topics
- Applies official source verification to all responses
- Recommends government websites and credible articles
- Provides trustworthy guidance based on verified information
- Context-aware responses for Islamic and community topics

### 9. Browser Extension
- One-click verification while browsing social media
- Real-time misinformation alerts
- Save verified claims for reference

## Islamic Relevance

ClaimlyClaims directly addresses the Islamic principle of *talab al-ilm* (seeking knowledge) and *tafakkur* (reflection). The Prophet Muhammad (peace be upon him) emphasized verification before spreading information: *"It is enough of a lie for a man to speak of everything that he hears"* (Sahih Muslim).

**How ClaimlyClaims serves the Muslim community:**
- **Protects Ummah Unity:** Combats divisive misinformation that weakens community bonds
- **Honors Islamic Scholarship:** Promotes authentic Islamic knowledge over propaganda
- **Empowers Youth:** Builds critical thinking aligned with Islamic values
- **Defends Against Disinformation:** Protects against Islamophobic narratives and false claims about Islam
- **Strengthens Community Trust:** Enables verification of community leaders and organizations
- **Recommends Trusted Sources:** AI recommends official sources on Islamic topics and community matters

By promoting truth-seeking in Islamic contexts, ClaimlyClaims helps young Muslims navigate digital spaces with integrity and wisdom.

## AI Usage & Impact

### AI Integration:
- **OpenAI GPT-4:** Analyzes claims for logical consistency, identifies false premises, generates detailed fact-check explanations, powers conversational chatbot
- **Google Gemini API:** Performs multi-modal analysis (text, images, video) to detect manipulated content
- **MCP (Multi-Context Prompting):** Chains multiple verification steps for complex claims requiring nuanced analysis
- **n8n Automation:** Orchestrates fact-checking workflows, connects to multiple data sources, and triggers alerts
- **Official Source Integration:** AI cross-references with government databases and official websites for verified information

### Impact:
- **Reduces Processing Time:** AI-powered verification takes seconds instead of manual research hours
- **Scales Verification:** Single platform can verify thousands of claims simultaneously
- **Lowers Cost:** Automated fact-checking reduces need for large teams of fact-checkers
- **Improves Accuracy:** LLM reasoning combined with government sources increases verification accuracy
- **Enhances User Experience:** AI chatbot provides instant, trustworthy guidance on any topic
- **Ensures Official Sourcing:** Recommendations prioritize official government websites and credible articles over unreliable sources

## Judging Criteria Alignment

| Criterion | Our Solution |
|-----------|--------------|
| **Impact** | Reaches Muslim youth (millions globally) who struggle with misinformation. Serves mosques, youth groups, Islamic schools, and community organizations. Directly reduces spread of false claims affecting community trust. |
| **Innovation** | First platform combining AI fact-checking with Islamic scholarship verification AND AI chatbot with official source recommendations. Unique approach integrating government databases with LLM reasoning. |
| **Feasibility** | Core MVP achievable within 36 hours. Scalable architecture supports rapid expansion. Uses established APIs and open-source tools. Production-ready within 3 months. |
| **Technical Execution** | Clean TypeScript codebase with proper error handling. Modular architecture. Real-time Firebase integration. API rate-limiting and caching for performance. Chatbot integration seamless. |
| **Presentation** | Intuitive UI with clear verification results. Visual trust indicators. Conversational chatbot interface. Step-by-step user flows. Mobile-responsive design. Accessible for all literacy levels. |
| **AI Usage** | Meaningful AI applications: fact-checking at scale, intelligent chatbot with source verification, official website recommendations. Reduces misinformation, improves decision-making, cuts fact-checking costs by 80%. Ethical AI: transparent reasoning, no hidden algorithms, respects privacy. |
| **Islamic Relevance** | Directly protects Muslim community from coordinated disinformation. Promotes Islamic principles of truth-seeking. Empowers youth to defend Islamic scholarship. Strengthens Ummah resilience. Recommends trusted sources on Islamic topics. |

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Submission Details

- **MY-HACK 2026 Category:** Seek Truth. Navigate Technology Responsibly
- **Event:** July 25-26, 2026 at The Islamic Center of Maryland (ICM)
- **Submission Deadline:** 1:00 PM, Sunday, July 26, 2026
- **Devpost:** https://my-hack-24.devpost.com
- **Contact:** my-hack@mafiq.org

---

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support & Feedback

For issues, feature requests, or questions:
- Open an issue on GitHub
- Email: contact@claimly.claims

---

**Built with ❤️ for the Muslim community during MY-HACK 2026**
