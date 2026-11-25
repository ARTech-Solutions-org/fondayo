import { defaultPostBorder, postImage } from './scenes.js';

const ledNames = ['Left LED', 'Center LED', 'Right LED'];
const sceneNames = Array.from({ length: 6 }, (_, index) => `Scene ${index + 1}`);
const saverNames = ['Black when idle', 'Screensaver 1', 'Screensaver 2', 'Screensaver 3'];
const checked = value => value ? ' checked' : '';

const settingHelp = {
  enabled: ['Enable LED', 'An enabled LED follows the wall rotation. Switching it off blacks out the output and cancels its queued pop-ups. Saved comments can appear again when it is enabled.', ['Enabled', 'post'], ['Disabled', 'black']],
  saver: ['LED screensaver', 'Choose the artwork this LED shows during the screensaver phase. Black when idle keeps that output black during idle playback.', ['Screensaver 1', 'saver'], ['Screensaver 2', 'saver-two']],
  limit: ['LED comment limit', 'Set the maximum number of retained tablet comments for this LED. Default uses the limit in Playback and submissions. When replacing a comment, the oldest eligible card is removed.', ['2 comments', 'post'], ['4 comments', 'more-comments']],
  postSize: ['Post size', 'Changes the size of both post scenes on this LED. 100% is the standard size. The available range leaves room for the logo and footer.', ['75% · smaller post', 'post-small'], ['100% · standard size', 'post']],
  postBorder: ['Post border', 'Leaves a clear strip of background around both posts on this LED. Set 0% to remove it. The percentage is measured against the LED width. Larger borders can leave less space for the post and cards.', ['0% · no clear border', 'post'], ['1.5% · clear border', 'post-clearance']],
  idleSlideTime: ['Time on screensavers', 'Controls how many seconds the screensaver phase lasts before all LEDs advance to the first group of posts.', ['Screensaver for 5 seconds'], ['Screensaver for 10 seconds']],
  idleFirstPostTime: ['Time on posts 1–3', 'Controls how long the first group of posts stays visible during idle playback before the wall moves to posts 4–6.', ['Posts 1–3 for 5 seconds'], ['Posts 1–3 for 10 seconds']],
  idleSecondPostTime: ['Time on posts 4–6', 'Controls how long the second group of posts stays visible during idle playback before the screensavers return.', ['Posts 4–6 for 5 seconds'], ['Posts 4–6 for 10 seconds']],
  idleFadeTime: ['Crossfade duration', 'Controls how long the outgoing and incoming artwork blend during idle playback. Zero switches immediately.', ['0 seconds · instant switch'], ['0.8 seconds · crossfade']],
  sceneEnabled: ['Enable scene', 'Enabled scenes can be used for playback and comments. Switching one off makes it unavailable for tablet submissions to that scene. The LED can still show its other enabled scene.', ['Scene enabled', 'post'], ['Scene disabled · other post', 'post-four']],
  panelByScene: ['Default LED for this scene', 'Sets the preferred LED for tablets using Follow scene LED. Tablets with a fixed LED or Random LED use their own routing.', ['Follow scene → left LED'], ['Follow scene → center LED']],
  tabletCount: ['Number of tablets', 'Sets how many tablet routes are available after you save. Each tablet has its own numbered link and routing settings.', ['1 device · /tablet/1'], ['2 devices · /tablet/1 and /tablet/2']],
  tabletEnabled: ['Enable tablet', 'Allows this numbered tablet to accept and send comments. Turning it off closes that tablet route for submissions.', ['Enabled · can send comments'], ['Disabled · submissions blocked']],
  sceneByTablet: ['Tablet scene', 'Chooses the scene used by this tablet. A fixed LED offers its two scenes. Random LED chooses a scene automatically, and each submitted comment stays on its assigned scene.', ['Left LED · Scene 1', 'post'], ['Left LED · Scene 4', 'post-four']],
  panelByTablet: ['Tablet LED', 'Follow scene LED uses the selected scene’s default output. A fixed LED keeps comments there. Random LED picks an available enabled output and one of its enabled scenes.', ['Left LED · Scene 1', 'post'], ['Random LED · e.g. Center LED, Scene 2', 'post-two']],
  accepting: ['Accept new comments', 'Pauses or resumes submissions from all tablets. Comments already saved remain available on their scenes.', ['On · tablets can submit'], ['Off · new submissions paused']],
  writingTimeout: ['Return after no typing', 'A draft holds the wall on the post group while the visitor is typing. These examples play at 5× speed to show how an inactive draft expires.', ['Stops holding after 15 seconds'], ['Stops holding after 45 seconds']],
  spotlight: ['Large comment time', 'Sets how long the new comment remains in its large pop-up before it shrinks beside its post.', ['Large for 2 seconds'], ['Large for 5 seconds']],
  duration: ['Hold post group after shrinking', 'The countdown starts when the comment shrinks. It controls how long the wall holds the post group before it can return to idle playback.', ['Hold the post for 5 seconds'], ['Hold the post for 10 seconds']],
  commentLimit: ['Default small-comment limit per LED', 'Sets the retention limit for each LED using Default comment limit. An individual LED can override it. If the artwork leaves less space, the newest cards have display priority.', ['Default limit of 2', 'post'], ['Default limit of 4', 'more-comments']],
  leadTime: ['Delay before first appearance', 'Adds a delay between accepting a tablet submission and showing its first pop-up. Another comment already queued on that LED can add to the wait.', ['0 seconds of added delay'], ['2 seconds before the pop-up']],
  gap: ['Gap between comments on one LED', 'Sets the minimum pause between a pop-up shrinking and the next pop-up starting on the same LED.', ['0 seconds between pop-ups'], ['1 second between pop-ups']],
  wallMotion: ['LED comment entrance', 'Impact adds a burst and a strong pop. Gentle rise uses a short lift. Instant shows the card at full size immediately.', ['Instant entrance'], ['Impact entrance']],
  liveBackdrop: ['Whole wall during a pop-up', 'Changes the scene and cards behind the large comment across all LEDs. Keep visible leaves them clear, Blur and dim softens them, and Hide scene artwork removes them from view during the pop-up.', ['Keep visible'], ['Blur and dim']],
  tabletMotion: ['Fly comment out of the tablet', 'Plays a short flight animation on the tablet after a successful submission. Turning it off lets the tablet finish without the flight.', ['Off · form stays still'], ['On · card flies out']],
  storyMotion: ['Reveal comments from behind the post', 'Plays the same slide-in for the original cards and saved tablet comments when their scene appears. When off, the cards appear in their final positions with the scene.', ['Off · cards appear in place'], ['On · cards slide out']],
  sceneMotion: ['Animate post artwork during comments', 'Adds an entrance to the post artwork when the wall opens the comment scene. The idle crossfade is controlled separately.', ['Off · post appears in place'], ['On · post entrance animation']],
  accessKey: ['Settings access key', 'Enter the installation’s access key to save changes or delete tablet comments. On Vercel, this is the value configured in FONDAYO_ADMIN_TOKEN.'],
  tabletComments: ['Tablet comments', 'Refresh to see the latest queued and saved tablet comments. Delete removes the selected comment from the wall. The original cards are part of the design.']
};

