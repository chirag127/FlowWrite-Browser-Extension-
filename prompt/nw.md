implement a new feature that allows users to accept the next word suggestion with a keyboard shortcut ctrl + right arrow.

Implement a new keyboard shortcut feature in the FlowWrite browser extension that allows users to accept ghost text suggestions by pressing Ctrl + Right Arrow. This should:

1. Add an event listener for the Ctrl + Right Arrow key combination across all supported input types (standard input fields, textareas, and ContentEditable divs)
2. When triggered, accept only the next word of the current ghost text suggestion (not the entire suggestion)
3. Ensure this works consistently with both inline and popup suggestion formats
4. Add this new shortcut to the extension's documentation/settings page
5. Make sure this doesn't conflict with existing website keyboard shortcuts
6. Implement proper handling for cursor positioning after accepting the partial suggestion
7. Ensure compatibility with the existing Tab key and click acceptance methods