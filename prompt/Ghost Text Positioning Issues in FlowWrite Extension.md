
**Bug Report: Ghost Text Positioning Issues in FlowWrite Extension**

There are three critical issues with the ghost text suggestions in the FlowWrite browser extension:

1. **Incorrect Positioning After Acceptance**: After accepting a suggestion for the first time, subsequent ghost text suggestions no longer appear directly after the cursor position (caret). Instead, they appear at the end of the previously accepted suggestion text, which is incorrect behavior.

2. **Visibility Problem - Text Scrolling Off-Screen**: Sometimes the ghost text suggestions scroll off to the right side of the input field and become invisible to the user. This happens because the text is not properly scrolling to keep the suggestions within the visible area of the input field.

3. Sometimes the ghost text suggestions are not visible at all, as they are positioned outside the viewable region of the window, making it impossible for the user to see but interact with them via the 'Tab' key. this issues is 

Please fix these issues by ensuring that:
- Ghost text suggestions always appear immediately after the current cursor position, even after accepting previous suggestions
- The input field automatically scrolls horizontally when needed to keep new ghost text suggestions visible within the viewport
- The cursor position is correctly maintained after text acceptance to allow for proper placement of subsequent suggestions