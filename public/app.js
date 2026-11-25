import { commentFrame, commentWidth, defaultPostBorder, makePanel, postWidth, sideCardWidth, storyCardX, tabletAsset } from './scenes.js';
import { arrangeComments, commentDock } from './comment-layout.js';
import { showSettings } from './settings.js';

const app = document.querySelector('#app');
const route = location.pathname.replace(/\/$/, '');
const tabletRoute = route.match(/^\/tablet(?:\/([1-9]\d?))?$/);
const panelNames = ['left screen', 'center screen', 'right screen'];
const arabic = /\p{Script=Arabic}/u;
const frameImages = new Map();

function setText(element, value) {
  element.textContent = value;
  element.dir = 'auto';
  if (arabic.test(value)) element.classList.add('arabic');
}

function commentCard(comment) {
  const card = document.createElement('article');
  card.className = 'comment-card';
  const avatar = document.createElement('span');
  avatar.className = 'comment-avatar';
  avatar.dataset.profile = comment.profile ?? '';
  avatar.setAttribute('aria-hidden', 'true');
  const text = document.createElement('div');
  text.className = 'comment-copy';
  const name = document.createElement('strong');
  setText(name, comment.name);
  const message = document.createElement('p');
  setText(message, comment.message);
  const heart = document.createElement('span');
  heart.className = 'comment-heart';
  heart.setAttribute('aria-hidden', 'true');
  heart.textContent = '♡';
  text.append(name, message);
  card.append(avatar, text, heart);
  return card;
}

function impact() {
  const effect = document.createElement('div');
  effect.className = 'impact';
  effect.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 18; i += 1) {
    const spark = document.createElement('i');
    spark.style.setProperty('--angle', `${i * 20 + 7}deg`);
    spark.style.setProperty('--distance', `${27 + (i % 4) * 7}cqw`);
    spark.style.setProperty('--spark-delay', `${i % 3 * 27}ms`);
    effect.append(spark);
  }
  return effect;
}

function drawCompactFrame(card, scene, extraHeight) {
  const canvas = card.querySelector('canvas');
  const growth = extraHeight / card.getBoundingClientRect().width;
  const key = `${scene}/${growth}`;
  if (canvas.dataset.frame === key) return;
  canvas.dataset.frame = key;
  if (!frameImages.has(scene)) {
    const image = new Image();
    image.src = `/media/comment-frame-${scene}.png`;
    frameImages.set(scene, image.decode().then(() => image));
  }
  frameImages.get(scene).then(image => {
    if (canvas.dataset.frame !== key) return;
    const { naturalWidth: width, naturalHeight: height } = image;
    const extra = Math.round(growth * width);
    canvas.width = width;
    canvas.height = height + extra;
    const context = canvas.getContext('2d');
    // Keep the top and bottom pixels intact. Stretch only the straight middle.
    const top = 43;
    const bottom = 48;
    const middle = height - top - bottom;
    context.drawImage(image, 0, 0, width, top, 0, 0, width, top);
    context.drawImage(image, 0, top, width, middle, 0, top, width, middle + extra);
    context.drawImage(image, 0, height - bottom, width, bottom, 0, top + middle + extra, width, bottom);
  }).catch(() => frameImages.delete(scene));
}

