---

**flowwrite - Product Requirements Document (PRD)**

**Document Version:** 1.0
**Last Updated:** [Current Date]
**Owner:** [Your Name/Developer Name]
**Status:** Final
**Prepared for:** AI Code Assistant
**Prepared by:** [Your Name/Developer Name, with input from Friendly CTO Assistant]

---

**1. Introduction & Overview**

*   **1.1. Purpose:** This document outlines the requirements for GhostTyper, a browser extension designed to provide real-time, inline AI-powered writing suggestions to users as they type in web forms and text fields. This PRD serves as the primary specification for development by an AI Code Assistant.
*   **1.2. Problem Statement:** Users often face challenges with writing speed, confidence, and overcoming writer's block when composing text online (emails, documents, social media, etc.). Existing tools might require copy-pasting or navigating away from the current context.
*   **1.3. Vision / High-Level Solution:** GhostTyper aims to be the "GitHub Copilot for everyday writing." It will seamlessly integrate into the user's workflow by offering intelligent, context-aware suggestions directly within the text field they are using. Users can accept suggestions instantly with the 'Tab' key, enhancing productivity, creativity, and writing confidence. The solution involves a Chrome browser extension frontend and a lightweight Node.js backend to interface with the Google Gemini AI model.

**2. Goals & Objectives**

*   **2.1. Business Goals:**
    *   Achieve significant user adoption within the Chrome browser ecosystem.
    *   Establish GhostTyper as a highly-rated, reliable writing assistance tool.
    *   Provide the tool completely free to end-users.
*   **2.2. Product Goals:**
    *   Deliver accurate, relevant, and timely AI writing suggestions.
    *   Ensure a seamless, non-intrusive user experience that feels instantaneous.
    *   Maintain user privacy and security, particularly regarding API keys.
    *   Provide essential configuration options for user control.
    *   Build a stable, performant, and maintainable extension and backend.
    *   Deliver a production-ready, fully functional application (not an MVP).
*   **2.3. Success Metrics (KPIs):**
    *   Number of Weekly Active Users (WAU).
    *   Suggestion Acceptance Rate (Percentage of suggestions accepted via 'Tab'). (Requires anonymous telemetry).
    *   Average User Rating (e.g., on Chrome Web Store).
    *   Number of installs/downloads.

**3. Scope**

*   **3.1. In Scope:**
    *   Chrome Browser Extension.
    *   Real-time, inline AI writing suggestions triggered by pausing during typing.
    *   Accepting suggestions via the 'Tab' key.
    *   Integration with Google Gemini AI models via a backend proxy.
    *   User configuration options page within the extension:
        *   Google AI API Key input (linked to `https://aistudio.google.com/app/apikey`).
        *   Global enable/disable toggle.
        *   Per-site enable/disable (allow/block list).
        *   Adjustable suggestion trigger delay timing.
        *   Option to clear stored API key and related settings.
        *   Option to choose presentation style (inline default, popup, side panel).
    *   Secure handling of user's API key: Stored in `chrome.storage.local`, sent securely (HTTPS) to the backend *only* when needed for a request, **never stored on the backend**.
    *   Basic backend service (Node.js/Express) to handle API calls to Google Gemini using the user's provided key.
    *   MongoDB database integration with the backend (initially for potential anonymous telemetry like acceptance rate; no user account data).
    *   Graceful error handling for API key issues, AI service downtime/errors, and incompatible input fields.
    *   High performance focus to minimize typing lag.
    *   Clean, well-documented, and maintainable code structure (`extension/`, `backend/`).
*   **3.2. Out of Scope:**
    *   Support for browsers other than Google Chrome (e.g., Firefox, Safari, Edge) in this version.
    *   Support for AI models other than Google Gemini.
    *   User accounts or authentication (beyond providing the API key locally).
    *   Offline functionality (requires active internet and valid API key).
    *   Advanced formatting suggestions.
    *   Team features or collaboration.
    *   Storing user writing content on the backend.
    *   Monetization features (subscriptions, paid tiers).
    *   Mobile or Desktop application versions.

**4. User Personas & Scenarios**

*   **4.1. Primary Persona(s):**
    *   **The Frequent Writer:** (e.g., Student, Content Creator, Professional) Someone who spends significant time writing emails, reports, articles, or social media posts online and wants to improve speed and quality.
    *   **The Hesitant Writer:** Someone who struggles with writer's block or lacks confidence in their writing and seeks assistance to get started or refine their thoughts.
