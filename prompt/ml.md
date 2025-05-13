Ensure ghost text suggestions remain visible within the boundaries of input fields by implementing proper positioning and scrolling logic. Currently, suggestions sometimes appear outside the viewable region, creating a confusing experience where users can interact with invisible suggestions via the 'Tab' key but cannot see them. This issue specifically occurs in:

1. Multiline input fields (like textareas) where horizontal scrolling is limited or disabled
2. Input fields with fixed dimensions that don't automatically expand to accommodate content
3. Situations where the cursor is positioned near the right edge of the input field

Implement the following solutions:
1. Calculate the visible boundaries of the input field before rendering ghost text
2. If a suggestion would extend beyond the visible area, either:
   a. Automatically scroll the input field to make the suggestion visible, or
   b. Move the suggestion to the next line to fit within the visible area after scrolling
3. Test the implementation across various input field types and sizes to ensure consistent behavior

This enhancement should work with the existing ghost text rendering system while ensuring suggestions are always visible to users regardless of cursor position or input field constraints. it is very important that the suggestion should be rendered after the cursor position.