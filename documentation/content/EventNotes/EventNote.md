---
title: Eventnote
---

An "Eventnote" is a note that is directly linked to an Google event.
This connection is achieved by the existence of the `event-id` value in frontmatter of the note.

Example:

~~~md title="Eventnote example"
---
event-id: 1234567890ABCDEF
---

# My note title

My note content
~~~

## Features

Event notes have some advantages over normal notes:

- The event note can be opened from the [[EventDetailsView]]
- You can insert event details as plaintext. See [[EventDataInsertion]] for more information.
- You can update the linked Google Event with the frontmatter of the note. See [[EventFrontmatter]] for more information.

## Create Eventnote

There are multiple options to create an Eventnote:

- manually create a note and add the `event-id` frontmatter with the id of the event you want to link
- Use the `Create EventNote` button in the [[EventDetailsView]]
- Use the [[AutoImport]] feature to automatically create Eventnotes for all events in your calendar

### Templates

To configure the content that is inserted, when the Eventnote is created, you can use a template file.
The plugin supports the core template and the [Templater](https://github.com/SilentVoid13/Templater) plugin.

To insert event details into the note you the following syntax:

~~~md
{{gEvent.propertyName}}
~~~

All [properties of the Google Calendar Event](https://github.com/YukiGasai/obsidian-google-calendar/blob/0518e3f6f1943645ecf9bfc747e046ab9d92b871/src/suggest/GoogleEventSuggestionList.ts#L121C1-L246) can be used.

Example:

~~~md title="Template example"
# My note title
{{gEvent.description}}

My note content
~~~

To create more complex templates I recommend using the  [Templater](https://github.com/SilentVoid13/Templater) plugin.
You can use the same syntax as above to insert event details into the template and can use all the features of the Templater plugin.
This allows you to, for example format the dates.
This is possible, because the event details are resolved before templater is run.

~~~md title="Templater example"
---
type: event
location: "{{gEvent.location}}"
MOCs:
  - "[[Events MOC]]"
  - "[[<% window.moment('{{gEvent.start.date}}' != '' ? '{{gEvent.start.date}}' : '{{gEvent.start.dateTime}}').format('YYYY-MM-DD-dddd') %>]]"
---
<% await tp.file.move("/Extras/Events/" + window.moment('{{gEvent.start.date}}' != '' ? '{{gEvent.start.date}}' : '{{gEvent.start.dateTime}}').format('YYYY-MM-DD') + " " + tp.file.title) %>
# [[<% window.moment('{{gEvent.start.date}}' != '' ? '{{gEvent.start.date}}' : '{{gEvent.start.dateTime}}').format('YYYY-MM-DD') + " " + tp.file.title %>]]
{{gEvent.description}}

Note content
~~~

If you need even more complex templates you can use the [[ObsidianGoogleCalendarAPI | Obsidian Google Calendar API]] with [Templater](https://github.com/SilentVoid13/Templater).

### Options

Inside the [[PluginOptions | Plugin Options]] you can configure a default template to use for all Eventnotes as well as a default location. If you don't configure defaults, the plugin will ask you for a template and location every time you create an Eventnote.

![setting for the default template](./settingSelectTemplate.png)
The setting for the default template.

![The popup to select a template when creating an Eventnote](./popUpSelectTemplate.png)
The popup to select a template when creating an Eventnote.

## Folder Structure Configuration

You can configure a custom folder structure for automatically created event notes using the **Advanced Folder Structure** setting. This allows you to organize your meeting notes hierarchically based on dates, calendar names, or custom patterns.

### Available Placeholders

The folder pattern supports the following placeholders:

**Current Date/Time:**
- `{{date}}` - Current date (YYYY-MM-DD)
- `{{date-year}}`, `{{date-month}}`, `{{date-day}}`
- `{{date-hour}}`, `{{date-hour24}}`, `{{date-minute}}`

**Event-Based:**
- `{{event-date}}` - Event date (YYYY-MM-DD)
- `{{event-year}}`, `{{event-month}}`, `{{event-day}}`
- `{{event-title}}` - Event title (sanitized for filesystem)
- `{{calendar-name}}` - Calendar name from organizer (sanitized)
- `{{event-start-hour}}`, `{{event-start-hour24}}`, `{{event-start-minute}}`
- `{{event-end-hour}}`, `{{event-end-hour24}}`, `{{event-end-minute}}`

**Custom Moment.js Formats:**
- `{{FORMAT}}` - Any [moment.js format](https://momentjs.com/docs/#/displaying/format/) for the event date
  - Examples: `{{YYYY}}`, `{{MMMM}}`, `{{YYYY-MM-DD}}`, `{{Q}}`, `{{dddd}}`
  - Note: You can also use `{{event:FORMAT}}` syntax if preferred

**Other:**
- `{{prefix}}` - Optional note prefix from settings

### Example Patterns

**By Calendar and Year/Month:**
```
{{calendar-name}}/{{YYYY}}/{{MM-MMMM}}
```
Result: `Work/2025/10-October/`

**Simple Date Hierarchy:**
```
Meetings/{{YYYY}}/{{MM}}/{{DD}}
```
Result: `Meetings/2025/10/21/`

**Daily Inbox with Day Name:**
```
_Inbox/daily/{{YYYY-MM-DD-dd}}
```
Result: `_Inbox/daily/2025-10-21-Mon/`

**By Quarter:**
```
Events/{{YYYY}}/Q{{Q}}
```
Result: `Events/2025/Q4/`

**Complex Pattern:**
```
{{calendar-name}}/{{YYYY}}/{{MMMM}}/Week-{{W}}
```
Result: `Work/2025/October/Week-43/`

### Filesystem Safety

All placeholders that insert text (like `{{calendar-name}}` and `{{event-title}}`) are automatically sanitized to ensure filesystem safety:

- Invalid characters are removed: `< > : " / \ | ? *`
- Control characters are removed
- Leading/trailing spaces and dots are trimmed
- Maximum length of 255 characters per folder segment
- Empty values default to "Untitled"

### Backward Compatibility

If you leave the **Advanced Folder Structure** setting empty, the plugin will use the existing **Default Folder** setting, maintaining backward compatibility with previous configurations.

### Troubleshooting

**Long paths:** If your pattern creates very long paths (>200 characters), consider using shorter placeholders or abbreviations.

**Invalid moment.js formats:** If you use an invalid moment.js format string, the plugin will log an error to the console and use a fallback format (YYYY-MM-DD).

**Special characters:** Calendar names and event titles with special characters are automatically sanitized. If you need to preserve specific formatting, consider using simpler placeholders.
