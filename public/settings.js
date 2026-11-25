import { postImage } from './scenes.js';

const ledNames = ['Left LED', 'Center LED', 'Right LED'];
const sceneNames = Array.from({ length: 6 }, (_, index) => `Scene ${index + 1}`);
const saverNames = ['Black when idle', 'Screensaver 1', 'Screensaver 2', 'Screensaver 3'];
const checked = value => value ? ' checked' : '';

function options(labels, selected, first = 1) {
  return labels.map((label, index) =>
    `<option value="${index + first}"${index + first === selected ? ' selected' : ''}>${label}</option>`).join('');
}

function section(title, content) {
  return `<section class="settings-section"><h2>${title}</h2>${content}</section>`;
}

export async function showSettings(app, logo) {
  app.className = 'home settings';
  app.innerHTML = `
    ${logo}
    <h1>Display settings</h1>
    <form class="settings-form">
      <fieldset class="settings-controls" disabled>
        ${section('LED outputs', `
          <p>Turning off an LED makes it black and stops its queued pop-ups. Its saved comments return when the LED is enabled.</p>
          <p>Idle playback is synchronized: screensavers, posts 1–3, then posts 4–6.</p>
          <div class="scene-options" id="displays"></div>`)}
        ${section('Idle rotation', `
          <div class="settings-grid">
            <label>Time on screensavers
              <span><input name="idleSlideTime" type="number" inputmode="decimal" min="3" max="60" step="0.5" required> seconds</span>
            </label>
            <label>Time on posts 1–3
              <span><input name="idleFirstPostTime" type="number" inputmode="decimal" min="3" max="60" step="0.5" required> seconds</span>
            </label>
            <label>Time on posts 4–6
              <span><input name="idleSecondPostTime" type="number" inputmode="decimal" min="3" max="60" step="0.5" required> seconds</span>
            </label>
            <label>Crossfade duration
              <span><input name="idleFadeTime" type="number" inputmode="decimal" min="0" max="2.5" step="0.05" required> seconds</span>
            </label>
          </div>
          <p>All three LEDs use these timings. Set the crossfade to 0 for an instant switch.</p>`)}
        ${section('Scenes and default comment routing', '<div class="scene-options" id="scene-routes"></div>')}
        ${section('Tablets', `
          <div class="settings-field">
            <label for="tablet-count">Number of tablets</label>
            <input id="tablet-count" type="number" inputmode="numeric" min="1" step="1" required>
          </div>
          <p>The first tablet to start writing selects the post group for the whole wall. Choose a fixed LED, follow the scene, or select a random enabled LED for each send.</p>
          <div class="tablet-options" id="tablet-routes"></div>`)}
        ${section('Playback and submissions', `
          <label class="settings-toggle"><input type="checkbox" name="accepting"> Accept new comments</label>
          <div class="settings-grid">
            <label>Return after no typing
              <span><input name="writingTimeout" type="number" inputmode="numeric" min="10" max="180" step="1" required> seconds</span>
            </label>
            <label>Large comment time
              <span><input name="spotlight" type="number" inputmode="decimal" min="1.5" max="10" step="0.05" required> seconds</span>
            </label>
            <label>Hold post group after shrinking
              <span><input name="duration" type="number" inputmode="decimal" required> seconds</span>
            </label>
            <label>Default small-comment limit per LED
              <span><input name="commentLimit" type="number" inputmode="numeric" min="1" step="1" required></span>
            </label>
            <label>Delay before first appearance
              <span><input name="leadTime" type="number" inputmode="decimal" min="0" max="10" step="0.05" required> seconds</span>
            </label>
            <label>Gap between comments on one LED
              <span><input name="gap" type="number" inputmode="decimal" min="0" max="10" step="0.05" required> seconds</span>
            </label>
          </div>
          <p>Comments stay saved until a newer comment replaces the oldest at that LED's limit.</p>`)}
        ${section('Animation and appearance', `
          <div class="settings-grid">
            <label>LED comment entrance
              <select name="wallMotion">
                <option value="impact">Impact pop-up</option><option value="gentle">Gentle rise</option><option value="off">Instant</option>
              </select>
            </label>
            <label>Whole wall during a pop-up
              <select name="liveBackdrop">
                <option value="softened">Blur and dim</option><option value="visible">Keep visible</option><option value="hidden">Hide scene artwork</option>
              </select>
            </label>
          </div>
          <label class="settings-toggle"><input type="checkbox" name="tabletMotion"> Fly comment out of the tablet</label>
          <label class="settings-toggle"><input type="checkbox" name="storyMotion"> Reveal original comments from behind the post</label>
          <label class="settings-toggle"><input type="checkbox" name="sceneMotion"> Animate post artwork during comments</label>`)}
      </fieldset>
      <div class="settings-save">
        <label class="settings-key" hidden>Settings access key
          <input name="accessKey" type="password" autocomplete="off" disabled>
        </label>
        <button type="submit" disabled>Save settings</button>
        <p class="settings-status" role="status">Loading settings…</p>
      </div>
    </form>
    <a href="/">Back to installation controls</a>`;

  const form = app.querySelector('form');
  const controls = form.querySelector('fieldset');
  const count = form.querySelector('#tablet-count');
  const leds = form.querySelector('#displays');
  const scenes = form.querySelector('#scene-routes');
  const tablets = form.querySelector('#tablet-routes');
  const save = form.querySelector('button');
  const status = form.querySelector('[role="status"]');
  let config;
  let savedCount;

  function setBusy(value) {
    controls.disabled = value;
    save.disabled = value;
  }

  function report(message, error = false) {
    status.textContent = message;
    status.classList.toggle('error', error);
  }

  function updateDestinations() {
    tablets.querySelectorAll('.tablet-destination').forEach((element, index) => {
      const scene = config.sceneByTablet[index] - 1;
      const target = config.panelByTablet[index] || config.panelByScene[scene];
      const panel = target - 1;
      if (config.tabletEnabled[index] === false) element.textContent = 'Tablet disabled';
      else if (!config.sceneEnabled[scene]) element.textContent = 'Scene disabled';
      else if (target === 4) element.textContent = 'Random enabled LED';
      else if (!config.displays[panel].enabled) element.textContent = `${ledNames[panel]} disabled`;
      else element.textContent = ledNames[panel];
    });
  }

  function renderTablets() {
    if (!count.validity.valid) return;
    tablets.innerHTML = Array.from({ length: count.valueAsNumber }, (_, index) => {
      const id = index + 1;
      config.sceneByTablet[index] ??= index % sceneNames.length + 1;
      config.panelByTablet[index] ??= 0;
      config.tabletEnabled[index] ??= true;
      return `<div class="tablet-choice">
        <label class="settings-toggle"><input type="checkbox" data-field="tabletEnabled" data-index="${index}" aria-label="Enable tablet ${id}"${checked(config.tabletEnabled[index])}> Tablet ${id}</label>
        <select aria-label="Tablet ${id} scene" data-field="sceneByTablet" data-index="${index}">${options(sceneNames, config.sceneByTablet[index])}</select>
        <select aria-label="Tablet ${id} LED" data-field="panelByTablet" data-index="${index}">${options(['Follow scene LED', ...ledNames, 'Random LED'], config.panelByTablet[index], 0)}</select>
        <span class="tablet-destination"></span>
        ${id <= savedCount ? `<a href="/tablet/${id}" target="_blank" rel="noopener">/tablet/${id}</a>` : '<span class="tablet-link-pending">Link after saving</span>'}
      </div>`;
    }).join('');
    updateDestinations();
  }

  try {
    const response = await fetch('/api/settings', { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error();
    config = await response.json();
    if (config.adminRequired) {
      const accessKey = form.elements.accessKey;
      accessKey.closest('label').hidden = false;
      accessKey.disabled = false;
      accessKey.required = true;
    }
    const duration = form.elements.duration;
    duration.min = config.min;
    duration.max = config.max;
    duration.step = config.step;
    form.elements.commentLimit.max = config.maxComments;
    for (const key of ['duration', 'spotlight', 'commentLimit', 'idleSlideTime', 'idleFadeTime', 'writingTimeout', 'leadTime', 'gap', 'wallMotion', 'liveBackdrop']) {
      form.elements[key].value = config[key];
    }
    for (const key of ['idleFirstPostTime', 'idleSecondPostTime']) {
      form.elements[key].value = config[key] ?? config.idleSlideTime;
    }
    for (const key of ['accepting', 'tabletMotion', 'sceneMotion', 'storyMotion']) form.elements[key].checked = config[key];
    savedCount = config.sceneByTablet.length;
    count.max = config.maxTablets;
    count.value = savedCount;
    const limitLabels = ['Default comment limit', ...Array.from({ length: config.maxComments }, (_, index) => `${index + 1} comments`)];
    leds.innerHTML = config.displays.map(({ enabled, saver, limit = 0 }, index) => `
      <div class="led-choice">
        <label class="settings-toggle"><input type="checkbox" data-led="enabled" data-index="${index}" aria-label="Enable ${ledNames[index]}"${checked(enabled)}> ${ledNames[index]}</label>
        <select aria-label="${ledNames[index]} screensaver" data-led="saver" data-index="${index}">${options(saverNames, saver, 0)}</select>
        <select aria-label="${ledNames[index]} comment limit" data-led="limit" data-index="${index}">${options(limitLabels, limit, 0)}</select>
        <a href="/screen/${index + 1}" target="_blank" rel="noopener">Open output</a>
      </div>`).join('');
    scenes.innerHTML = sceneNames.map((name, index) => `
      <div class="scene-choice">
        <img src="${postImage(index + 1)}" alt="">
        <div>
          <label class="settings-toggle"><input type="checkbox" data-field="sceneEnabled" data-index="${index}" aria-label="Enable ${name}"${checked(config.sceneEnabled[index])}> ${name}</label>
          <select aria-label="${name} LED" data-field="panelByScene" data-index="${index}">${options(ledNames, config.panelByScene[index])}</select>
        </div>
      </div>`).join('');
    setBusy(false);
    report('');
    renderTablets();
  } catch {
    report('Could not load settings. Reload this page to try again.', true);
    return;
  }

  count.addEventListener('input', renderTablets);
  controls.addEventListener('change', ({ target }) => {
    const { index, field, led } = target.dataset;
    const value = target.type === 'checkbox' ? target.checked : Number(target.value);
    if (field) config[field][index] = value;
    if (led) config.displays[index][led] = value;
    if (field || led) updateDestinations();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = new FormData(form);
    const headers = { 'Content-Type': 'application/json' };
    const accessKey = values.get('accessKey');
    if (accessKey) headers.Authorization = `Bearer ${accessKey}`;
    const update = {
      duration: Number(values.get('duration')),
      idleSlideTime: Number(values.get('idleSlideTime')),
      idleFirstPostTime: Number(values.get('idleFirstPostTime')),
      idleSecondPostTime: Number(values.get('idleSecondPostTime')),
      idleFadeTime: Number(values.get('idleFadeTime')),
      writingTimeout: Number(values.get('writingTimeout')),
      spotlight: Number(values.get('spotlight')),
      commentLimit: Number(values.get('commentLimit')),
      leadTime: Number(values.get('leadTime')),
      gap: Number(values.get('gap')),
      accepting: values.has('accepting'),
      wallMotion: values.get('wallMotion'),
      tabletMotion: values.has('tabletMotion'),
      sceneMotion: values.has('sceneMotion'),
      storyMotion: values.has('storyMotion'),
      liveBackdrop: values.get('liveBackdrop'),
      displays: config.displays,
      panelByScene: config.panelByScene,
      sceneEnabled: config.sceneEnabled,
      sceneByTablet: config.sceneByTablet.slice(0, count.valueAsNumber),
      panelByTablet: config.panelByTablet.slice(0, count.valueAsNumber),
      tabletEnabled: config.tabletEnabled.slice(0, count.valueAsNumber)
    };
    setBusy(true);
    report('Saving…');
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(update),
        signal: AbortSignal.timeout(6000)
      });
      const result = await response.json();
      if (!response.ok) {
        report(result.error, true);
        return;
      }
      savedCount = result.sceneByTablet.length;
      report(result.stopped ? `Saved. Removed ${result.stopped} live or queued comments from disabled LEDs.` : 'Settings saved.');
    } catch {
      report('Could not save settings. Try again.', true);
    } finally {
      setBusy(false);
      renderTablets();
    }
  });
}