*   **4.2. Key User Scenarios / Use Cases:**
    *   **Email Composition:** User types an email, pauses, GhostTyper suggests the next sentence or phrase, user hits Tab to accept.
    *   **Document Drafting:** User types in Google Docs/Office 365 Web, pauses mid-sentence, GhostTyper offers completions, user accepts.
    *   **Form Filling:** User fills out a feedback form, pauses while describing an issue, GhostTyper suggests clarifying words, user accepts.
    *   **Configuration:** User opens extension options, enters their Gemini API key, disables GhostTyper on a specific internal website, and adjusts the trigger delay.
    *   **Error Recovery:** User enters an invalid API key; the extension icon indicates an error, and the options page shows a message prompting them to fix it.

**5. User Stories**

*   US1: As a user, I want to see AI-generated writing suggestions inline as I type in web text fields so that I can write faster and more easily.
*   US2: As a user, I want to accept a suggestion simply by pressing the 'Tab' key so that the workflow is seamless.
*   US3: As a user, I want suggestions to appear automatically after I pause typing for a short time so that I don't have to manually trigger them.
*   US4: As a user, I want to securely provide my own Google Gemini API key in the extension's settings so that I can control my AI usage and costs.
*   US5: As a user, I want my API key stored securely in my browser and not stored on any backend server so that my credentials remain private.
*   US6: As a user, I want to be able to enable or disable GhostTyper globally via the extension settings.
*   US7: As a user, I want to be able to disable GhostTyper on specific websites where I don't need or want suggestions.
*   US8: As a user, I want to adjust the pause duration before suggestions appear so that I can fine-tune it to my typing speed.
*   US9: As a user, I want clear feedback (e.g., icon change, message) if my API key is invalid or the AI service has issues so that I understand why suggestions aren't working.
*   US10: As a user, I want GhostTyper to avoid interfering with incompatible input fields (e.g., password fields) so it doesn't break website functionality.
*   US11: As a user, I want the option to choose how suggestions are presented (inline, popup, side panel) to suit my preference.

**6. Functional Requirements (FR)**

*   **6.1. Core Suggestion Engine (Frontend - extension/)**
    *   **FR1.1:** Detect user typing activity within supported HTML input elements (`<input type="text">`, `<textarea>`, contentEditable divs).
    *   **FR1.2:** Implement a configurable debounce mechanism to trigger suggestion requests only after the user pauses typing for a set duration (default: 500ms).
    *   **FR1.3:** Extract relevant context (e.g., preceding text) from the input field.
    *   **FR1.4:** Send the context and the user's locally stored API key securely (HTTPS) to the backend API endpoint for suggestion generation.
    *   **FR1.5:** Receive suggestion(s) from the backend.
    *   **FR1.6:** Display the primary suggestion according to the user's chosen presentation setting (default: inline, faded text after the cursor). Support alternative presentation modes (popup, side panel) based on settings.
    *   **FR1.7:** Listen for the 'Tab' key press when a suggestion is visible.
    *   **FR1.8:** On 'Tab' press, insert the suggestion text into the input field, replacing the faded placeholder.
    *   **FR1.9:** If the user continues typing or presses Esc instead of Tab, hide the current suggestion.
    *   **FR1.10:** Implement logic to gracefully disable suggestion functionality for specific incompatible fields (e.g., password inputs, fields marked with a specific attribute if needed).
    *   **FR1.11:** Display subtle visual cues for loading states (while waiting for backend) or temporary errors (if backend fails).
*   **6.2. Extension Options Page (Frontend - extension/)**
    *   **FR2.1:** Provide an input field for the user to enter their Google Gemini API Key.
    *   **FR2.2:** Include a link to `https://aistudio.google.com/app/apikey` near the API key input field.
    *   **FR2.3:** Securely save the API key using `chrome.storage.local`.
    *   **FR2.4:** Provide a global toggle switch (On/Off) to enable/disable the extension's functionality. Save state in `chrome.storage.local`.
    *   **FR2.5:** Provide an interface (e.g., text area input) for users to list website domains (e.g., `internal.mycompany.com`, `anothersite.org`) where GhostTyper should be disabled. Save list in `chrome.storage.local`.
    *   **FR2.6:** Provide a slider or input field to adjust the suggestion trigger delay (e.g., from 200ms to 2000ms). Save value in `chrome.storage.local`.
    *   **FR2.7:** Provide radio buttons or a dropdown to select the suggestion presentation style (Inline, Popup, Side Panel). Save preference in `chrome.storage.local`.
    *   **FR2.8:** Provide a button to "Clear Stored Data" which removes the API key and resets all settings to default from `chrome.storage.local`.
    *   **FR2.9:** Display clear error messages if the backend reports an invalid API key or persistent connection issues.
