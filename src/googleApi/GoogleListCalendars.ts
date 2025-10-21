import type { GoogleCalendar, GoogleCalendarList } from "./../helper/types";

import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import { callRequest } from "src/helper/RequestWrapper";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { GoogleApiError } from "./GoogleApiError";
import { logError } from "../helper/log";

let cachedCalendars: GoogleCalendar[] = []

/**
 * This function is used to filter calendars based on the user's whitelist
 * @param plugin a reference to the main plugin object
 * @param calendars The list of all possible calendars
 * @returns The filtered list of calendars
 */
function filterCalendarsByWhiteList(plugin: GoogleCalendarPlugin, calendars: GoogleCalendar[]): GoogleCalendar[] {
	// If whitelist is empty, show only the primary calendar by default
	if (plugin.settings.calendarWhiteList.length === 0) {
		return calendars.filter((calendar) => calendar.primary === true);
	}

	// Otherwise, only include calendars that are in the whitelist
	const filteredCalendars = calendars.filter((calendar) => {
		return plugin.settings.calendarWhiteList.some(
			(c) => c[0] == calendar.id
		);
	});
	return filteredCalendars;
}


/**
 * This functions get all google calendars from the user based on their whitelist
 * The function will check if there are already saved calendars if not it will request them from the google API
 * @returns A List of Google Calendars
 */
export async function googleListCalendars(): Promise<GoogleCalendar[]> {

	if (!settingsAreCompleteAndLoggedIn()) {
		throw new GoogleApiError("Not logged in", null, 401, {error: "Not logged in"})
	}

	const plugin = GoogleCalendarPlugin.getInstance();

	if (cachedCalendars.length) {
		//Filter for every request instead of caching the filtered result to allow hot swap settings
		return filterCalendarsByWhiteList(plugin, cachedCalendars);
	}

	// Added a lock to prevent multiple requests at the same time

	const calendarList: GoogleCalendarList = await callRequest(`https://www.googleapis.com/calendar/v3/users/me/calendarList`, "GET", null)

	// Display calendar list like Google Calendar. Primary Cal at the top, and others sorted alphabetically
	cachedCalendars = sortByField(calendarList.items, "summary", "primary");

	const calendars = filterCalendarsByWhiteList(plugin, cachedCalendars);

	return calendars;
}

/**
 * Helper function to sort calendars by field and priorityField
 */
function sortByField<T>(items: T[], field: keyof T, priorityField: keyof T ): T[] {
	return items.sort((a, b) => {
        if (a[priorityField] && !b[priorityField]) {
            return -1;
        } else if (!a[priorityField] && b[priorityField]) {
            return 1;
        }

        const valueA = String(a[field]).toLowerCase();
        const valueB = String(b[field]).toLowerCase();

        if (valueA < valueB) {
            return -1;
        }
        if (valueA > valueB) {
            return 1;
        }

        return 0;
    });
}

export async function listCalendars(): Promise<GoogleCalendar[]> {

	try {
		const calendars = await googleListCalendars();
		return calendars;
	} catch(error) {
		switch (error.status) {
			case 401: break;
			case 999:
				createNotice(error.message)
				break;
			default:
				createNotice("Could not list Google Calendars.");
				logError(error);
				break;
		}
		return [];
	}
}

/**
 * Get all calendars without filtering by whitelist (used for settings UI)
 */
export async function listAllCalendars(): Promise<GoogleCalendar[]> {
	try {
		if (!settingsAreCompleteAndLoggedIn()) {
			return [];
		}

		if (cachedCalendars.length) {
			return cachedCalendars;
		}

		const calendarList: GoogleCalendarList = await callRequest(`https://www.googleapis.com/calendar/v3/users/me/calendarList`, "GET", null)
		cachedCalendars = sortByField(calendarList.items, "summary", "primary");
		return cachedCalendars;
	} catch(error) {
		switch (error.status) {
			case 401: break;
			case 999:
				createNotice(error.message)
				break;
			default:
				createNotice("Could not list Google Calendars.");
				logError(error);
				break;
		}
		return [];
	}
}