function compactComments(panel, view, comments, scene, { postSize, postBorder, cardWidth }) {
  const width = panel.clientWidth;
  const key = [scene, width, postSize, postBorder, ...comments.map(comment => comment.id)].join('/');
  if (view.compactLayoutKey === key) return;
  view.compactLayoutKey = key;
  const frameHeight = commentFrame(scene, cardWidth);
  const ids = new Set(comments.map(comment => comment.id));
  for (const [id, card] of view.compactCards) {
    if (ids.has(id)) continue;
    card.remove();
    view.compactCards.delete(id);
  }
  for (const comment of comments) {
    let card = view.compactCards.get(comment.id);
    if (!card) {
      card = commentCard(comment);
      card.classList.add('compact-comment');
      const frameCanvas = document.createElement('canvas');
      frameCanvas.className = 'compact-frame';
      frameCanvas.setAttribute('aria-hidden', 'true');
      card.prepend(frameCanvas);
      const copy = card.querySelector('.comment-copy');
      const name = document.createElement('div');
      name.className = 'compact-name';
      const stamp = document.createElement('time');
      stamp.dateTime = new Date(comment.start).toISOString();
      stamp.textContent = 'Now';
      name.append(copy.querySelector('strong'), stamp);
      copy.prepend(name);
      const reply = document.createElement('span');
      reply.className = 'compact-reply';
      reply.textContent = 'Reply';
      reply.setAttribute('aria-hidden', 'true');
      copy.append(reply);
      const heart = document.createElement('img');
      heart.alt = '';
      card.querySelector('.comment-heart').replaceChildren(heart);
      view.compactCards.set(comment.id, card);
      view.compactStage.append(card);
    }
    card.style.setProperty('--frame-height', `${frameHeight}cqw`);
    if (card.dataset.layout !== String(scene)) {
      card.querySelector('.comment-heart img').src = `/media/comment-heart-${scene}.png`;
      card.dataset.layout = scene;
    }
  }
  if (!comments.length || !width) {
    view.compactPositions = new Map();
    return;
  }
  const panelHeight = panel.clientHeight * 100 / width;
  const items = [...comments].reverse().map(({ id, slot }) => {
    const card = view.compactCards.get(id);
    const message = card.querySelector('.comment-copy p');
    const lineHeight = parseFloat(getComputedStyle(message).lineHeight);
    const extraLines = Math.max(0, Math.round(message.getBoundingClientRect().height / lineHeight) - 1);
    const extraHeight = extraLines * lineHeight;
    card.style.setProperty('--frame-growth', `${extraHeight}px`);
    drawCompactFrame(card, scene, extraHeight);
    return { id, slot: slot ?? 0, height: card.getBoundingClientRect().height * 100 / width };
  });
  view.compactPositions = arrangeComments(items, scene, panelHeight, view.compactPositions ?? new Map(), postSize, postBorder);
  for (const [id, card] of view.compactCards) {
    const position = view.compactPositions.get(id);
    card.style.visibility = position ? 'visible' : 'hidden';
    if (position) {
      card.style.setProperty('--comment-x', `${position.x}%`);
      card.style.setProperty('--comment-y', `${position.y * 100 / panelHeight}%`);
    }
  }
}

function revealCompactComments(layer, panel, elapsed) {
  const height = panel.clientHeight * 100 / panel.clientWidth;
  const order = [0, 0];
  const entries = [...layer.compactPositions].sort(([, a], [, b]) =>
    Math.abs(a.y - height / 2) - Math.abs(b.y - height / 2));
  for (const [id, { x, y }] of entries) {
    const card = layer.compactCards.get(id);
    const side = Number(x >= 50);
    const delay = order[side]++ * 105 + side * 32;
    card.style.setProperty('--story-from-x', `${50 - x}cqw`);
    card.style.setProperty('--story-from-y', `calc(var(--panel-height) * ${(.5 - y / height) * .48})`);
    card.style.setProperty('--story-delay', `${delay - elapsed}ms`);
    card.classList.add('is-revealing');
  }
}

function showLive(view, comment, now, scene) {
  const id = comment?.id ?? null;
  if (view.comment === id) return;
  view.comment = id;
  if (!comment) {
    view.liveStage.replaceChildren();
    return;
  }
  const moment = document.createElement('div');
  moment.className = 'live-moment';
  moment.dataset.motion = comment.wallMotion ?? 'impact';
  moment.style.setProperty('--elapsed', `-${Math.max(0, now - comment.start)}ms`);
  moment.style.setProperty('--duration', `${(comment.compactAt ?? comment.end) - comment.start}ms`);
  const panelHeight = view.panel.clientWidth ? view.panel.clientHeight * 100 / view.panel.clientWidth : 100;
  const dock = commentDock(scene, comment.slot ?? 0, panelHeight, view.postSize, view.postBorder);
  moment.style.setProperty('--dock-x', `${dock.x - 50}%`);
  moment.style.setProperty('--dock-y', `${dock.y - 50}%`);
  moment.style.setProperty('--entry-x', `${(1 - comment.panel) * 25}cqw`);
  const card = commentCard(comment);
  card.classList.add('wall-comment');
  if (comment.message.length > 145) card.classList.add('long-comment');
  if (moment.dataset.motion === 'impact') moment.append(impact());
  moment.append(card);
  view.liveStage.replaceChildren(moment);
}