const helpVideos = {
  idleSlideTime: 'idle-saver', idleFirstPostTime: 'idle-first', idleSecondPostTime: 'idle-second', idleFadeTime: 'crossfade',
  writingTimeout: 'writing-timeout', spotlight: 'spotlight', duration: 'hold', leadTime: 'lead-time', gap: 'gap',
  wallMotion: 'wall-motion', liveBackdrop: 'backdrop', tabletMotion: 'tablet-flight',
  storyMotion: 'story-reveal', sceneMotion: 'scene-motion'
};

function helpPreview([caption, style], video) {
  if (video) {
    return `<figure>
      <video class="settings-example settings-video" controls muted playsinline loop preload="none"
        src="/media/settings/${video}.mp4" aria-label="${caption}"></video>
      <figcaption>${caption}</figcaption>
    </figure>`;
  }
  if (!style) return `<figure><figcaption>${caption}</figcaption></figure>`;
  const post = style === 'post-four' ? 4 : style === 'post-two' ? 2 : 1;
  const saver = style === 'saver' || style === 'saver-two';
  const saverNumber = style === 'saver-two' ? 2 : 1;
  const saverTitle = saverNumber === 1 ? 31 : 40;
  const saverBackground = saverNumber === 1 ? 32 : 41;
  const saverPath = `/design/design/screen%20sever%20post%201/screen-saver${saverNumber}/Asset%20`;
  const artwork = saver
    ? `<img class="preview-background" src="${saverPath}${saverBackground}.png" alt=""><img class="preview-title" src="${saverPath}${saverTitle}.png" alt="">`
    : `<div class="preview-art"><img class="preview-post" src="${postImage(post)}" alt=""><div class="preview-cards"><i></i><i></i><i></i><i></i></div></div>`;
  return `<figure><div class="settings-example ${style}" aria-hidden="true">
    ${style === 'black' ? '' : artwork}
  </div><figcaption>${caption}</figcaption></figure>`;
}

