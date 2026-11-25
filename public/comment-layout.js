import { commentObstacles, commentPosition, commentWidth } from './scenes.js';

function overlaps(a, b) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 + 0.45 &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2 + 0.42;
}

function packDense(items, scene, fixed, bottom) {
  const placed = new Map();
  const lanes = [16.5, 50, 83.5].map(x => ({ x, nextY: 3.2 }));
  for (const item of items) {
    const anchor = commentPosition(scene, item.slot);
    const positions = lanes.map(lane => {
      const jitter = (item.slot % 7 - 3) * .48;
      const position = {
        x: lane.x + jitter,
        y: lane.nextY + item.height / 2 + (item.slot % 4) * .16,
        width: commentWidth,
        height: item.height
      };
      let obstruction;
      while ((obstruction = fixed.find(block => overlaps(position, block)))) {
        position.y = obstruction.y + (obstruction.height + position.height) / 2 + .5;
      }
      return { lane, position, score: position.y + Math.abs(anchor.x - position.x) * .08 };
    }).filter(({ position }) => position.y + position.height / 2 <= bottom);
    positions.sort((a, b) => a.score - b.score);
    if (!positions.length) break;
    const { lane, position } = positions[0];
    lane.nextY = position.y + position.height / 2 + .55;
    placed.set(item.id, position);
  }
  return placed;
}

// Geometry is in hundredths of the panel width. Positions stay reproducible
// across the combined wall and individual outputs.
export function arrangeComments(items, scene, panelHeight, previous) {
  const fixed = commentObstacles(scene, panelHeight);
  const foreground = [fixed[0], ...fixed.slice(2)];
  const left = commentWidth / 2 + 1.4;
  const right = 100 - left;
  const bottom = panelHeight - 10.8;
  let best = new Map();

  for (let attempt = 0; attempt < 52 && best.size < items.length; attempt += 1) {
    const placed = new Map();
    let random = 739 + attempt * 5791 + scene * 1523;
    const next = () => {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      return random / 2 ** 32;
    };
    for (const item of items) {
      const top = item.height / 2 + 3.2;
      const end = bottom - item.height / 2;
      // If the side areas fill up, use the post area while protecting the
      // logo and the original comment cards.
      const artwork = attempt < 34 ? fixed : foreground;
      const occupied = [...artwork, ...placed.values()];
      const anchor = commentPosition(scene, item.slot);
      const preferred = previous.get(item.id) ?? { x: anchor.x, y: anchor.y * panelHeight / 100 };
      let chosen;
      let cost = Infinity;
      for (let sample = 0; sample <= 190; sample += 1) {
        const point = sample === 0 && attempt === 0
          ? preferred
          : { x: left + next() * (right - left), y: top + next() * (end - top) };
        const candidate = { ...point, width: commentWidth, height: item.height };
        if (point.x < left || point.x > right || point.y < top || point.y > end ||
            occupied.some(other => overlaps(candidate, other))) continue;
        if (attempt > 0) {
          chosen = candidate;
          break;
        }
        const distance = Math.hypot(point.x - preferred.x, point.y - preferred.y);
        // Penalize nearly aligned neighbors without forcing an artificial grid.
        const alignment = [...placed.values()].reduce((sum, other) =>
          sum + Math.max(0, 1.6 - Math.abs(point.x - other.x)) +
          Math.max(0, 1.2 - Math.abs(point.y - other.y)), 0);
        if (distance + alignment < cost) {
          chosen = candidate;
          cost = distance + alignment;
          if (cost === 0) break;
        }
      }
      if (!chosen) break;
      placed.set(item.id, chosen);
    }
    if (placed.size > best.size) best = placed;
  }
  if (best.size < items.length) {
    const dense = packDense(items, scene, foreground, bottom);
    if (dense.size > best.size) return dense;
  }
  return best;
}
