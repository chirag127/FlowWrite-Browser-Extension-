# Changelog

All notable changes to the FlowWrite Browser Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-05-25

### Fixed

-   Fixed issue where suggestion text appears incorrectly positioned above the input field when the page is scrolled down
-   Updated positioning logic to account for window scroll offset when calculating suggestion element placement
-   Improved positioning for both inline and popup suggestions to maintain proper positioning relative to the input field regardless of page scroll position

## [1.0.2] - 2025-05-20

### Added

-   New "Dual" presentation mode that displays suggestions in both inline and popup formats simultaneously
-   Enhanced suggestion handling to support multiple suggestion elements
-   Updated documentation to reflect new features

### Changed

-   Improved suggestion removal logic to handle multiple suggestion elements
-   Updated options page with information about the new dual mode

## [1.0.1] - 2025-05-15

### Added

-   Click-to-accept functionality for popup suggestions
-   Click-to-accept functionality for side panel suggestions
-   Visual feedback (hover effects) for clickable suggestions
-   Explicit cursor pointer styling for all suggestion types
-   Global click handler to ensure clicks are captured reliably
-   Enhanced telemetry to track different interaction types (tab, click, escape)

### Fixed

-   Issue where popup suggestions were not being accepted when clicked
-   Improved z-index values to ensure suggestions are always on top
-   Added proper pointer-events handling to make suggestions clickable

### Changed

-   Updated side panel UI with a dedicated accept button
-   Enhanced debugging logs for better troubleshooting

## [1.0.0] - 2025-05-01

### Added

-   Initial release of FlowWrite Browser Extension
-   AI-powered writing suggestions
-   Multiple presentation modes (inline, popup, side panel)
-   Tab key acceptance of suggestions
-   Escape key dismissal of suggestions
-   Support for various input types (standard inputs, textareas, contentEditable)
-   Special handling for popular web applications (WhatsApp, Discord)
-   Page context extraction for more relevant suggestions
-   Telemetry for suggestion acceptance/rejection