function switchLayer(view, key, next, duration, elapsed) {
  const previous = view[key];
  if (previous === next) {
    if (!duration) view.fades[key]?.();
    return;
  }
  view.fades[key]?.();
  view[key] = next;
  if (next) {
    next.hidden = false;
    next.removeAttribute('aria-hidden');
  }
  if (previous) previous.setAttribute('aria-hidden', 'true');
  if (!duration || elapsed >= duration) {
    if (previous) previous.hidden = true;
    return;
  }
  const easing = 'cubic-bezier(.45, 0, .55, 1)';
  const animations = [
    previous?.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing, fill: 'both' }),
    next?.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing, fill: 'both' })
  ].filter(Boolean);
  for (const animation of animations) {
    animation.startTime = document.timeline.currentTime - elapsed;
  }
  function complete() {
    if (view.fades[key] !== complete) return;
    if (previous) previous.hidden = true;
    delete view.fades[key];
    for (const animation of animations) animation.cancel();
  }
  view.fades[key] = complete;
  Promise.all(animations.map(animation => animation.finished)).then(complete, () => {});
}

function setPostGeometry(view, postSize, postBorder) {
  if (view.postSize === postSize && view.postBorder === postBorder) return;
  const width = postWidth(postSize, view.index === 1 ? 600 / 7 : 100, postBorder);
  const cardWidth = sideCardWidth(width, postBorder);
  Object.assign(view, { postSize, postBorder, cardWidth });
  view.panel.classList.toggle('has-post-border', postBorder > 0);
  view.panel.style.setProperty('--post-width', `${width}cqw`);
  view.panel.style.setProperty('--post-half-width', `${width / 2}cqw`);
  view.panel.style.setProperty('--post-border', `${postBorder}cqw`);
  view.panel.style.setProperty('--comment-width', `${cardWidth}cqw`);
  view.panel.style.setProperty('--compact-unit', `${cardWidth / commentWidth}cqw`);
  for (const story of view.stories) {
    for (const card of story.children) {
      const x = storyCardX(Number(card.dataset.referenceX), width, postBorder);
      card.style.setProperty('--x', `${x}%`);
      card.style.setProperty('--story-from-x', `${50 - x}cqw`);
    }
  }
}