function playVisibleHelpVideos(dialog, videos) {
  const autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visibleThreshold = .25;
  const states = new Map(Array.from(videos, video => [video, { visible: false, resume: autoplay }]));

  function update(video, state) {
    if (dialog.open && state.visible && !document.hidden) {
      if (state.resume) {
        state.resume = false;
        video.play().catch(() => {});
      }
    } else if (!video.paused) {
      state.resume = true;
      video.pause();
    }
  }

  const observer = new IntersectionObserver(entries => {
    for (const { target, intersectionRatio } of entries) {
      const state = states.get(target);
      state.visible = intersectionRatio >= visibleThreshold;
      update(target, state);
    }
  }, { root: dialog, threshold: visibleThreshold });
  for (const video of videos) observer.observe(video);
  const onVisibility = () => states.forEach((state, video) => update(video, state));
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    for (const video of videos) video.pause();
  };
}

function setupSettingHelp(app, form) {
  const dialog = app.querySelector('#setting-help');
  const title = dialog.querySelector('h2');
  const content = dialog.querySelector('.setting-help-content');
  const close = dialog.querySelector('button');
  let stopVideos;
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    stopVideos?.();
    stopVideos = undefined;
    content.replaceChildren();
  });
  form.addEventListener('click', event => {
    const button = event.target.closest('[data-setting-help]');
    if (!button) return;
    const key = button.dataset.settingHelp;
    const [heading, description, before, after] = settingHelp[key];
    const video = helpVideos[key];
    stopVideos?.();
    stopVideos = undefined;
    title.textContent = heading;
    content.innerHTML = `<p>${description}</p>${before ? `
      <div class="settings-examples">
        <div><h3>Before</h3>${helpPreview(before, video && `${video}-before`)}</div>
        <div><h3>After</h3>${helpPreview(after, video && `${video}-after`)}</div>
      </div>` : ''}`;
    dialog.showModal();
    if (video) stopVideos = playVisibleHelpVideos(dialog, content.querySelectorAll('video'));
  });

  return container => {
    for (const control of container.querySelectorAll('input, select, #refresh-comments')) {
      const key = control.dataset.field || control.dataset.led || control.name ||
        (control.id === 'tablet-count' ? 'tabletCount' : 'tabletComments');
      if (!settingHelp[key] || control.closest('[hidden], .setting-with-help')) continue;
      const anchor = control.closest('label') || control;
      const wrapper = document.createElement('div');
      wrapper.className = 'setting-with-help';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'setting-help-trigger';
      button.dataset.settingHelp = key;
      button.setAttribute('aria-label', `Help for ${control.getAttribute('aria-label') || settingHelp[key][0]}`);
      button.setAttribute('aria-haspopup', 'dialog');
      button.textContent = 'i';
      anchor.before(wrapper);
      wrapper.append(anchor, button);
    }
  };
}

