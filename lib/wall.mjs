import { randomInt } from 'node:crypto';

export const maxTablets = 24;
const maxComments = 16;
const limits = { min: 3, max: 60, step: 0.5 };

function validDuration(value) {
  return Number.isFinite(value) && value >= limits.min && value <= limits.max &&
    Number.isInteger(value / limits.step);
}

function shortTime(value) {
  return Number.isFinite(value) && value >= 0 && value <= 10 &&
    Math.abs(value * 20 - Math.round(value * 20)) < 1e-8;
}

function integers(value, lengthMin, lengthMax, min, max) {
  return Array.isArray(value) && value.length >= lengthMin && value.length <= lengthMax &&
    value.every(item => Number.isInteger(item) && item >= min && item <= max);
}

function flags(value, min, max = min) {
  return Array.isArray(value) && value.length >= min && value.length <= max &&
    value.every(enabled => typeof enabled === 'boolean');
}

const validators = {
  duration: validDuration,
  idleSlideTime: validDuration,
  idleFirstPostTime: value => value === null || validDuration(value),
  idleSecondPostTime: value => value === null || validDuration(value),
  idleFadeTime: value => shortTime(value) && value <= 2.5,
  writingTimeout: value => Number.isInteger(value) && value >= 10 && value <= 180,
  spotlight: value => shortTime(value) && value >= 1.5,
  commentLimit: value => Number.isInteger(value) && value >= 1 && value <= maxComments,
  leadTime: shortTime,
  gap: shortTime,
  accepting: value => typeof value === 'boolean',
  wallMotion: value => ['impact', 'gentle', 'off'].includes(value),
  tabletMotion: value => typeof value === 'boolean',
  sceneMotion: value => typeof value === 'boolean',
  storyMotion: value => typeof value === 'boolean',
  liveBackdrop: value => ['softened', 'visible', 'hidden'].includes(value),
  displays: value => Array.isArray(value) && value.length === 3 &&
    value.every(display => typeof display?.enabled === 'boolean' &&
      Number.isInteger(display.saver) && display.saver >= 0 && display.saver <= 3 &&
      (display.limit === undefined || (Number.isInteger(display.limit) && display.limit >= 0 && display.limit <= maxComments))),
  panelByScene: value => integers(value, 6, 6, 1, 3),
  sceneEnabled: value => flags(value, 6),
  sceneByTablet: value => integers(value, 1, maxTablets, 1, 6),
  panelByTablet: value => integers(value, 1, maxTablets, 0, 4),
  tabletEnabled: value => flags(value, 1, maxTablets)
};

function validId(id) {
  return typeof id === 'string' && /^[a-z0-9-]{20,64}$/i.test(id);
}

export function createWallState(savedSettings, savedComments, now = Date.now()) {
  const config = {
    duration: 9.5,
    idleSlideTime: 8,
    idleFirstPostTime: null,
    idleSecondPostTime: null,
    idleFadeTime: 0.8,
    writingTimeout: 45,
    spotlight: 2.25,
    commentLimit: 10,
    leadTime: 1.2,
    gap: 0.65,
    accepting: true,
    wallMotion: 'impact',
    tabletMotion: true,
    sceneMotion: true,
    storyMotion: true,
    liveBackdrop: 'softened',
    displays: [1, 2, 3].map(saver => ({ enabled: true, saver })),
    panelByScene: [1, 2, 3, 1, 2, 3],
    sceneEnabled: Array(6).fill(true),
    sceneByTablet: [1, 2, 3],
    panelByTablet: [0, 0, 0],
    tabletEnabled: [true, true, true]
  };
  for (const [key, validate] of Object.entries(validators)) {
    if (validate(savedSettings?.[key])) config[key] = savedSettings[key];
  }
  const queue = Array.isArray(savedComments) ? savedComments.filter(comment =>
    validId(comment?.id) && Number.isInteger(comment.panel) && comment.panel >= 0 && comment.panel < 3 &&
    Number.isFinite(comment.start) && Number.isFinite(comment.compactAt) && Number.isFinite(comment.end) &&
    typeof comment.name === 'string' && typeof comment.message === 'string') : [];
  const group = queue.find(comment => config.displays[comment.panel].enabled && comment.end > now);
  return {
    config, queue, writers: {}, recent: {},
    activeGroup: group ? (group.group ?? (group.scene <= 3 ? 0 : 1)) : null,
    activeAt: now, previousGroup: null, idleSince: now
  };
}

function reply(status, body) {
  return { status, body };
}

export function wallSettings(state) {
  return { ...state.config, ...limits, maxTablets, maxComments };
}