*   **6.3. Backend API Service (backend/)**
    *   **FR3.1:** Implement using Node.js and Express framework.
    *   **FR3.2:** Provide a secure HTTPS endpoint (e.g., `/api/suggest`) to receive suggestion requests from the Chrome extension.
    *   **FR3.3:** Accept POST requests containing the text context and the user's Gemini API key in the request body or headers (securely transmitted).
    *   **FR3.4:** **CRITICAL:** Use the received API key *only* for the immediate request to the Google Gemini API. **DO NOT** store the API key persistently in logs, database, or memory after the request is processed.
    *   **FR3.5:** Utilize the provided Google Gemini Node.js client code structure (`@google/genai`) to interact with the Gemini API (`gemini-1.5-flash-latest` or similar suitable model) using the provided key.
    *   **FR3.6:** Send the context to the Gemini API and request text completion/suggestion. Configure for plain text response.
    *   **FR3.7:** Handle potential errors from the Gemini API (e.g., invalid key, quota exceeded, service unavailable) and return appropriate error responses (e.g., 401, 429, 503) to the extension frontend.
    *   **FR3.8:** Return the generated suggestion(s) as a JSON response to the extension frontend upon successful completion.
    *   **FR3.9:** (Optional Telemetry) If implementing acceptance rate KPI: Create an endpoint to receive anonymous pings when a suggestion is accepted. Store aggregated, anonymous counts in MongoDB. Ensure no user-identifiable data or text content is stored.
    *   **FR3.10:** Ensure the backend is stateless regarding user sessions or API keys. Each request must be self-contained.

**7. Non-Functional Requirements (NFR)**

*   **7.1. Performance:**
    *   **NFR1.1:** Suggestion latency (time from pause to suggestion appearing) should feel near-instantaneous, ideally under 500ms network/AI time + debounce delay. **(Critical)**
    *   **NFR1.2:** Extension should have minimal impact on browser performance and page loading times.
    *   **NFR1.3:** Backend API response time (excluding Gemini API time) should be < 100ms under typical load.
    *   **NFR1.4:** Efficient DOM manipulation to avoid page jank or lag when inserting/removing suggestions.
*   **7.2. Scalability:**
    *   **NFR2.1:** Backend should be designed stateless to allow for easy horizontal scaling if needed (e.g., via containerization).
    *   **NFR2.2:** Efficient use of Gemini API calls (e.g., ensure context is appropriate, avoid unnecessarily frequent calls).
*   **7.3. Usability:**
    *   **NFR3.1:** Suggestions should be clearly distinguishable from user-typed text (e.g., faded style).
    *   **NFR3.2:** Accepting suggestions via 'Tab' must be reliable and intuitive.
    *   **NFR3.3:** Options page must be clear, concise, and easy to understand.
    *   **NFR3.4:** Error states and loading indicators should be communicated clearly but subtly.
*   **7.4. Reliability / Availability:**
    *   **NFR4.1:** Extension should handle website structure variations gracefully.
    *   **NFR4.2:** Graceful degradation: If the backend or AI service is unavailable, the extension should indicate this clearly and disable suggestions temporarily without crashing or breaking the user's browsing session.
    *   **NFR4.3:** Implement timeouts for backend requests (e.g., 10 seconds) to prevent indefinite loading states.
*   **7.5. Security:**
    *   **NFR5.1:** User API keys must be stored securely using `chrome.storage.local`. **(Critical)**
    *   **NFR5.2:** All communication between the extension and the backend MUST use HTTPS.
    *   **NFR5.3:** Backend MUST NOT store user API keys. They are used ephemerally per request. **(Critical)**
    *   **NFR5.4:** Sanitize or carefully handle any data used for DOM manipulation in the extension to prevent potential Cross-Site Scripting (XSS) vulnerabilities if interacting heavily with page content.
    *   **NFR5.5:** Protect the backend API endpoint from abuse (e.g., consider rate limiting if necessary, though user-provided keys partially mitigate this).
*   **7.6. Accessibility:**
    *   **NFR6.1:** Options page should follow standard web accessibility guidelines (WCAG AA).
    *   **NFR6.2:** Ensure inline suggestions have sufficient contrast (when visible) or provide accessibility hints if feasible.

**8. UI/UX Requirements & Design**

