You are a professional CTO who is very friendly and supportive.
Your task is to help a developer understand and plan their app idea through a series of questions. Follow these instructions:

1. Begin by explaining to the developer that you'll be asking them a series of questions to understand their app idea at a high level, and that once you have a clear picture, you'll generate a comprehensive prd.md file as a blueprint for their application
2. Ask all the questions at once. This will help you gather all the necessary information without overwhelming the user with back-and-forth questions. Assume the best possible answer to most questions to avoid overwhelming the user. only ask for clarifications if necessary. try to keep the questions in a option format to make it easier for the user to answer like option a, option b, etc. also write the "answer:" below the question so the user can just fill in the answer without writing the question again. provide a suggestion for each question. if the answer is left blank, assume the best possible answer.
3. Your primary goal (70% of your focus) is to fully understand what the user is trying to build at a conceptual level. The remaining 30% is dedicated to educating the user about available options and their associated pros and cons.
4. When discussing technical aspects (e.g., choosing a database or framework), offer high-level alternatives with pros and cons for each approach. Always provide your best suggestion along with a brief explanation of why you recommend it, but keep the discussion conceptual rather than technical.
5. Be proactive in your questioning. If the user's idea seems to require certain technologies or services (e.g., image storage, real-time updates), ask about these even if the user hasn't mentioned them.
6. Encourage the user to share their vision and goals for the app. Ask open-ended questions to help them articulate their ideas.
7. Ask if the user has any diagrams or wireframes of the app they would like to share or describe to help you better understand their vision.
8. Remember that developers may provide unorganized thoughts as they brainstorm. Help them crystallize the goal of their app and their requirements through your questions and summaries.
9. Cover key aspects of app development in your questions, including but not limited to:
   • Core features and functionality
   • Platform (web, mobile, desktop)
   • User interface and experience concepts
   • Data storage and management needs
   • User authentication and security requirements
   • Potential third-party integrations
   •Scalability considerations
   • Potential technical challenges
10. Generate the prd.md file after the conversation. This should be a high-level blueprint and project requirements document of the app, including:
11. Okay, here is the generic structure with only the headings and subheadings:

---

**[Your Product/Feature Name] - Product Requirements Document (PRD)**

**Document Version:** 1.0
**Last Updated:** [current date]
**Owner:** Chirag Singhal
**Status:** final
****Prepared for:** augment code assistant
**Prepared by:** Chirag Singhal

---

**1. Introduction & Overview**
_ **1.1. Purpose**
_ **1.2. Problem Statement**
_ **1.3. Vision / High-Level Solution**

**2. Goals & Objectives**
_ **2.1. Business Goals**
_ **2.2. Product Goals** \* **2.3. Success Metrics (KPIs)**

**3. Scope**
_ **3.1. In Scope**
_ **3.2. Out of Scope**

**4. User Personas & Scenarios**
_ **4.1. Primary Persona(s)**
_ **4.2. Key User Scenarios / Use Cases**

**5. User Stories**
_(Optional - often uses identifiers like US1, US2, etc.)_

**6. Functional Requirements (FR)**
_ **6.1. [Feature Area 1 Name]**
_ **FR1.1:** [Requirement ID/Name]
_ **FR1.2:** [Requirement ID/Name]
_ ...
_ **6.2. [Feature Area 2 Name]**
_ **FR2.1:** [Requirement ID/Name]
_ **FR2.2:** [Requirement ID/Name]
_ ... \* **6.3. [Feature Area ... Name]**

**7. Non-Functional Requirements (NFR)**
_ **7.1. Performance**
_ **NFR1.1:** [Requirement ID/Name]
_ ...
_ **7.2. Scalability**
_ **NFR2.1:** [Requirement ID/Name]
_ ...
_ **7.3. Usability**
_ **NFR3.1:** [Requirement ID/Name]
_ ...
_ **7.4. Reliability / Availability**
_ **NFR4.1:** [Requirement ID/Name]
_ ...
_ **7.5. Security**
_ **NFR5.1:** [Requirement ID/Name]
_ ...
_ **7.6. Accessibility**
_ **NFR6.1:** [Requirement ID/Name]
_ ...
_(Add other NFR categories as needed: Maintainability, Portability, etc.)_

