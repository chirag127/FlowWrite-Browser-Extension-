Implement a context capture feature in the FlowWrite Chrome extension that:

1. Captures the complete text content from the active input field where the user is typing, including:
   - All text before the cursor position (prefix text)
   - All text after the cursor position (suffix text)
   - Store these separately to maintain awareness of cursor position

2. Format the captured context according to our established protocol:
   - Clearly delineate the prefix and suffix text in the API payload
   - Include metadata about the input field type (e.g., textarea, contenteditable div, input field)
   - Include the URL of the current page for additional context

3. Send this formatted context to our Node.js backend via a secure API call:
   - Use HTTPS for all communications
   - Implement proper authentication headers
   - Include appropriate error handling for network failures, timeouts, and server errors
   - Use AbortController to cancel outdated requests when new text is typed

4. Ensure the implementation is efficient:
   - Debounce the text capture to avoid excessive API calls
   - Only send context when meaningful changes occur
   - Optimize the payload size by trimming unnecessary whitespace while preserving formatting

5. Add comprehensive error handling:
   - Display user-friendly error messages for failed requests
   - Implement fallback behavior when the API is unavailable
   - Log errors for debugging purposes

The backend will forward this context to the Google Gemini API, which will use the complete text context (both before and after the cursor) to generate more relevant writing suggestions.