# Enhance FlowWrite Chrome Extension with Cursor-Aware Context Capture

Implement a comprehensive context capture feature in the FlowWrite Chrome extension that improves suggestion relevance by capturing cursor position and surrounding text:

## 1. Implement Cursor-Aware Text Capture
- Capture the complete text content from the active input field where the user is typing
- Split and store text into two distinct parts:
  * `prefixText`: All text before the cursor position (up to and not including the cursor)
  * `suffixText`: All text after the cursor position (from cursor to end)
- Track cursor position changes to maintain accurate text segmentation
- Support all input types: standard inputs, textareas, and contentEditable elements (including rich text editors)

## 2. Structure Context Data in JSON Format
- Format captured context as a structured JSON object with the following fields:
  ```json
  {
    "prefixText": "Text before cursor",
    "suffixText": "Text after cursor",
    "cursorPosition": 123,
    "fieldType": "textarea|input|contentEditable",
    "fieldAttributes": {
      "id": "field-id",
      "class": "field-classes",
      "name": "field-name"
    },
    "pageUrl": "https://current-page-url.com",
    "pageTitle": "Current Page Title"
  }
  ```
- Preserve all formatting, line breaks, and special characters in the text fields
- Include detailed metadata about the input field to provide context for the suggestion algorithm

## 3. Implement Secure API Communication
- Send the structured context to the FlowWrite Node.js backend using HTTPS POST requests
- Include the Google Gemini API key in request headers using secure authentication
- Implement comprehensive error handling:
  * Network failures: Retry with exponential backoff (max 3 attempts)
  * Timeouts: Set 5-second timeout with user notification on failure
  * Server errors: Parse error responses and display appropriate messages
- Use AbortController to cancel in-flight requests when new text is typed, preventing race conditions

## 4. Optimize Performance
- Implement a 300ms debounce to prevent excessive API calls during rapid typing
- Only send context when meaningful changes occur (more than just whitespace changes)
- Compress large payloads (>10KB) using efficient compression
- Implement a client-side cache to avoid duplicate requests for identical contexts

## 5. Enhance Error Handling and User Experience
- Display unobtrusive error notifications in the extension UI:
  * Connection errors: "Unable to connect to FlowWrite service"
  * Authentication errors: "API key validation failed"
  * Service errors: "Suggestion service temporarily unavailable"
- Implement graceful degradation when API is unavailable:
  * Fall back to local basic suggestions if possible
  * Clearly indicate when operating in fallback mode
- Log detailed error information to the extension's debug console with request IDs for troubleshooting

## 6. Backend Integration
- The backend will forward this enhanced context to Google Gemini API
- Gemini will use both prefix and suffix text to generate contextually relevant suggestions
- The response will include suggested text completions that fit naturally between the prefix and suffix

This implementation will significantly improve suggestion quality by providing Gemini with complete context awareness, including text before and after the cursor position.