function wall() {
  const index = route.startsWith('/screen/') ? Number(route.at(-1)) - 1 : null;
  document.body.classList.add('wall-body');
  app.className = index === null ? 'wall wall-all' : `wall wall-single wall-${index + 1}`;
  const views = (index === null ? [0, 1, 2] : [index]).map(panel => ({ ...makePanel(panel), index: panel, fades: {} }));
  app.append(...views.map(view => view.panel));

  const notice = document.createElement('div');
  notice.className = 'wall-notice';
  notice.hidden = true;
  notice.textContent = 'Reconnecting to the comment feed…';
  app.append(notice);

  let serverTime = Date.now();
  let receivedAt = performance.now();
  let comments = [];
  let commentLimit = 10;
  let displays = [1, 2, 3].map(saver => ({ enabled: true, saver }));
  let rotation = { since: serverTime, slidesMs: [8000, 8000, 8000], fadeMs: 800, group: null, posts: [[1, 2, 3], [4, 5, 6]] };
  let synchronized = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function finishReveal(event) {
    if (event.animationName === 'story-glide') event.target.classList.remove('is-revealing');
  }
  app.addEventListener('animationend', finishReveal);
  app.addEventListener('animationcancel', finishReveal);
  let disconnectedAt = receivedAt;
  function receive(update, latency = 0) {
    serverTime = update.now + latency;
    receivedAt = performance.now();
    comments = update.comments;
    commentLimit = update.commentLimit ?? commentLimit;
    displays = update.displays ?? displays;
    rotation = update.rotation ?? rotation;
    app.classList.toggle('static-scenes', update.sceneMotion === false);
    app.classList.toggle('animate-story-cards', update.storyMotion !== false);
    disconnectedAt = null;
    render();
    synchronized = true;
  }
  function disconnected() { disconnectedAt ??= performance.now(); }
  if (document.querySelector('meta[name="wall-transport"][content="poll"]')) {
    async function poll() {
      const started = performance.now();
      try {
        const response = await fetch('/api/state', { signal: AbortSignal.timeout(5000), cache: 'no-store' });
        if (!response.ok) throw new Error('Wall state unavailable');
        const update = await response.json();
        receive(update, Math.min(250, (performance.now() - started) / 2));
      } catch {
        disconnected();
      } finally {
        setTimeout(poll, Math.max(100, 650 - (performance.now() - started)));
      }
    }
    poll();
  } else {
    const feed = new EventSource('/api/events');
    feed.onmessage = event => receive(JSON.parse(event.data));
    feed.onerror = disconnected;
  }

  function render() {
    const elapsed = performance.now();
    const now = serverTime + elapsed - receivedAt;
    const [saverMs, firstMs, secondMs] = rotation.slidesMs ?? Array(3).fill(rotation.slideMs);
    const cycleTime = Math.max(0, now - rotation.since) % (saverMs + firstMs + secondMs);
    const phase = cycleTime < saverMs ? 0 : cycleTime < saverMs + firstMs ? 1 : 2;
    const phaseElapsed = cycleTime - [0, saverMs, saverMs + firstMs][phase];
    const liveGroup = rotation.group !== null && now >= (rotation.activeAt ?? 0)
      ? rotation.group : (now < rotation.since ? rotation.previousGroup ?? null : null);
    const idle = liveGroup === null;
    const fade = idle && synchronized && !reducedMotion.matches ? (rotation.fadeMs ?? 800) : 0;
    app.classList.toggle('wall-idle', idle);
    const spotlight = comments.findLast(entry => displays[entry.panel]?.enabled &&
      entry.start <= now && now < (entry.compactAt ?? entry.end));
    app.dataset.liveBackdrop = spotlight ? (spotlight.liveBackdrop ?? 'softened') : '';
    notice.hidden = disconnectedAt === null || elapsed - disconnectedAt < 7000 ||
      views.every(view => !displays[view.index].enabled);
    for (const view of views) {
      const { enabled, saver, limit, postSize = 100, postBorder = defaultPostBorder } = displays[view.index];
      setPostGeometry(view, postSize, postBorder);
      const active = enabled ? comments.filter(entry => entry.panel === view.index && entry.start <= now) : [];
      const comment = active.find(entry => (entry.compactAt ?? entry.end) > now);
      const group = liveGroup ?? (phase === 0 ? null : phase - 1);
      let post = enabled && group !== null && (!idle || saver) ? rotation.posts[group][view.index] : 0;
      const held = comment ?? active.findLast(entry => entry.end > now);
      if (post && held && rotation.posts.some(posts => posts[view.index] === held.scene)) {
        post = held.scene;
      }
      const compact = active.filter(entry => entry.compactAt <= now && entry.scene === post)
        .slice(-(limit || commentLimit));
      const scene = (enabled && (post ? view.scenes[post - 1] : view.idleScenes[saver - 1])) || null;
      view.panel.classList.toggle('is-black', scene === null);
      const story = post ? view.stories[post - 1] : null;
      const sceneFade = enabled && scene ? fade : 0;
      const layer = view.compactLayers[post - 1];
      const entering = layer && layer.compactStage !== view.compact && synchronized && !reducedMotion.matches;
      switchLayer(view, 'scene', scene, sceneFade, phaseElapsed);
      switchLayer(view, 'story', story, sceneFade, phaseElapsed);
      switchLayer(view, 'compact', layer?.compactStage ?? null, sceneFade, phaseElapsed);
      if (layer) {
        compactComments(view.panel, layer, compact, post, view);
        if (entering && app.classList.contains('animate-story-cards')) {
          revealCompactComments(layer, view.panel, idle ? phaseElapsed : 0);
        }
      }
      showLive(view, post && comment?.scene === post ? comment : null, now, post);
    }
  }
  render();
  setInterval(render, 70);
  document.fonts.addEventListener('loadingdone', () => {
    for (const view of views) {
      for (const layer of view.compactLayers) layer.compactLayoutKey = '';
    }
    render();
  });
}