function postOn(config, panel, group) {
  const primary = panel + 1 + group * 3;
  if (config.sceneEnabled[primary - 1]) return primary;
  const alternate = panel + 1 + (1 - group) * 3;
  return config.sceneEnabled[alternate - 1] ? alternate : 0;
}

function panelLimit(config, panel) {
  return config.displays[panel].limit || config.commentLimit;
}

export function advanceWall(state, now, synchronizationMs) {
  const { config, queue, writers, recent } = state;
  let changed = false;
  const compactCounts = [0, 0, 0];
  for (let index = queue.length - 1; index >= 0; index -= 1) {
    const { panel, compactAt } = queue[index];
    if (compactAt <= now && ++compactCounts[panel] > panelLimit(config, panel)) {
      queue.splice(index, 1);
      changed = true;
    }
  }
  for (const [id, writer] of Object.entries(writers)) {
    if (writer.expires <= now) {
      delete writers[id];
      changed = true;
    }
  }
  for (const [id, comment] of Object.entries(recent)) {
    if (comment.end + 600_000 <= now) {
      delete recent[id];
      changed = true;
    }
  }
  if (state.activeGroup !== null && Object.keys(writers).length === 0 &&
      !queue.some(comment => comment.end > now && config.displays[comment.panel].enabled)) {
    state.previousGroup = state.activeGroup;
    state.activeGroup = null;
    state.idleSince = now + synchronizationMs;
    changed = true;
  }
  return changed;
}

export function wallSnapshot(state, now) {
  const { config, queue } = state;
  const { displays, sceneMotion, storyMotion, commentLimit, idleSlideTime, idleFirstPostTime, idleSecondPostTime, idleFadeTime } = config;
  return {
    now, comments: queue, displays, sceneMotion, storyMotion, commentLimit,
    rotation: {
      since: state.idleSince,
      slidesMs: [idleSlideTime, idleFirstPostTime ?? idleSlideTime, idleSecondPostTime ?? idleSlideTime].map(time => time * 1000),
      fadeMs: idleFadeTime * 1000,
      group: state.activeGroup,
      activeAt: state.activeAt,
      previousGroup: state.previousGroup,
      posts: [0, 1].map(group => displays.map((_, panel) => postOn(config, panel, group)))
    }
  };
}

function tabletRoute(state, tablet) {
  const { config, activeGroup } = state;
  if (!Number.isInteger(tablet) || tablet < 1 || tablet > config.sceneByTablet.length ||
      config.tabletEnabled[tablet - 1] === false) {
    return { status: 400, error: 'This tablet is disabled in Display settings.' };
  }
  const scene = config.sceneByTablet[tablet - 1];
  const target = config.panelByTablet[tablet - 1] || config.panelByScene[scene - 1];
  if (!config.accepting) return { status: 409, error: 'Comment submissions are paused.' };
  if (!config.sceneEnabled[scene - 1]) return { status: 409, error: 'This tablet’s scene is disabled.' };
  const group = scene <= 3 ? 0 : 1;
  const panels = [0, 1, 2].filter(panel => config.displays[panel].enabled && postOn(config, panel, activeGroup ?? group));
  if (!panels.length) return { status: 409, error: 'No enabled LED with a post scene is available for this tablet.' };
  return { panels, group, preferredPanel: target === 4 ? null : target - 1 };
}

function openWall(state, group, now, synchronizationMs) {
  if (state.activeGroup !== null) return;
  if (state.idleSince <= now) state.previousGroup = null;
  state.activeGroup = group;
  state.activeAt = now + synchronizationMs;
}

function saveSettings(state, input, now) {
  const changes = {};
  for (const [key, validate] of Object.entries(validators)) {
    if (!Object.hasOwn(input ?? {}, key)) continue;
    if (!validate(input[key])) return reply(400, { error: `Check the value for ${key}.` });
    changes[key] = input[key];
  }
  const updated = { ...state.config, ...changes };
  if (['idleSlideTime', 'idleFirstPostTime', 'idleSecondPostTime'].some(key => updated[key] !== state.config[key])) {
    state.idleSince = now;
  }
  state.config = updated;
  for (const [id, writer] of Object.entries(state.writers)) {
    if (tabletRoute(state, writer.tablet).error) delete state.writers[id];
  }
  let stopped = 0;
  state.queue = state.queue.filter(comment => {
    if (comment.compactAt <= now || updated.displays[comment.panel].enabled) return true;
    state.recent[comment.id] = { ...comment, cancelled: true };
    stopped += 1;
    return false;
  });
  return reply(200, { ...wallSettings(state), stopped });
}

