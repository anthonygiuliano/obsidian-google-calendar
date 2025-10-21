---
title: Configurable Folder Structure for Meeting Notes
feature: folder-structure-config
status: completed
created: 2025-10-21
completed: 2025-10-21
estimated_hours: 6-8
actual_hours: ~3
priority: medium
tags: [enhancement, settings, note-creation]
---

# Configurable Folder Structure for Meeting Notes

## Overview
Add support for configurable folder structures when creating meeting notes, using custom patterns with moment.js date formatting and calendar-based placeholders. This will allow users to organize their meeting notes hierarchically (e.g., by date, calendar, or custom patterns) rather than using a single flat folder.

## Background
Currently, the plugin supports:
- Basic placeholder system ({{date}}, {{event-title}}, etc.) in `replacePathPlaceholders()` (AutoEventNoteCreator.ts:136)
- Simple date placeholders: {{date}}, {{date-year}}, {{date-month}}, {{date-day}}
- Event-specific placeholders for file names via `eventNoteNameFormat` setting
- Folder specification via `defaultFolder` setting (text field)

Moment.js is already available via Obsidian's API (`window.moment`), so no new dependencies needed.

## User Requirements
- **Approach**: Custom pattern with placeholders
- **Scope**: Global default folder structure (single setting applies to all auto-created notes)
- **Placeholders**: Moment.js date formats + calendar name (filesystem-safe)
- **UI**: Advanced pattern editor with helper documentation

## Goals
1. Support moment.js format strings in folder paths (e.g., `Meetings/{{event:YYYY}}/{{event:MMMM}}`)
2. Add `{{calendar-name}}` placeholder with automatic filesystem sanitization
3. Provide clear UI with pattern examples and documentation
4. Maintain backward compatibility with existing folder settings
5. Keep performance impact minimal (no additional API calls)

---

## Task Breakdown

### Phase 1: Core Placeholder Expansion (2-3 hours)

#### Task 1.1: Extend placeholder replacement function
**File**: `src/helper/AutoEventNoteCreator.ts`
**Location**: `replacePathPlaceholders()` function (Line 136)

**Changes**:
1. Add support for moment.js format patterns in placeholders
   - Syntax: `{{event:FORMAT}}` where FORMAT is any moment.js format string
   - Example: `{{event:YYYY/MM}}` → `2025/10`
   - Parse and extract format string from placeholder
   - Use `window.moment(event.start.dateTime || event.start.date).format(FORMAT)`

2. Add `{{calendar-name}}` placeholder
   - Extract calendar name from event object: `event.organizer?.displayName || event.organizer?.email || 'Default'`
   - Sanitize for filesystem using existing `getFileSuffix()` pattern or new helper
   - Handle edge cases: undefined calendar, special characters, max length

3. Add filesystem sanitization helper
   - Create `sanitizeForFilesystem(text: string): string` function
   - Remove/replace: `< > : " / \ | ? *` and control characters
   - Trim leading/trailing spaces and dots
   - Handle empty results (fallback to "Untitled")
   - Respect OS-specific limits (255 chars for folder names)

**Dependencies**: None
**Testing**: Unit tests with various moment formats, calendar names with special chars

---

#### Task 1.2: Update placeholder documentation
**File**: `src/helper/AutoEventNoteCreator.ts`
**Location**: Add JSDoc comments above `replacePathPlaceholders()`

**Changes**:
1. Document all supported placeholders in function comments
2. Add examples for moment.js format patterns
3. Note filesystem sanitization behavior
4. Link to moment.js format documentation

**Dependencies**: Task 1.1
**Testing**: Code review for clarity

---

### Phase 2: Settings Integration (2-3 hours)

#### Task 2.1: Add new settings to types
**File**: `src/helper/types.ts`
**Location**: `GoogleCalendarPluginSettings` interface

**Changes**:
1. Add `eventNoteFolderPattern: string` - Default: empty (uses existing `defaultFolder`)
2. Consider deprecation path for `defaultFolder` or merge behavior
   - If `eventNoteFolderPattern` is set, use it; otherwise fall back to `defaultFolder`

**Dependencies**: None
**Testing**: TypeScript compilation

