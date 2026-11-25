import { commentFrame, commentObstacles, commentPosition, sideCardWidth } from './scenes.js';

function overlaps(a, b) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 + 0.45 &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2 + 0.42;
}

function sideBounds(post, cardWidth, border) {
  const halfWidth = cardWidth / 2;
  const panelInset = halfWidth + .12;
  const postInset = (post.width + cardWidth) / 2 + border + .15;
  return {
    cardWidth,
    sides: [[panelInset, post.x - postInset], [post.x + postInset, 100 - panelInset]],
    top: post.y - post.height / 2,
    bottom: post.y + post.height / 2
  };
}

export function commentDock(scene, slot, panelHeight, postSize = 100, border = 0) {
  const [, post] = commentObstacles(scene, panelHeight, postSize, border);
  const cardWidth = sideCardWidth(post.width, border);
  const { sides, top, bottom } = sideBounds(post, cardWidth, border);
  const anchor = commentPosition(scene, slot);
  const side = sides[Number(anchor.x >= post.x)];
  const halfHeight = commentFrame(scene, cardWidth) / 2;
  return {
    x: (side[0] + side[1]) / 2,
    y: Math.min(bottom - halfHeight, Math.max(top + halfHeight, anchor.y * panelHeight / 100)) * 100 / panelHeight
  };
}

function packDense(items, scene, fixed, { cardWidth, sides, top, bottom }) {
  const placed = new Map();
  const lanes = sides.map(([left, right]) => ({ x: (left + right) / 2, nextY: top }));
  for (const item of items) {
    const anchor = commentPosition(scene, item.slot);
    const positions = lanes.map(lane => {
      const position = {
        x: lane.x,
        y: lane.nextY + item.height / 2,
        width: cardWidth,
        height: item.height
      };
      let obstruction;
      while ((obstruction = fixed.find(block => overlaps(position, block)))) {
        position.y = obstruction.y + (obstruction.height + position.height) / 2 + .5;
      }
      return { lane, position, score: position.y + Math.abs(anchor.x - position.x) * .08 };
    }).filter(({ position }) => position.y + position.height / 2 <= bottom);
    positions.sort((a, b) => a.score - b.score);
    if (!positions.length) continue;
    const { lane, position } = positions[0];
    lane.nextY = position.y + position.height / 2 + .55;
    placed.set(item.id, position);
  }
  return placed;
}

// Geometry is in hundredths of the panel width. Positions stay reproducible
// across the combined wall and individual outputs.
export function arrangeComments(items, scene, panelHeight, previous, postSize = 100, border = 0) {
  const [logo, post, ...cards] = commentObstacles(scene, panelHeight, postSize, border);
  const fixed = [logo, ...cards];
  const bounds = sideBounds(post, sideCardWidth(post.width, border), border);
  const { cardWidth, sides } = bounds;
  let best = new Map();

  for (let attempt = 0; attempt < 52 && best.size < items.length; attempt += 1) {
    const placed = new Map();
    let random = 739 + attempt * 5791 + scene * 1523;
    const next = () => {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      return random / 2 ** 32;
    };
    for (const item of items) {
      const top = bounds.top + item.height / 2;
      const end = bounds.bottom - item.height / 2;
      if (top > end) continue;
      const occupied = [...fixed, ...placed.values()];
      const anchor = commentPosition(scene, item.slot);
      const preferred = previous.get(item.id) ?? { x: anchor.x, y: anchor.y * panelHeight / 100 };
      let chosen;
      let cost = Infinity;
      for (let sample = 0; sample <= 190; sample += 1) {
        const [left, right] = sides[sample % sides.length];
        const point = sample === 0 && attempt === 0
          ? preferred
          : { x: left + next() * (right - left), y: top + next() * (end - top) };
        const candidate = { ...point, width: cardWidth, height: item.height };
        if (!sides.some(([min, max]) => point.x >= min && point.x <= max) || point.y < top || point.y > end ||
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
      if (chosen) placed.set(item.id, chosen);
    }
    if (placed.size > best.size) best = placed;
  }
  if (best.size < items.length) {
    const dense = packDense(items, scene, fixed, bounds);
    if (dense.size > best.size) return dense;
  }
  return best;
}
