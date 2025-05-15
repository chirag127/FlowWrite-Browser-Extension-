the ghost text suggestions on the multiline input field are getting overwritten on existing text when the user types this is particularly happening when the user is typing in a multiline input field and the ghost text suggestion is positioned at the end of the text. The ghost text suggestion should not be overwritten by the user's input. Instead, it should be shown after the user's cursor.

The ghost text suggestion should be shown after the user's cursor. In multiline input fields, the ghost text suggestion gets overlaped on existing text when the user types. This is happening because the ghost text suggestion is not being positioned correctly after the user's cursor. This particularly happens when the user is typing in a multiline input field and The user have typed some sentence.

Fix the ghost text suggestion positioning in multiline input fields to prevent overlap with existing text. Currently, when a user types in a multiline input field, the ghost text suggestion incorrectly overlaps with existing text instead of appearing after the cursor position. This issue specifically occurs when:

1. The user is typing in a multiline input field (textarea or contenteditable div)
2. The input field already contains multiple lines of text

The ghost text suggestion should:
- Always be positioned immediately after the user's cursor
- Never overlap with existing text content
- Properly wrap to new lines when reaching the edge of the input field
- Maintain proper text flow and formatting consistent with the surrounding text
- Adjust its position dynamically as the user types or moves the cursor

This fix should work across all supported websites and input field types while maintaining the existing suggestion generation functionality.

The text is not scrolling veritically when the ghost text suggestion is at the bottom of the input field. this is particularly happening when the user is typing in a multiline input field and the ghost text suggestion is positioned at the end of the text. The input field should scroll automatically to make the ghost text suggestion visible to the user. The input field should scroll automatically when the ghost text is accepted by the user.

Implement automatic scrolling functionality for ghost text suggestions in multiline input fields with the following requirements:

1. When a ghost text suggestion appears at or near the bottom of a multiline input field, automatically scroll the input field to ensure the entire suggestion is visible to the user.

2. Maintain a buffer margin of at least 20px between the ghost text suggestion and the bottom edge of the visible input area to improve readability.

3. When the user accepts a ghost text suggestion (via Tab key, Enter key, or clicking), automatically scroll the input field to ensure the cursor's new position is visible.

4. Handle both vertical scrolling (for multiline text that extends beyond the visible height) and horizontal scrolling (for text that extends beyond the visible width) if applicable.

5. Implement smooth scrolling behavior with an appropriate animation duration (approximately 200-300ms) for better user experience.

6. Ensure the scrolling logic works consistently across different types of multiline input elements (textareas, contenteditable divs, and rich text editors).

7. Add appropriate event listeners to detect when ghost text suggestions are rendered and when they are accepted to trigger the scrolling functionality.

This enhancement will improve user experience by ensuring ghost text suggestions are always visible regardless of cursor position within multiline input fields.


The vertical scrolling is not working properly. The input field is not scrolling automatically to make the ghost text suggestion visible to the user. The input field should scroll automatically when the ghost text suggestion is rendered at the bottom of the input field. The input field should also scroll automatically when the user accepts the ghost text suggestion by pressing the Tab key or clicking on the suggestion. The input field should also scroll automatically when the user types and the ghost text suggestion is rendered at the bottom of the input field.

# Bug Report: Vertical Scrolling Issues with Ghost Text Suggestions

## Current Issue
The automatic vertical scrolling functionality for ghost text suggestions is not working properly in multiline input fields. When a suggestion appears at or near the bottom of the input field, the field does not automatically scroll to make the suggestion fully visible to the user.

## Required Behavior
Implement proper vertical scrolling with the following specific requirements:

1. **When a suggestion is rendered:** If a ghost text suggestion appears at or near the bottom edge of a multiline input field, the field should automatically scroll vertically to ensure the entire suggestion is visible, maintaining a buffer margin of at least 20px from the bottom edge.

2. **When a suggestion is accepted:** After the user accepts a suggestion (via Tab key or by clicking on it), the input field should automatically scroll to ensure the cursor's new position is fully visible within the viewport.

3. **Smooth scrolling behavior:** All scrolling actions should use smooth animation (approximately 250ms duration) rather than jumping instantly to the new scroll position.

4. **Cross-element compatibility:** This functionality must work consistently across all types of multiline input elements (textareas, contenteditable divs, and rich text editors).

Please ensure this vertical scrolling functionality is properly implemented alongside the existing horizontal scrolling capabilities.
-------------

After the user accepts a suggestion (via Tab key or by clicking on it), the input field should automatically scroll down to ensure the cursor's new position is fully visible within the viewport.

After the user accepts a ghost text suggestion (via Tab key or by clicking on it), the input field should automatically scroll to ensure the cursor's new position is fully visible. This should:

1. Work for both single-line and multiline input fields (including textareas and contentEditable elements)
2. Support both vertical scrolling (when content extends below the visible area) and horizontal scrolling (for single-line inputs with overflow)
3. Use smooth scrolling animation for a polished user experience
4. Maintain proper text flow and prevent any visual jumping or flickering
5. Handle all input types consistently across different websites
6. Ensure the cursor remains visible even when accepting long suggestions that would otherwise push the cursor out of view
7. Prioritize showing the current line where the cursor is positioned before wrapping to subsequent lines