---

#### Task 2.2: Add default settings
**File**: `src/GoogleCalendarPlugin.ts`
**Location**: `DEFAULT_SETTINGS` constant (Line 40)

**Changes**:
1. Add `eventNoteFolderPattern: ""` to defaults
2. Document that empty string means use `defaultFolder` for backward compatibility

**Dependencies**: Task 2.1
**Testing**: Plugin loads with new defaults

---

#### Task 2.3: Create advanced settings UI
**File**: `src/view/GoogleCalendarSettingTab.ts`
**Location**: `display()` method, after existing folder settings (around Line 358-404)

**Changes**:
1. Add new setting section: "Advanced Folder Structure"
2. Add text input for `eventNoteFolderPattern` with monospace font
3. Add description with:
   - Explanation of placeholder system
   - Common examples (see below)
   - Link to moment.js formats: https://momentjs.com/docs/#/displaying/format/
   - Note about filesystem sanitization
4. Add helper text showing available placeholders:
   ```
   Available placeholders:
   - {{event:FORMAT}} - Event date with moment.js format
   - {{calendar-name}} - Calendar name (sanitized)
   - {{event-title}} - Event title (sanitized)
   - Legacy: {{date}}, {{event-date}}, {{event-year}}, {{event-month}}, {{event-day}}

   Examples:
   - Meetings/{{event:YYYY}}/{{event:MM-MMMM}}
   - {{calendar-name}}/{{event:YYYY}}/Q{{event:Q}}
   - Notes/{{event:YYYY/MM/DD}}
   ```

**Dependencies**: Task 2.1, 2.2
**Testing**: UI renders correctly, saves settings, examples are clear

---

### Phase 3: Integration & Logic Updates (1-2 hours)

#### Task 3.1: Update folder path resolution
**File**: `src/helper/AutoEventNoteCreator.ts`
**Location**: `getEventNoteFilePath()` function (Line 187)

**Changes**:
1. Check if `eventNoteFolderPattern` is set in settings
2. If set, use it as the folder path (after placeholder replacement)
3. If not set, fall back to existing `folderName` parameter or `defaultFolder`
4. Pass event object to `replacePathPlaceholders()` to access calendar info
5. Ensure folder creation logic handles nested paths correctly (already does via `adapter.mkdir()`)

**Dependencies**: Task 1.1, 2.1, 2.2
**Testing**: Various folder patterns create correct paths

---

#### Task 3.2: Update function signatures
**File**: `src/helper/AutoEventNoteCreator.ts`
**Location**: `replacePathPlaceholders()` (Line 136)

**Changes**:
1. Add `event` parameter to function signature to access calendar name
2. Update all callsites to pass event object
3. Ensure null/undefined event is handled gracefully (use fallbacks)

**Dependencies**: Task 1.1
**Testing**: All existing placeholder replacements still work

---

### Phase 4: Testing & Documentation (1 hour)

#### Task 4.1: Manual testing scenarios
**Test Cases**:
1. ✓ Empty pattern → falls back to defaultFolder
2. ✓ Simple pattern: `Meetings/{{event:YYYY}}`
3. ✓ Complex pattern: `{{calendar-name}}/{{event:YYYY}}/{{event:MM-MMMM}}/{{event:DD-dddd}}`
4. ✓ Special characters in calendar name get sanitized
5. ✓ Invalid moment format shows error or defaults gracefully
6. ✓ Nested folders created automatically
7. ✓ Backward compatibility: existing `defaultFolder` still works
8. ✓ Per-event folder override (via `:obsidian:folder:` marker) still works

**Dependencies**: All previous tasks
**Testing**: Create test events with various calendar names and dates

---

#### Task 4.2: Update user documentation
**File**: `documentation/content/EventNotes/EventNote.md`

**Changes**:
1. Add section on "Folder Structure Configuration"
2. Explain placeholder system with examples
3. Document moment.js format support
4. Add troubleshooting for common issues (invalid characters, long paths)
5. Note backward compatibility with `defaultFolder`

**Dependencies**: All previous tasks
**Testing**: Documentation is clear and accurate

---

## Success Criteria