function options(labels, selected, first = 1) {
  return labels.map((label, index) =>
    `<option value="${index + first}"${index + first === selected ? ' selected' : ''}>${label}</option>`).join('');
}

function section(title, content) {
  return `<section class="settings-section"><h2>${title}</h2>${content}</section>`;
}

function manageComments(form) {
  const list = form.querySelector('#audience-comments');
  const refresh = form.querySelector('#refresh-comments');
  const status = form.querySelector('#comment-status');
  const accessKey = form.elements.accessKey;

  function setBusy(busy) {
    refresh.disabled = busy;
    list.inert = busy;
  }

  async function load() {
    setBusy(true);
    status.textContent = 'Loading comments…';
    try {
      const response = await fetch('/api/state', { cache: 'no-store', signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error();
      const { comments } = await response.json();
      const rows = [...comments].reverse().map(comment => {
        const row = document.createElement('li');
        const copy = document.createElement('div');
        const name = document.createElement('strong');
        const message = document.createElement('p');
        const screen = document.createElement('small');
        name.textContent = comment.name;
        message.textContent = comment.message;
        message.dir = 'auto';
        name.dir = 'auto';
        screen.textContent = ledNames[comment.panel];
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Delete';
        button.dataset.commentId = comment.id;
        button.setAttribute('aria-label', `Delete comment by ${comment.name}`);
        copy.append(name, message, screen);
        row.append(copy, button);
        return row;
      });
      list.replaceChildren(...rows);
      status.textContent = rows.length ? '' : 'No tablet comments to manage.';
    } catch {
      status.textContent = 'Could not load comments. Try refreshing the list.';
    } finally {
      setBusy(false);
    }
  }

  list.addEventListener('click', async ({ target }) => {
    const button = target.closest('button[data-comment-id]');
    if (!button || !accessKey.reportValidity() || !confirm('Delete this comment from the wall?')) return;
    const headers = { 'Content-Type': 'application/json' };
    if (accessKey.value) headers.Authorization = `Bearer ${accessKey.value}`;
    setBusy(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE', headers, body: JSON.stringify({ id: button.dataset.commentId }),
        signal: AbortSignal.timeout(6000)
      });
      if (!response.ok) {
        const result = await response.json();
        status.textContent = result.error;
        return;
      }
      button.closest('li').remove();
      status.textContent = list.children.length ? 'Comment deleted.' : 'Comment deleted. No tablet comments left.';
    } catch {
      status.textContent = 'Could not confirm the deletion. Refresh the list to check.';
    } finally {
      setBusy(false);
    }
  });

  refresh.addEventListener('click', load);
  load();
}

