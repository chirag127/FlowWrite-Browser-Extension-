Sometimes the ghost text suggestions are not visible at all because they are positioned outside the viewable region of the window. This creates a confusing user experience where users can still interact with these invisible suggestions via the 'Tab' key but cannot see them. This issue specifically occurs in two scenarios:

1. When the input field is multiline (like a textarea) and horizontal scrolling is not possible or enabled on that element
2. When the input field is a textarea with fixed dimensions that doesn't automatically expand to show all content

Please implement a solution that ensures ghost text suggestions are always visible within the boundaries of the input field, even in these specific scenarios. The solution should either reposition the suggestions to be visible or adjust the scrolling behavior of the container element.

Use sequential thinking


# Ghost Text Visibility Issue in Multiline and Fixed-Dimension Input Fields

## Problem Description
In the FlowWrite browser extension, ghost text suggestions sometimes become completely invisible to users when they appear outside the viewable region of input fields. This creates a confusing user experience where users can still interact with these invisible suggestions using the Tab key but cannot visually see what they're accepting.

This issue specifically occurs in two scenarios:
1. When the input field is multiline (like a textarea) and text wraps to new lines, causing the ghost text to appear outside the horizontal boundaries
2. When the input field has fixed dimensions with overflow settings that don't show scrollbars or automatically expand to accommodate all content

## Required Solution
Implement a comprehensive solution that ensures ghost text suggestions are always visible within the viewable boundaries of input fields by:

1. For multiline textareas:
   - Detect when a suggestion would appear outside the visible area
   - Either reposition the ghost text to appear at the beginning of the next line
   - Or implement appropriate scrolling to make the suggestion visible

2. For fixed-dimension textareas:
   - Calculate the visible boundaries of the textarea
   - Ensure the ghost text is positioned within these boundaries
   - If necessary, adjust the scrolling position of the textarea to make the suggestion visible
   - Consider adding visual indicators when scrolling occurs to help users understand what happened

3. Add validation checks to:
   - Verify ghost text visibility after positioning
   - Implement fallback positioning strategies if the primary approach fails
   - Log detailed information about positioning decisions for debugging

The solution must work consistently across different websites and maintain the existing functionality for standard input fields.

Use sequential thinking MCP server. 