function tabImage(number, className, alt = '') {
  return `<img src="${tabletAsset(number)}" class="${className}" alt="${alt}" draggable="false">`;
}

function launch(comment, anchor) {
  const rect = anchor.getBoundingClientRect();
  const flight = document.createElement('div');
  flight.className = 'flight';
  flight.style.setProperty('--from-x', `${rect.left + rect.width / 2}px`);
  flight.style.setProperty('--from-y', `${rect.top + rect.height / 2}px`);
  flight.style.setProperty('--to-x', ['18vw', '50vw', '82vw'][comment.panel]);
  flight.append(impact(), commentCard(comment));
  document.body.append(flight);
  window.setTimeout(() => flight.remove(), 1250);
}

function requestId() {
  const random = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
}

function setupTabletFullscreen(logo, status) {
  const root = document.documentElement;
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement;
  const standaloneMode = matchMedia('(display-mode: standalone)');
  const installed = () => navigator.standalone === true || standaloneMode.matches;
  const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1);
  let changing = false;
  let timeout;

  function sync() {
    const native = Boolean(fullscreenElement());
    const standalone = installed();
    logo.setAttribute('aria-pressed', String(native || standalone));
    logo.setAttribute('aria-label', native ? 'Exit fullscreen' : standalone ? 'Home Screen app' : 'Enter fullscreen');
    status.hidden = true;
  }

  function finish() {
    clearTimeout(timeout);
    changing = false;
    sync();
  }

  function show(message) {
    status.textContent = message;
    status.hidden = false;
  }

  function unavailable(exiting) {
    finish();
    if (exiting) show('Use your browser’s fullscreen controls to exit.');
    else if (appleMobile) show('In Safari, tap Share, then Add to Home Screen. If offered, turn on Open as Web App. Open this tablet from its new Home Screen icon.');
    else show('Open this tablet link directly in your browser and tap the logo to enter fullscreen.');
  }

  for (const event of ['fullscreenchange', 'webkitfullscreenchange']) {
    document.addEventListener(event, finish);
  }
  for (const event of ['fullscreenerror', 'webkitfullscreenerror']) {
    document.addEventListener(event, () => {
      if (changing) unavailable(Boolean(fullscreenElement()));
    });
  }
  standaloneMode.addEventListener?.('change', sync);
  sync();

  logo.addEventListener('click', async () => {
    if (changing) return;
    const exiting = Boolean(fullscreenElement());
    if (!exiting && installed()) {
      show('This tablet is already open as a Home Screen app.');
      return;
    }
    const request = document.fullscreenEnabled === false ? null : root.requestFullscreen;
    const webkitRequest = document.webkitFullscreenEnabled === false ? null : root.webkitRequestFullscreen;
    const exit = document.fullscreenElement ? document.exitFullscreen ?? document.webkitExitFullscreen
      : document.webkitExitFullscreen ?? document.exitFullscreen;
    const action = exiting ? exit : request ?? webkitRequest;
    if (!action) return unavailable(exiting);

    changing = true;
    try {
      await action.call(exiting ? document : root);
      if (!changing || Boolean(fullscreenElement()) !== exiting) finish();
      else timeout = setTimeout(() => unavailable(exiting), 1000);
    } catch {
      unavailable(exiting);
    }
  });
}