export async function showSettings(app, logo) {
  app.className = 'home settings';
  app.innerHTML = `
    ${logo}
    <h1>Display settings</h1>
    <form class="settings-form">
      <fieldset class="settings-controls" disabled>
        ${section('Tablet comments', `
          <button type="button" id="refresh-comments">Refresh comments</button>
          <p id="comment-status" role="status"></p>
          <ul class="settings-comment-list" id="audience-comments"></ul>`)}
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
          <p>A fixed LED offers its two scenes. Random LED picks an available LED and one of its enabled scenes for each comment.</p>
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
          <p>Fixed LEDs keep new comments on their selected scene. Other routing modes can use another LED with room. If there is no room on the available LEDs, the oldest eligible comment is replaced.</p>`)}
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
          <label class="settings-toggle"><input type="checkbox" name="storyMotion"> Reveal comments from behind the post</label>
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
    <dialog id="setting-help" class="setting-help-dialog" aria-labelledby="setting-help-title">
      <header>
        <h2 id="setting-help-title"></h2>
        <button type="button" aria-label="Close help">×</button>
      </header>
      <div class="setting-help-content"></div>
    </dialog>
    <a href="/">Back to installation controls</a>`;

  const form = app.querySelector('form');
  const controls = form.querySelector('fieldset');
  const count = form.querySelector('#tablet-count');
  const leds = form.querySelector('#displays');
  const scenes = form.querySelector('#scene-routes');
  const tablets = form.querySelector('#tablet-routes');
  const save = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.settings-save [role="status"]');
  const addHelpButtons = setupSettingHelp(app, form);
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
    tablets.querySelectorAll('.tablet-choice').forEach((row, index) => {
      const destination = row.querySelector('.tablet-destination');
      const select = row.querySelector('[data-field="sceneByTablet"]');
      const led = config.panelByTablet[index];
      const fixed = led >= 1 && led <= 3;
      const random = led === 4;
      if (fixed) config.sceneByTablet[index] = led + (config.sceneByTablet[index] > 3 ? 3 : 0);
      const scene = config.sceneByTablet[index] - 1;
      const choices = fixed ? [led, led + 3] : sceneNames.map((_, offset) => offset + 1);
      select.innerHTML = random ? `<option value="${scene + 1}">Random scene</option>` : choices.map(post =>
        `<option value="${post}"${post === scene + 1 ? ' selected' : ''}>${sceneNames[post - 1]}${config.sceneEnabled[post - 1] ? '' : ' (off)'}</option>`
      ).join('');
      select.disabled = random;
      const panel = (led || config.panelByScene[scene]) - 1;
      if (config.tabletEnabled[index] === false) destination.textContent = 'Tablet disabled';
      else if (random) destination.textContent = 'Random enabled LED and scene';
      else if (!config.sceneEnabled[scene]) destination.textContent = 'Scene disabled';
      else if (!config.displays[panel].enabled) destination.textContent = fixed ? `${ledNames[panel]} disabled` : `${ledNames[panel]} off · uses another LED`;
      else destination.textContent = fixed ? ledNames[panel] : `${ledNames[panel]} preferred`;
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
        <select aria-label="Tablet ${id} scene" data-field="sceneByTablet" data-index="${index}"></select>
        <select aria-label="Tablet ${id} LED" data-field="panelByTablet" data-index="${index}">${options(['Follow scene LED', ...ledNames, 'Random LED'], config.panelByTablet[index], 0)}</select>
        <span class="tablet-destination"></span>
        ${id <= savedCount ? `<a href="/tablet/${id}" target="_blank" rel="noopener">/tablet/${id}</a>` : '<span class="tablet-link-pending">Link after saving</span>'}
      </div>`;
    }).join('');
    addHelpButtons(tablets);
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
    leds.innerHTML = config.displays.map(({ enabled, saver, limit = 0, postSize = 100, postBorder = defaultPostBorder }, index) => `
      <div class="led-choice">
        <label class="settings-toggle"><input type="checkbox" data-led="enabled" data-index="${index}" aria-label="Enable ${ledNames[index]}"${checked(enabled)}> ${ledNames[index]}</label>
        <select aria-label="${ledNames[index]} screensaver" data-led="saver" data-index="${index}">${options(saverNames, saver, 0)}</select>
        <select aria-label="${ledNames[index]} comment limit" data-led="limit" data-index="${index}">${options(limitLabels, limit, 0)}</select>
        <label class="led-post-size">Post size
          <span><input type="number" aria-label="${ledNames[index]} post size" data-led="postSize" data-index="${index}"
            inputmode="numeric" min="${config.postSizeMin}" max="${config.postSizeMax[index]}" step="1" value="${postSize}" required> %</span>
        </label>
        <label class="led-post-size">Post border
          <span><input type="number" aria-label="${ledNames[index]} post border" data-led="postBorder" data-index="${index}"
            inputmode="decimal" min="0" max="${config.postBorderMax}" step="0.25" value="${postBorder}" required> %</span>
        </label>
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
    addHelpButtons(form);
    manageComments(form);
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
      report(result.stopped ? `Saved. Removed ${result.stopped} live or queued comments from disabled LEDs or scenes.` : 'Settings saved.');
    } catch {
      report('Could not save settings. Try again.', true);
    } finally {
      setBusy(false);
      renderTablets();
    }
  });
}
