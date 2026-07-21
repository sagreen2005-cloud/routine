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