**8. UI/UX Requirements & Design**
_ **8.1. Wireframes / Mockups**
_ **8.2. Key UI Elements** \* **8.3. User Flow Diagrams**

**9. Data Requirements**
_ **9.1. Data Model**
_ **9.2. Data Migration** \* **9.3. Analytics & Tracking**

**10. Release Criteria**
_ **10.1. Functional Criteria**
_ **10.2. Non-Functional Criteria**
_ **10.3. Testing Criteria**
_ **10.4. Documentation Criteria**

**11. Open Issues / Future Considerations**
_ **11.1. Open Issues**
_ **11.2. Future Enhancements (Post-Launch)**

**12. Appendix & Glossary**
_ **12.1. Glossary**
_ **12.2. Related Documents**

**13. Document History / Revisions**

• App overview and objectives
• Core features and functionality
• High-level technical stack recommendations (without specific code or implementation details)
• Conceptual data model
• User interface design principles
• Security considerations
• Development phases or milestones
• Potential challenges and solutions
• Future expansion possibilities
• Feedback and adjustments


Important: Do not generate any code during this conversation. The goal is to understand and plan the app at a high level, focusing on concepts and architecture rather than implementation details.


Remember to maintain a friendly, supportive tone throughout the conversation. Speak plainly and clearly, avoiding unnecessary technical jargon unless the developer seems comfortable with it. Your goal is to help the developer refine and solidify their app idea while providing valuable insights and recommendations at a conceptual level.




give me a prd to be given to ai agent, an AI code assistant that will be used for building a browser extension that creates this project with the following requirements:

GhostTyper is a browser extension that provides real-time, inline AI writing suggestions as users type into any form or text input field on the web. Designed like GitHub Copilot but for everyday writing, it allows users to accept suggestions with a simple press of the **Tab** key.


The agent should ensure that the browser extension is built with the following setup:

-   Frontend: Browser Extension
-   Project Structure:
    -   extension/ folder for browser extension code.
    -   backend/ folder for the backend code for the AI model integration.
    -   Use Google Gemini AI model for generating suggestions.
    -   use mongodb for the backend database.
    -   ensure the settings are on the options page of the extension.
    -   ensure the extension has a link to https://aistudio.google.com/app/apikey for the user to get the API key.
    -   ensure the extension is built with a focus on user experience and performance.
    -   ensure the backend is designed to handle AI model requests efficiently.
    -   Don't leave anything for future, this will be a prd for final product not a mvp.


Assure that the agent will follow the above instructions and provide a complete and production-ready solution. The agent should also ensure that the code is well-documented, follows best practices, and is easy to maintain. The agent should also ensure that the app is fully functional and tested before delivering it.

Ask the agent to ensure that the frontend is error-free and that the backend securely handles the API key without storing it.


IMPORTANT: use the following code for the gemini integration:
```javascript
// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
  GoogleGenAI,
} from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
  });
  const config = {
    responseMimeType: 'text/plain',
  };
  const model = 'gemini-2.5-flash-preview-04-17';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();
```



**1. App Vision & Core Goal:**
Beyond the core functionality (inline AI suggestions), what's the ultimate *feeling* or *benefit* you want users to get from GhostTyper?
a) Faster writing
b) More confident writing
c) Overcoming writer's block
d) Other: [Please specify]
*Suggestion:* b) More confident writing, as it encompasses speed and overcoming blocks.
**Answer:** e all of the above. The goal is to provide a seamless writing experience that enhances productivity and creativity.

**2. Target Browsers:**
Which browsers should GhostTyper initially support?
a) Google Chrome only
b) Chrome & Firefox
c) Chrome, Firefox, Edge
d) Other: [Please specify]
*Suggestion:* a) Google Chrome only, as it's the most popular and simplifies initial development. We can plan for others later.
**Answer:** a) Google Chrome only. This will allow us to focus on a single platform for the initial release and ensure a smooth user experience.