function tablet(tabletId) {
  app.className = 'tablet';
  app.innerHTML = `
    <section class="tablet-stage">
      <button type="button" class="tablet-logo" aria-label="Enter fullscreen" aria-pressed="false">
        ${tabImage(16, 'tablet-logo-image', 'Foundayo (orforglipron), a Lilly Medicine')}
      </button>
      <p class="tablet-fullscreen-status" role="status" hidden></p>
      <div class="tablet-intro">
        ${tabImage(17, 'tablet-arc')}
        ${tabImage(9, 'tablet-prompt', 'Your patients are listening. What would you tell them? Share your professional perspective and help guide the conversation toward informed, individualized care.')}
      </div>
      <section class="tablet-paper" aria-labelledby="tablet-title">
        <h1 id="tablet-title">Leave your comment.</h1>
        ${tabImage(12, 'post-icons')}
        ${tabImage(13, 'post-caption', '120 likes. Your caption here.')}
        <form class="comment-form">
          <span class="form-avatar" aria-hidden="true"></span>
          <div class="form-inputs">
            <fieldset class="profiles" aria-label="Profile">
              <label><input type="radio" name="profile" value="male"><span>Male</span></label>
              <label><input type="radio" name="profile" value="female"><span>Female</span></label>
            </fieldset>
            <input name="name" type="text" aria-label="Your name" placeholder="ADD YOUR NAME" autocomplete="off" maxlength="36" required dir="auto">
            <textarea name="message" aria-label="Your comment" placeholder="Add a comment here please..." maxlength="240" rows="3" required dir="auto"></textarea>
            <div class="form-actions">
              <p class="form-status" role="status" aria-live="polite"></p>
              <button type="submit">Send comment <span aria-hidden="true">↗</span></button>
            </div>
          </div>
        </form>
      </section>
      ${tabImage(18, 'tablet-footer tablet-footer-left', 'QR code for abbreviated prescribing information')}
      ${tabImage(18, 'tablet-footer tablet-footer-right', 'QR code for privacy policy')}
      <div class="tablet-legal">
        ${tabImage(180, 'tablet-legal-left', 'Information for health care professionals and adverse event reporting')}
        ${tabImage(179, 'tablet-legal-right', 'Lilly product information and copyright')}
      </div>
    </section>`;

  setupTabletFullscreen(app.querySelector('.tablet-logo'), app.querySelector('.tablet-fullscreen-status'));

  const form = app.querySelector('form');
  const button = form.querySelector('button');
  const name = form.elements.namedItem('name');
  const message = form.elements.namedItem('message');
  const avatar = form.querySelector('.form-avatar');
  const status = form.querySelector('.form-status');
  let pending;
  let busy = false;
  let writer;
  let writingRequest;
  let nextWritingUpdate = 0;
  function notifyWriting() {
    if (busy || performance.now() < nextWritingUpdate) return;
    writer ??= requestId();
    nextWritingUpdate = performance.now() + 4000;
    writingRequest = fetch('/api/writing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: writer, tablet: tabletId }),
      signal: AbortSignal.timeout(2500)
    }).catch(() => { nextWritingUpdate = 0; });
  }
  for (const field of [name, message]) {
    field.addEventListener('focus', notifyWriting);
    field.addEventListener('pointerdown', notifyWriting);
    field.addEventListener('input', notifyWriting);
  }
  window.addEventListener('pagehide', () => {
    if (!writer) return;
    fetch('/api/writing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: writer, tablet: tabletId, finished: true }),
      keepalive: true
    }).catch(() => {});
  });
  form.addEventListener('input', () => {
    status.textContent = '';
    status.className = 'form-status';
    name.setCustomValidity('');
    message.setCustomValidity('');
    avatar.dataset.profile = form.elements.profile.value;
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (!name.value.trim()) name.setCustomValidity('Enter your name.');
    if (!message.value.trim()) message.setCustomValidity('Enter a comment.');
    if (!form.reportValidity()) return;
    const values = { name: name.value.trim(), message: message.value.trim(), profile: form.elements.profile.value };
    const fingerprint = JSON.stringify(values);
    if (pending?.fingerprint !== fingerprint) {
      pending = { fingerprint, id: requestId() };
    }
    busy = true;
    form.setAttribute('aria-busy', 'true');
    button.disabled = true;
    name.readOnly = true;
    message.readOnly = true;
    form.querySelector('fieldset').disabled = true;
    button.firstChild.textContent = 'Sending… ';
    status.textContent = '';
    status.className = 'form-status';
    try {
      await writingRequest;
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, id: pending.id, tablet: tabletId, writer }),
        signal: AbortSignal.timeout(6000)
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.retryWithNewId) pending = null;
        status.classList.add('error');
        status.textContent = result.error;
        return;
      }
      const { comment, now } = result;
      const flightTime = comment.tabletMotion === false ? 0 : 560;
      if (flightTime) {
        launch(comment, message);
        await new Promise(resolve => setTimeout(resolve, flightTime));
      }
      form.reset();
      avatar.dataset.profile = '';
      pending = null;
      writer = null;
      nextWritingUpdate = 0;
      const wait = Math.max(1, Math.ceil((comment.start - now - flightTime) / 1000));
      status.textContent = wait > 2 ? `Queued for the ${panelNames[comment.panel]} · ~${wait}s` : `Sent to the ${panelNames[comment.panel]}.`;
    } catch {
      status.classList.add('error');
      status.textContent = 'Connection interrupted. Tap Send to retry.';
    } finally {
      busy = false;
      form.removeAttribute('aria-busy');
      button.disabled = false;
      name.readOnly = false;
      message.readOnly = false;
      form.querySelector('fieldset').disabled = false;
      button.firstChild.textContent = 'Send comment ';
    }
  });
}

