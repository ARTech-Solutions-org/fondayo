# Foundayo LED wall

From this folder, run `npm start` with Node.js 22 or newer for the local installation. It uses the supplied design assets and fonts. Keep the terminal running during the event.

The console prints a local URL and the computer’s network addresses. Open `http://localhost:8080` on the host for the installation menu. On tablets and separate display computers, use the host’s Wi-Fi or Ethernet address in place of `localhost`, with all devices on the same local network.

| Device | Route | Native canvas |
| --- | --- | --- |
| Audience tablets | `/tablet/1`, `/tablet/2`, … | Responsive |
| One processor taking the unfolded wall | `/wall` | 4864 × 1536 |
| Left display | `/screen/1` | 1536 × 1536 |
| Center display | `/screen/2` | 1792 × 1536 |
| Right display | `/screen/3` | 1536 × 1536 |
| Display settings | `/settings` | Scene and tablet routing, comment duration |

For a combined output, map the left panel to pixels 0–1535, the center panel to 1536–3327, and the right panel to 3328–4863. Match the display output resolution to the native canvas and put the browser in full-screen mode. The previews preserve the panel proportions at smaller viewport sizes.

In `/settings`, assign each of the six numbered scenes to the left, center, or right LED. Set the number of tablets from 1 to 24 and choose a scene for each tablet. Multiple scenes can use the same LED, and multiple tablets can submit to the same scene.

After saving, open the matching numbered URL on each physical tablet using the host computer's network address. The original `/tablet` URL opens tablet 1. A fixed LED offers its two post scenes: left 1 or 4, center 2 or 5, and right 3 or 6. Random LED picks an available enabled LED and one of its enabled scenes for each comment. **Follow scene LED** uses the output assigned to the selected scene as its preference. In every routing mode, a comment stays on the scene assigned when it was submitted.

All outputs share one playback timeline. In idle, the left LED cycles through screensaver 1, post 1, and post 4. The center cycles through screensaver 2, post 2, and post 5. The right cycles through screensaver 3, post 3, and post 6. The first tablet to start typing selects a group of three posts. The wall holds that group while anyone is writing and for the configured hold time after the latest comment shrinks. Every output then restarts its idle loop at the screensaver. Retained comments appear again on that LED's post slides. The individual `/screen/1`, `/screen/2`, and `/screen/3` pages share this timeline with `/wall`.

Use **LED outputs** to enable or disable each physical display, select its screensaver or black idle, and override the default comment limit. Disabling an LED blacks out its browser output and stops its queued pop-ups. Already compact comments reappear when the LED is enabled. **Accept new comments** pauses submissions across all tablets.

Set **Post size** and **Post border** for each LED. The border reserves a strip of visible background around the post, clear of cards and decorations. Set it to 0% to remove that strip. A wide border can reduce the space available for the post and cards while preserving the logo and footer.

Use **Idle rotation** to set how long the screensavers and each group of posts appear on all three LEDs. The crossfade starts at the boundary between slides and blends the artwork while the logos and footer remain in place.

Use **Playback and submissions** to set the timeout for inactive drafts, the pop-up and post-group hold times, and the default small-comment limit. A fixed LED keeps its comments on the same output and replaces the oldest there when the LED is full. The other routing modes can use any enabled LED with room. If all available LEDs are full, the new comment replaces the oldest there when it shrinks. **Animation and appearance** controls the wall-wide blur during a pop-up, the post artwork motion, and whether original and saved tablet comments slide out from behind the post when their scene appears.

The five original comment cards stay visible during each comment scene. Audience comments shrink into cards that use the scene's original frame, shadow, heart, width and single-line height. The frame grows with each additional line. Compact cards stay beside the post between its top and bottom edges. The latest comments get priority when fewer cards fit than the configured limit.

In **Tablet comments**, use **Refresh comments** to load the latest list, then **Delete** next to a queued or retained comment to remove it from the wall. For a Neon-backed installation, enter the **Settings access key** before deleting. Set `FONDAYO_ADMIN_TOKEN` in `.env.local` if the installation computer connects directly to Neon.

Settings and retained comments persist locally across server restarts.

## Tablet fullscreen

Tap the Foundayo logo to toggle fullscreen in browsers that support it. On iPad, if the browser blocks fullscreen, open the numbered tablet link in Safari and choose **Share → Add to Home Screen**. Turn on **Open as Web App** if Safari offers it, then launch the tablet from its new Home Screen icon. Each icon keeps the tablet link it was created from.

## Deploy to Vercel

1. Run `npx vercel` from this folder to set up a preview project, or import a Git repository with this folder as its root. Keep the framework preset as **Other**. `vercel.json` sets the build command and output directory.
2. Connect the project to Neon through the Vercel Marketplace. The integration supplies `DATABASE_URL`. Use a database region close to the Vercel Function region.
3. Add a strong, private `FONDAYO_ADMIN_TOKEN` in Vercel's Environment Variables for each deployment environment that will save settings. Enter this value in **Settings access key** on `/settings` when saving.
4. Deploy and use the deployed URL with the existing paths in the table above. The function creates its wall-state table on first use. Point previews and production at separate database branches if they should operate independently.

`npm install` installs the deployment dependency. `npm run build` generates the static output in `dist/`, including the supplied designs and fonts. Hosted displays synchronize through the shared database; the local installation keeps its direct event stream.

A new hosted database starts with the app defaults. To use the same database from the installation computer, put its connection string in `DATABASE_URL` in `.env.local` and run `npm start`. If this is the first connection to an empty wall database, the local server uses the installation's existing settings and retained comments to initialize it. Local settings, comments and environment files are excluded from uploads.

- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)
- [Neon on Vercel](https://vercel.com/marketplace/neon/neon)