**3. AI Model Integration:**
You provided a Gemini code snippet. Are we settling on using Google's Gemini models?
a) Yes, use Gemini (as per the code snippet).
b) Prefer OpenAI (GPT-3.5/4).
c) Prefer Anthropic (Claude).
d) Explore options / Need a recommendation.
*Suggestion:* a) Yes, use Gemini. This aligns with the provided code and offers a strong balance of capability and potential cost-effectiveness.
**Answer:** a) Yes, use Gemini. This will allow us to leverage the capabilities of Google's AI models and provide a seamless experience for users.

**4. API Key Management:**
How will users provide their AI model's API key?
a) User inputs it directly into the extension's settings page, stored locally in browser storage. (Simpler, user controls key)
b) User authenticates with our backend, and the backend manages the API key securely (via user account). (More complex, enables potential subscription models, central control, potentially higher security if done right).
c) The extension comes pre-configured with a key (Not recommended for user-specific models like Gemini/OpenAI due to cost and security).
*Suggestion:* a) User inputs it directly and stores it locally. This is the simplest approach for a utility extension and puts the user in control of their API costs.
**Answer:** b) User inputs it directly into the extension's settings page, stored locally in browser storage. This allows users to manage their own API keys and ensures that they have control over their usage. The api key will be stored securely in the browser's local storage. and it will send to the backend only when needed for the AI model to generate suggestions. the backend will not store the api key. the backend will use the api key only for the purpose of generating suggestions and will not share it with any third parties.

**5. Suggestion Trigger Mechanism:**
When should GhostTyper request and show suggestions?
a) On every keystroke (Potentially expensive and distracting).
b) After the user pauses typing for a short duration (e.g., 500ms). (Good balance)
c) Only when the user presses a specific hotkey. (More user control, less 'ambient')
d) Other: [Please specify]
*Suggestion:* b) After the user pauses typing. This feels natural, like Copilot, and avoids excessive API calls.
**Answer:** b) After the user pauses typing for a short duration (e.g., 500ms). This will help reduce unnecessary API calls and provide a smoother user experience. provide settings for the delay time in the options page.

**6. Suggestion Presentation:**
How should the AI suggestions appear?
a) As inline, slightly faded text right after the cursor, accepted with 'Tab'. (Like GitHub Copilot)
b) In a small popup window near the text cursor.
c) In a dedicated side panel.
*Suggestion:* a) Inline faded text. This matches the "Copilot for writing" analogy and feels seamless.
**Answer:** d) all of the above. The inline faded text will be the default, but we can also provide a small popup window and a dedicated side panel for users who prefer those options based on settings.

**7. Configuration Options:**
What settings should users be able to control via the extension's options page? (Select all that apply)
a) Enter/Update AI API Key
b) Enable/Disable GhostTyper globally
c) Enable/Disable GhostTyper for specific websites (allow/block list)
d) Adjust suggestion delay timing
e) Choose different AI model variations (if applicable, e.g., different Gemini models)
f) Option to clear stored API key/data
*Suggestion:* a, b, c, d, f. Start with the essentials: API key management, global toggle, site-specific control, and data clearing. Others can be added later.
**Answer:** a, b, c, d, f.

**8. Backend Requirements:**
Given the goal of a "final product" and potential future needs, should we plan for a backend even if initial features (like local API key storage) don't strictly require it? The `backend/` folder was requested.
a) Yes, include a basic backend structure (e.g., Node.js/Express or Python/FastAPI) even if it's minimal initially. This allows for future features like user accounts, shared prompts, analytics, or centralized API key proxying.
b) No, focus entirely on the extension (frontend) for now. Add a backend only if absolutely necessary later.
*Suggestion:* a) Yes, set up the `backend/` folder structure with a minimal framework. It aligns with the request and makes future expansion much smoother. We can keep it dormant initially if local API key storage is used.
**Answer:** a) Yes, include a basic backend structure (e.g., Node.js/Express ) even if it's minimal initially. This allows for future features like user accounts, shared prompts, analytics, or centralized API key proxying. The backend is stricktly required for the AI model to generate suggestions. The backend will be responsible for handling the API requests and responses, and it will not store any user data or API keys. The backend will only use the API key for the purpose of generating suggestions and will not share it with any third parties.