function updateWriting(state, input, now, synchronizationMs) {
  const { id, tablet, finished = false } = input ?? {};
  if (!validId(id) || typeof finished !== 'boolean') return reply(400, { error: 'Invalid writing session.' });
  if (finished) {
    if (state.writers[id]?.tablet === tablet) delete state.writers[id];
    return reply(204);
  }
  const route = tabletRoute(state, tablet);
  if (route.error) return reply(route.status, { error: route.error });
  state.writers[id] = { tablet, expires: now + state.config.writingTimeout * 1000 };
  openWall(state, route.group, now, synchronizationMs);
  return reply(204);
}

function addComment(state, input, now, synchronizationMs) {
  const { id, name, message, profile = '', tablet = 1, writer } = input ?? {};
  if (!validId(id) || typeof name !== 'string' || !name.trim() || name.length > 36 ||
      typeof message !== 'string' || !message.trim() || message.length > 240 ||
      !['', 'male', 'female'].includes(profile)) {
    return reply(400, { error: 'Enter a name and a comment within the character limits.' });
  }
  const { config, queue, recent, writers } = state;
  const previous = recent[id] ?? queue.find(comment => comment.id === id);
  if (previous?.cancelled) return reply(409, { error: 'The display was switched off. Tap Send to try again.', retryWithNewId: true });
  if (previous) {
    if (validId(writer) && writers[writer]?.tablet === tablet) delete writers[writer];
    return reply(200, { comment: previous, now });
  }
  const route = tabletRoute(state, tablet);
  if (route.error) return reply(route.status, { error: route.error });
  const gapMs = Math.round(config.gap * 1000);
  const availableAt = [0, 0, 0];
  const commentIndexes = [[], [], []];
  // Include queued pop-ups so quick submissions reserve their eventual card space.
  queue.forEach(({ panel, compactAt, gapMs: previousGap }, index) => {
    commentIndexes[panel].push(index);
    availableAt[panel] = compactAt + (previousGap ?? gapMs);
  });
  const ready = route.panels.filter(panel => availableAt[panel] <= now + 90_000);
  if (!ready.length) return reply(429, { error: 'The screens are busy. Try again in a moment.' });

  const withSpace = ready.filter(panel => commentIndexes[panel].length < panelLimit(config, panel));
  let panel = route.preferredPanel;
  if (withSpace.length === 0) {
    // Skip older cards that queued pop-ups are already scheduled to replace.
    const oldest = Math.min(...ready.map(index => commentIndexes[index].at(-panelLimit(config, index))));
    panel = queue[oldest].panel;
  } else if (!withSpace.includes(panel)) {
    panel = withSpace[randomInt(withSpace.length)];
  }
  openWall(state, route.group, now, synchronizationMs);
  if (validId(writer) && writers[writer]?.tablet === tablet) delete writers[writer];
  const start = Math.max(now + Math.round(config.leadTime * 1000), state.activeAt, availableAt[panel]);
  const compactAt = start + Math.round(config.spotlight * 1000);
  const occupied = new Set(queue.filter(comment => comment.panel === panel).slice(-(maxComments - 1)).map(comment => comment.slot));
  const freeSlots = Array.from({ length: maxComments }, (_, slot) => slot).filter(slot => !occupied.has(slot));
  const comment = {
    id, name: name.trim().replace(/\s+/g, ' '), message: message.trim().replace(/\s+/g, ' '), profile,
    tablet, panel, scene: postOn(config, panel, state.activeGroup), group: state.activeGroup,
    slot: freeSlots[randomInt(freeSlots.length)], wallMotion: config.wallMotion, tabletMotion: config.tabletMotion,
    liveBackdrop: config.liveBackdrop, start, compactAt, end: compactAt + config.duration * 1000,
    gapMs
  };
  recent[id] = comment;
  queue.push(comment);
  return reply(201, { comment, now });
}

export function operateWall(state, operation, method, input, now, synchronizationMs = 0) {
  advanceWall(state, now, synchronizationMs);
  let result;
  if (operation === 'state' && method === 'GET') return reply(200, wallSnapshot(state, now));
  if (operation === 'settings' && method === 'GET') return reply(200, wallSettings(state));
  if (operation === 'settings' && method === 'PUT') result = saveSettings(state, input, now);
  else if (operation === 'comments' && method === 'POST') result = addComment(state, input, now, synchronizationMs);
  else if (operation === 'writing' && method === 'POST') result = updateWriting(state, input, now, synchronizationMs);
  else return reply(405, { error: 'Method not allowed.' });
  advanceWall(state, now, synchronizationMs);
  return result;
}