- [x] Users can set folder pattern like `Meetings/{{event:YYYY}}/{{event:MM}}` in settings
- [x] Moment.js format strings work correctly for event dates
- [x] `{{calendar-name}}` placeholder inserts sanitized calendar name
- [x] Filesystem-unsafe characters are automatically removed/replaced
- [x] Existing `defaultFolder` setting continues to work (backward compatibility)
- [x] UI provides clear examples and documentation
- [x] Nested folders are created automatically as needed
- [x] No performance regression in note creation
- [x] Documentation updated with new feature

## Implementation Completed

All phases have been successfully implemented on 2025-10-21. See execution report below.

---

## Technical Considerations

### Moment.js Integration
- Obsidian exposes moment.js via `window.moment` globally
- No need to import or add dependencies
- Type definition available: `import type moment from "moment"`
- Already used in codebase (see `DailyNoteHelper.ts:2`, `YearView.svelte:190`)

### Filesystem Safety
- Different OSes have different restrictions (Windows vs macOS/Linux)
- Obsidian's vault handles most edge cases, but explicit sanitization is safer
- Consider max path length (typically 260 chars on Windows, 1024 on Unix)
- Folder names cannot end with spaces or periods on Windows

### Backward Compatibility
- Existing users have `defaultFolder` set → must continue working
- Solution: Only use `eventNoteFolderPattern` if non-empty
- Migration: Don't auto-migrate; let users opt-in

### Performance
- Placeholder replacement happens once per note creation (acceptable)
- Moment.js formatting is fast (microseconds)
- No additional API calls needed (event object already has all data)

---

## Edge Cases to Handle

1. **Empty calendar name**: Fallback to "Default" or "Untitled"
2. **Very long folder paths**: Truncate or warn if > 200 chars
3. **Invalid moment format**: Show error in console, use fallback (YYYY-MM-DD)
4. **Duplicate folder separators**: Clean up `//` → `/`
5. **Relative paths**: Ensure all paths are relative to vault root
6. **Per-event override conflict**: Per-event folder (via marker) should override global pattern
7. **All-day events**: `event.start.date` vs `event.start.dateTime` handling

---

## Future Enhancements (Out of Scope)

- Multiple preset patterns (dropdown selection)
- Per-calendar folder pattern overrides
- Visual folder preview in settings
- Pattern validation in UI (real-time feedback)
- Support for more placeholders (attendees, event duration, location)
- Import/export folder pattern presets

---

## Estimated Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Placeholder expansion (1.1, 1.2) | 2-3 hours |
| Phase 2 | Settings integration (2.1, 2.2, 2.3) | 2-3 hours |
| Phase 3 | Integration & logic (3.1, 3.2) | 1-2 hours |
| Phase 4 | Testing & docs (4.1, 4.2) | 1 hour |
| **Total** | | **6-8 hours** |

---

## Risk Assessment

**Low Risk**:
- Well-isolated changes (mainly in AutoEventNoteCreator.ts)
- Backward compatible (opt-in feature)
- No external dependencies needed
- Moment.js already available and stable

**Medium Risk**:
- Filesystem sanitization edge cases across OSes
- User confusion if pattern is invalid (needs good error messages)

**Mitigation**:
- Comprehensive testing on Windows/macOS/Linux
- Clear error messages with examples
- Fallback to simple folder if pattern fails

---

## Related Files

- `src/helper/AutoEventNoteCreator.ts` - Core note creation logic
- `src/helper/types.ts` - Settings type definitions
- `src/GoogleCalendarPlugin.ts` - Default settings
- `src/view/GoogleCalendarSettingTab.ts` - Settings UI
- `documentation/content/EventNotes/EventNote.md` - User documentation

---

## Questions for Review

- Should we deprecate `defaultFolder` in favor of `eventNoteFolderPattern`? Or keep both?
  - **Recommendation**: Keep both for backward compatibility, use pattern if set
- Should invalid moment formats fail silently or show a notice?
  - **Recommendation**: Log error to console, use fallback format (YYYY-MM-DD)
- Should we add a "test pattern" button in settings to preview folder structure?
  - **Recommendation**: Out of scope for v1, add to future enhancements