async function openTablet(id) {
  try {
    const response = await fetch('/api/settings', { signal: AbortSignal.timeout(6000) });
    if (response.ok) {
      const config = await response.json();
      if (id > config.sceneByTablet.length || config.tabletEnabled?.[id - 1] === false) {
        app.className = 'home';
        app.innerHTML = `
          ${tabImage(16, 'home-logo', 'Foundayo (orforglipron), a Lilly Medicine')}
          <h1>Tablet ${id} is disabled</h1>
          <p>Enable this tablet in Display settings.</p>`;
        return;
      }
    }
  } catch {
    // The submission endpoint checks whether the tablet is enabled on every send.
  }
  tablet(id);
}

function home() {
  app.className = 'home';
  app.innerHTML = `
    ${tabImage(16, 'home-logo', 'Foundayo (orforglipron), a Lilly Medicine')}
    <h1>Installation controls</h1>
    <nav aria-label="Installation views">
      <a href="/tablet"><strong>Comment tablet</strong><span>Open the audience input</span></a>
      <a href="/wall"><strong>Combined LED wall</strong><span>4864 × 1536 px</span></a>
      <a href="/screen/1"><strong>Left screen</strong><span>1536 × 1536 px</span></a>
      <a href="/screen/2"><strong>Center screen</strong><span>1792 × 1536 px</span></a>
      <a href="/screen/3"><strong>Right screen</strong><span>1536 × 1536 px</span></a>
      <a href="/settings"><strong>Display settings</strong><span>Scenes, tablets and comment duration</span></a>
    </nav>`;
}

if (tabletRoute) openTablet(Number(tabletRoute[1] ?? 1));
else if (route === '/wall' || /^\/screen\/[1-3]$/.test(route)) wall();
else if (route === '/settings') showSettings(app, tabImage(16, 'home-logo', 'Foundayo (orforglipron), a Lilly Medicine'));
else home();