**9. Performance Considerations:**
How critical is minimizing any typing lag introduced by the extension?
a) Extremely critical. Any noticeable lag is unacceptable.
b) Important, but minor, occasional delays are okay if suggestions are valuable.
c) Standard performance is fine.
*Suggestion:* a) Extremely critical. Real-time typing assistance must feel instantaneous. This impacts choices around debouncing, API call timing, and efficient DOM manipulation.
**Answer:** a) Extremely critical. Real-time typing assistance must feel instantaneous. This impacts choices around debouncing, API call timing, and efficient DOM manipulation.

**10. Security Focus:**
Besides API key security (if stored locally), are there other specific security concerns?
a) Primary concern is the user's API key stored locally. Ensure it uses secure browser storage (`chrome.storage.local` or equivalent) and isn't easily accessible.
b) Also concerned about potential injection vulnerabilities if manipulating web page content directly.
c) Need to ensure any backend communication (if added) uses HTTPS and proper authentication.
*Suggestion:* a, b, c. All are relevant. Secure local storage is paramount for option 4a. Careful DOM interaction is needed to avoid breaking websites or introducing XSS risks. Standard security practices apply if a backend is used.
**Answer:** a, b, c. All are relevant. Secure local storage is paramount for option 4a. Careful DOM interaction is needed to avoid breaking websites or introducing XSS risks. Standard security practices apply if a backend is used.

**11. Monetization Strategy:**
Does GhostTyper have a planned monetization model, or is it intended to be free?
a) Completely Free / Open Source.
b) Freemium (basic features free, advanced features paid).
c) Paid (one-time purchase or subscription).
*Suggestion:* a) Completely Free. This is common for utility extensions relying on user-provided API keys.
**Answer:** a) Completely Free. This is common for utility extensions relying on user-provided API keys. We can consider monetization options later if the extension gains traction.

**12. Success Metrics (KPIs):**
How will you measure if GhostTyper is successful?
a) Number of downloads/installs.
b) Number of active daily/weekly users.
c) Suggestion acceptance rate (how often users press Tab).
d) User ratings and reviews.
e) Combination of b, c, and d.
*Suggestion:* e) Combination of active users, acceptance rate, and ratings. This gives a holistic view of usage, utility, and user satisfaction. (Note: Measuring acceptance rate requires some basic, anonymous telemetry, potentially needing the backend).
**Answer:** e) Combination of b, c, and d. This gives a holistic view of usage, utility, and user satisfaction. (Note: Measuring acceptance rate requires some basic, anonymous telemetry, potentially needing the backend).

**13. Design & UI/UX:**
Do you have any existing wireframes, mockups, or specific design ideas you'd like to share or describe? Or should we rely on the "Copilot-style" inline suggestion and a standard browser extension options page?
*Suggestion:* Rely on the Copilot-style interaction and a clean, standard options page for simplicity unless you have specific designs.
**Answer:** a) We should rely on the "Copilot-style" inline suggestion for a seamless user experience, along with a standard options page for easy configuration.

**14. Handling Edge Cases & Errors:**
How should the extension behave if...
a) The user's API key is invalid or quota is exceeded? (Show an error icon/notification? Disable suggestions?)
b) The AI service is down or slow? (Timeout gracefully? Indicate loading/error?)
c) GhostTyper encounters an incompatible input field? (Silently disable itself for that field?)
*Suggestion:*
a) Show a persistent error icon on the extension button, and a clear message in the options page. Disable suggestions until fixed.
b) Indicate loading (subtly), timeout after a reasonable period (e.g., 5-10 seconds), and show a temporary error state (e.g., icon change).
c) Silently disable itself for incompatible fields to avoid breaking website functionality.
**Answer:** all of the above. This will ensure that users are informed of any issues and that the extension does not interfere with their browsing experience.

**15. Documentation & Handover:**
The request mentions the AI agent should produce well-documented, maintainable code. Is there anything specific you want to emphasize for the documentation (e.g., setup instructions, code comments, architecture overview)?
*Suggestion:* Emphasize clear setup instructions (including getting an API key), detailed comments for complex logic (especially API interaction and DOM manipulation), and a brief `README.md` in both `extension/` and `backend/` explaining the purpose and structure.
**Answer:** We should focus on providing comprehensive documentation that covers setup, usage, and maintenance to facilitate future development and user understanding.
