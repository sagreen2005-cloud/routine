# Shift Command Modular

Upload every file and folder in this ZIP to the root of an empty GitHub repository.

Required root structure:

- index.html
- manifest.json
- service-worker.js
- README.md
- css/
- js/
- icons/

Enable GitHub Pages under Settings > Pages > Deploy from a branch > main > /root.

The application uses plain HTML, CSS, and JavaScript. No npm or build tools are required.

## Module layout

- `js/config.js` — schedule, checklist, and default workouts
- `js/database.js` — IndexedDB
- `js/dashboard.js` — Today dashboard
- `js/readiness.js` — readiness calculation
- `js/sleep.js` — sleep logging
- `js/nutrition.js` — protein, water, and caffeine
- `js/workouts.js` — daily workouts and imports
- `js/health.js` — weight, body composition, mood, and energy
- `js/medications.js` — medications, supplements, TRT, and GLP-1
- `js/trends.js` — charts and averages
- `js/backup.js` — backup and restore
- `js/security.js` — six-digit PIN
- `js/notifications.js` — notification permission
- `js/navigation.js` — page navigation
- `js/app.js` — startup and refresh coordination


## Schedule features

The Settings/More menu now includes **Schedule**.

You can:
- Set the normal status and shift hours for every weekday
- Configure workday and off-day sleep routines
- Change workout time, commute, sleep target, and caffeine cutoff
- Add vacation, sick, training, overtime, holiday, off-day, and custom-shift exceptions
- Add multi-day vacation ranges
- Create a temporary weekly schedule for a specified date range
- Automatically return to the normal weekly schedule after the temporary schedule expires

Schedule priority:
1. Specific-date or date-range exception
2. Temporary schedule
3. Regular weekly schedule


## Importing workout programs

Open **Workout → Workout program → Import program JSON**.

Accepted JSON formats:

```json
{
  "program": {
    "name": "Program name",
    "duration_weeks": 8,
    "phases": []
  }
}
```

The outer `program` property is optional. Each phase must include a `weeks` array and a `workouts` array. Each workout must include an `exercises` array, and each exercise must have a `name`.

Importing another program resets the current week and unfinished workout. Completed workout history remains. The active program is stored locally and is included in Routine backups.