*   **8.1. Wireframes / Mockups:** None provided. Rely on the functional description.
*   **8.2. Key UI Elements:**
    *   **Inline Suggestion:** Faded text appearing directly after the cursor.
    *   **Extension Icon:** Standard Chrome extension icon. Should provide visual feedback for error states (e.g., a red badge or 'X').
    *   **Options Page:** Clean, standard HTML form layout for settings. Use clear labels, input fields, toggles, buttons.
    *   **(Optional) Popup/Side Panel:** If implemented, these should be minimal and contextually placed near the text input area.
*   **8.3. User Flow Diagrams:**
    *   **Typing Flow:** User Types -> Pauses -> Extension Sends Context+Key -> Backend Calls Gemini -> Backend Returns Suggestion -> Extension Displays Suggestion -> User Hits Tab (Accept) or Types (Dismiss).
    *   **Config Flow:** User Clicks Extension Icon -> Opens Options -> Enters API Key -> Saves -> (Optionally) Configures Sites/Delay -> Closes Options.
    *   **Error Flow (API Key):** User Enters Invalid Key -> Tries Typing -> No Suggestions Appear -> Extension Icon Shows Error -> User Opens Options -> Sees Error Message.

**9. Data Requirements**

*   **9.1. Data Model (Conceptual):**
    *   **Frontend (`chrome.storage.local`):**
        *   `apiKey`: string (User's Gemini API Key)
        *   `isEnabled`: boolean (Global toggle state)
        *   `disabledSites`: string[] (List of domains)
        *   `suggestionDelay`: number (Milliseconds)
        *   `presentationMode`: string ('inline' | 'popup' | 'sidepanel')
    *   **Backend (MongoDB - If Telemetry Implemented):**
        *   `TelemetryData` (Collection):
            *   `date`: Date (e.g., day granularity)
            *   `acceptanceCount`: number (Aggregated count)
            *   (Ensure NO user-specific data, IP addresses, or text content is stored)
*   **9.2. Data Migration:** N/A for V1.
*   **9.3. Analytics & Tracking:** Primarily through KPIs (WAU, Acceptance Rate via anonymous telemetry, Ratings).

**10. Release Criteria**

*   **10.1. Functional Criteria:** All Functional Requirements (Section 6) implemented and verified.
*   **10.2. Non-Functional Criteria:** Meets critical NFRs for Performance (NFR1.1) and Security (NFR5.1, NFR5.2, NFR5.3). Other NFRs tested and deemed acceptable.
*   **10.3. Testing Criteria:**
    *   Extension tested on latest stable Google Chrome version.
    *   Tested across a variety of websites (Gmail, Google Docs, social media, generic forms).
    *   Error handling paths (invalid key, network offline, API down) tested thoroughly.
    *   Security checks performed (no key leakage, HTTPS enforced).
    *   No critical or major bugs outstanding.
*   **10.4. Documentation Criteria:**
    *   `README.md` in both `extension/` and `backend/` folders detailing setup, architecture, and running instructions.
    *   Code is well-commented, especially complex logic (API interaction, DOM manipulation, security aspects).

**11. Open Issues / Future Considerations**

*   **11.1. Open Issues:**
    *   Confirm specific Gemini model to target (e.g., `gemini-1.5-flash-latest`).
    *   Finalize the exact implementation details for anonymous telemetry collection in MongoDB if pursued for Acceptance Rate KPI.
*   **11.2. Future Enhancements (Post-Launch):**
    *   Support for other browsers (Firefox, Edge).
    *   Support for other AI models (OpenAI, Anthropic).
    *   More sophisticated context gathering (e.g., reading more surrounding text).
    *   User accounts for syncing settings (would require significant backend changes).
    *   Allowing users to provide custom prompts or instructions.
    *   More granular controls (e.g., per-site prompts, model selection).

**12. Appendix & Glossary**

*   **12.1. Glossary:**
    *   **Inline Suggestion:** AI text appearing directly within the input field.
    *   **Debounce:** Delaying function execution until a certain pause occurs.
    *   **Stateless Backend:** Backend that does not store session information between requests.
    *   **`chrome.storage.local`:** Secure browser storage for extensions.
*   **12.2. Related Documents:**
    *   Gemini API Documentation: [https://ai.google.dev/docs](https://ai.google.dev/docs)
    *   Reference Gemini Code Snippet (as provided in initial request).

**13. Document History / Revisions**

*   **Version 1.0:** ([Current Date]) Initial draft based on developer request and Q&A.

---

IMPORTANT: the ai agent should follow the below code for the gemini integration:

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