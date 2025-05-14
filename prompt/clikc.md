Implement a feature that allows users to accept ghost text suggestions by clicking on them directly. This is especially important for web applications where the Tab key doesn't work for accepting suggestions because it triggers the default browser behavior of moving focus to the next element.

Specifically:
1. Add a click event listener to ghost text suggestion elements
2. When a user clicks on a suggestion, it should be accepted and inserted into the text field
3. Ensure this works across all supported input types (standard inputs, textareas, and contentEditable elements)
4. Make sure the click behavior doesn't interfere with normal text selection
5. Add visual feedback (like a subtle highlight) when hovering over suggestions to indicate they are clickable
6. Update any relevant documentation or tooltips to inform users of this new interaction method

This feature should provide an alternative acceptance method that works consistently across all websites, including those where Tab key functionality is already assigned to other actions.