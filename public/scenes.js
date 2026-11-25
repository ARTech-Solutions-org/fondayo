const source = '/design/design';
export const tabletAsset = number => `${source}/tablet/Asset%20${number}.png`;

// Layout coordinates are measured in a 960 × 540 reference of the supplied exports.
const postArtworkWidth = 396;
const postArtworkX = 480;
const postArtworkY = 284;
const commentArtworkWidth = 278;
const visibleCardMargin = commentArtworkWidth / 2 + 3;
const postLayouts = [
  { background: 65, cards: [[62, 189, 230], [60, 164, 383], [63, 772, 205], [59, 805, 314], [61, 757, 418]] },
  { background: 80, cards: [[78, 190, 165], [77, 154, 287], [75, 193, 420], [76, 781, 273], [72, 762, 424]] },
  { background: 148, cards: [[145, 196, 225], [144, 154, 324], [143, 770, 188], [142, 806, 293], [141, 770, 398]] },
  { background: 162, cards: [[159, 189, 230], [157, 164, 383], [160, 772, 205], [156, 805, 314], [158, 757, 418]] },
  { background: 178, cards: [[174, 195, 227], [173, 154, 325], [172, 770, 190], [171, 806, 293], [170, 770, 400]] },
  { background: 194, cards: [[192, 196, 225], [191, 154, 324], [190, 770, 188], [189, 806, 293], [188, 770, 398]] },
].map(layout => ({
  ...layout,
  // Make room for the wider post while keeping the original stagger on each side.
  cards: layout.cards.map(([asset, x, y]) => [asset, x < postArtworkX ? 142 + (x - 154) / 3 : 818 - (806 - x) / 3, y])
}));
const idleLayouts = [
  { title: [31, 454, 229, 686], subtitle: [30, 454, 391, 686], background: 32 },
  { title: [40, 480, 238, 860], subtitle: [39, 480, 393, 686], background: 41 },
  { title: [49, 480, 229, 686], subtitle: [48, 480, 391, 776], background: 50 },
];

const common = `${source}/screen%20sever%20post%201/screen-saver1`;
const asset = (folder, number) => `${folder}/Asset%20${number}.png`;
const postAssets = [
  { frame: 64, width: 429, height: 602 },
  { frame: 74, width: 429, height: 602, photo: 73, photoRect: [18, 106, 395, 326] },
  { frame: 147, width: 441, height: 615, photo: 140, photoRect: [20, 109, 395, 326] },
  { frame: 161, width: 429, height: 602 },
  { frame: 176, width: 440, height: 615, photo: 175, photoRect: [20, 109, 395, 326] },
  { frame: 20, width: 441, height: 614 }
];

export function postArtwork(scene, className, label = '') {
  const { frame, width, height, photo, photoRect } = postAssets[scene - 1];
  const folder = `${source}/post1/screen${scene}`;
  const post = document.createElement('div');
  post.className = `post-artwork ${className}`;
  post.dataset.postScene = scene;
  post.style.aspectRatio = `${width} / ${height}`;
  if (label) {
    post.setAttribute('role', 'img');
    post.setAttribute('aria-label', label);
  }

  const artwork = document.createElement('img');
  artwork.src = asset(folder, frame);
  artwork.alt = '';
  artwork.draggable = false;
  post.append(artwork);
  if (photoRect) {
    const [x, y, photoWidth, photoHeight] = photoRect;
    const image = document.createElement('img');
    image.className = 'post-photo';
    image.src = asset(folder, photo);
    image.alt = '';
    image.draggable = false;
    image.style.left = `${100 * x / width}%`;
    image.style.top = `${100 * y / height}%`;
    image.style.width = `${100 * photoWidth / width}%`;
    image.style.height = `${100 * photoHeight / height}%`;
    post.append(image);
  }
  return post;
}

// Preferred scatter anchors. The placement engine adjusts them to fit the artwork.
const commentSlots = [
  [[75.4, 15.4], [14.4, 16.7], [47.5, 21.2], [71, 24.2], [25.4, 24.9], [86.3, 30.3], [23.9, 32.4], [84.2, 46.5], [11.8, 49.7], [26.5, 57.6], [17.9, 63.9], [76.5, 66.5], [44.7, 71.6], [43.1, 77.9], [20.7, 79.8], [48.7, 84]],
  [[84.3, 15.7], [15.7, 17.3], [38.9, 20.7], [64.1, 22.4], [85.4, 24.7], [87.9, 32.7], [12.9, 38.1], [72.4, 41.8], [24.9, 44.4], [78.4, 58], [27, 60.6], [73.9, 64.7], [22.6, 67.8], [81.9, 70.8], [51.6, 75], [48.8, 82.1]],
  [[31.4, 15.3], [71, 17.9], [13.4, 21.5], [35, 23.6], [61.2, 25.8], [83.1, 27], [27.9, 33.6], [73.6, 45.5], [12, 50.3], [82.1, 61.2], [24.7, 67], [44.7, 74.2], [17.7, 77], [57.3, 80.5], [87.9, 82.3], [20.6, 83.6]],
  [[78.2, 16.5], [34.4, 21.1], [87, 22.9], [63.5, 25], [38.7, 27.7], [85.1, 29.4], [18.8, 34.4], [88, 45.1], [12.7, 49.5], [72, 51.3], [17.8, 56.3], [16.2, 62.8], [73.5, 70.6], [47.2, 73.9], [40.4, 82.4], [13.8, 83.3]],
  [[13.5, 15.7], [82.2, 19.3], [60.6, 22.5], [28.3, 23.3], [84.2, 25.6], [51.4, 29.3], [25.8, 32.1], [72.9, 45.7], [24.5, 53.2], [78, 64.9], [11.6, 68.6], [49.3, 74.5], [18, 75.9], [42.4, 81.8], [87.8, 82.4], [64.3, 83.2]],
  [[29.5, 15.7], [61.5, 20.8], [84, 21.8], [11.4, 24.6], [39.5, 26.2], [70.2, 27.9], [35.4, 33.5], [15.2, 51.6], [43.7, 62.3], [73.2, 64.8], [50.8, 69], [26, 70.3], [47.8, 76.3], [21.8, 78.2], [86.8, 80.7], [64.2, 83.7]],
];

export function commentPosition(scene, slot) {
  const [x, y] = commentSlots[scene - 1][slot];
  return { x, y };
}

export const commentWidth = commentArtworkWidth / 9.6;
export const defaultPostBorder = 1.5;
const frameSizes = [[500, 112], [503, 113], [497, 106], [500, 112], [497, 106], [497, 106]];

export function commentFrame(scene, cardWidth = commentWidth) {
  const [width, height] = frameSizes[scene - 1];
  return height * cardWidth / width;
}

const postAspectHeights = postAssets.map(({ height, width }) => height / width);

export function postWidth(size = 100, panelHeight = 100, border = 0) {
  const requested = postArtworkWidth / 9.6 * size / 100;
  if (!border) return requested;
  const center = panelHeight * postArtworkY / 540;
  const logoBottom = panelHeight * 68 / 540 + 7.55 / 2;
  const footerTop = panelHeight - 10.3;
  const available = Math.min(center - logoBottom, footerTop - center);
  return Math.min(requested, 2 * (available - border) / Math.max(...postAspectHeights));
}

export function sideCardWidth(width, border) {
  return Math.min(commentWidth, (100 - width) / 2 - border - .35);
}

export function storyCardX(x, width, border) {
  if (!border) return x;
  const inset = sideCardWidth(width, border) / 2;
  const maxLeft = (100 - width) / 2 - border - inset - .15;
  const minLeft = inset + .12;
  return x < 50 ? Math.max(minLeft, Math.min(maxLeft, x))
    : Math.max(100 - maxLeft, Math.min(100 - minLeft, x));
}

export function commentObstacles(scene, height, size = 100, border = 0) {
  const { cards } = postLayouts[scene - 1];
  const width = postWidth(size, height, border);
  const storyWidth = border ? sideCardWidth(width, border) : commentWidth;
  return [
    { x: 50, y: height * 68 / 540, width: 14.4, height: 7.55 },
    { x: postArtworkX / 9.6, y: height * postArtworkY / 540, width, height: width * postAspectHeights[scene - 1] },
    ...cards.map(([, x, y]) => ({ x: storyCardX(x / 9.6, width, border), y: height * y / 540, width: storyWidth, height: storyWidth * .234 }))
  ];
}

function positionArtwork(element, x, y, width) {
  element.classList.add('art');
  element.style.setProperty('--x', `${x / 9.6}%`);
  element.style.setProperty('--y', `${y / 5.4}%`);
  element.style.setProperty('--size', `${width / 9.6}cqw`);
  return element;
}

export function artwork(src, x, y, width, className, alt = '') {
  const image = document.createElement('img');
  image.className = className;
  image.src = src;
  image.alt = alt;
  image.draggable = false;
  return positionArtwork(image, x, y, width);
}

export function makePanel(index) {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.dataset.panel = index + 1;
  panel.setAttribute('aria-label', `LED screen ${index + 1}`);
  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  const logo = artwork(asset(common, 29), 480, 68, 138, 'wall-logo', 'Foundayo (orforglipron), a Lilly Medicine');
  const footer = document.createElement('div');
  footer.className = 'wall-footer';
  footer.append(
    artwork(asset(common, 26), 37, 0, 894, 'qr', 'QR codes for abbreviated prescribing information and privacy policy'),
    artwork(asset(common, 25), 112, 21, 334, 'footer-text'),
    artwork(asset(common, 24), 457, 37, 326, 'footer-text'),
  );
  const sceneStage = document.createElement('div');
  sceneStage.className = 'scene-stage';
  const idleScenes = idleLayouts.map((idle, offset) => {
    const folder = `${source}/screen%20sever%20post%201/screen-saver${offset + 1}`;
    const scene = document.createElement('div');
    scene.dataset.scene = 0;
    scene.dataset.saver = offset + 1;
    scene.style.backgroundImage = `url("${asset(folder, idle.background)}")`;
    scene.append(
      artwork(asset(common, 28), 0, 0, 131, 'edge edge-top'),
      artwork(asset(common, 27), 960, 540, 127, 'edge edge-bottom'),
    );
    for (const [spec, className] of [[idle.title, 'idle-title'], [idle.subtitle, 'idle-subtitle']]) {
      const [number, x, y, width] = spec;
      scene.append(artwork(asset(folder, number), x, y, width, className));
    }
    return scene;
  });
  backdrop.style.backgroundImage = idleScenes[index].style.backgroundImage;
  const scenes = [];
  const stories = [];
  for (const [offset, layout] of postLayouts.entries()) {
    const number = offset + 1;
    const scene = document.createElement('div');
    const story = document.createElement('div');
    story.className = 'story-layer';
    story.hidden = true;
    scene.dataset.scene = number;
    scene.style.setProperty('--post-aspect-height', postAspectHeights[offset]);
    const decorations = document.createElement('div');
    decorations.className = 'post-decorations';
    const folder = `${source}/post1/screen${number}`;
    if (number === 2 || number === 5) {
      decorations.append(artwork(asset(folder, number === 2 ? 79 : 177), -8, 540, 244, 'edge edge-lower-left'));
    } else {
      decorations.append(
        artwork(asset(common, 28), 0, 0, 131, 'edge edge-top'),
        artwork(asset(common, 27), 960, 540, 127, 'edge edge-bottom'),
      );
    }
    const x = postArtworkX;
    const y = postArtworkY;
    const post = positionArtwork(postArtwork(number, 'post-body', 'Campaign social post'), x, y, postArtworkWidth);
    scene.append(decorations, post);
    const leftCards = layout.cards.filter(([, cardX]) => cardX < x);
    const rightCards = layout.cards.filter(([, cardX]) => cardX >= x);
    // Feather the hidden center just beyond the settled card edges.
    story.style.setProperty('--story-left', `${(Math.max(...leftCards.map(([, cardX]) => cardX)) + visibleCardMargin) / 9.6}%`);
    story.style.setProperty('--story-right', `${(Math.min(...rightCards.map(([, cardX]) => cardX)) - visibleCardMargin) / 9.6}%`);
    for (const [side, cards] of [leftCards, rightCards].entries()) {
      cards.sort((a, b) => Math.abs(a[2] - y) - Math.abs(b[2] - y));
      for (const [order, [id, cardX, cardY]] of cards.entries()) {
        const card = artwork(asset(folder, id), cardX, cardY, commentArtworkWidth, 'story-card');
        card.dataset.referenceX = cardX / 9.6;
        card.style.setProperty('--story-from-x', `${(x - cardX) / 9.6}cqw`);
        card.style.setProperty('--story-from-y', `calc(var(--panel-height) * ${(y - cardY) * 0.48 / 540})`);
        card.style.setProperty('--story-delay', `${order * 105 + side * 32}ms`);
        story.append(card);
      }
    }
    scenes.push(scene);
    stories.push(story);
  }
  for (const scene of [...idleScenes, ...scenes]) {
    scene.className = 'scene';
    scene.hidden = true;
    sceneStage.append(scene);
  }
  const liveStage = document.createElement('div');
  liveStage.className = 'live-stage';
  const compactLayers = scenes.map(() => {
    const compactStage = document.createElement('div');
    compactStage.className = 'compact-stage';
    compactStage.hidden = true;
    compactStage.setAttribute('aria-label', 'Recent audience comments');
    return { compactStage, compactCards: new Map() };
  });
  panel.append(backdrop, sceneStage, logo, footer, ...stories, ...compactLayers.map(layer => layer.compactStage), liveStage);
  return { panel, idleScenes, scenes, stories, compactLayers, liveStage, scene: null, story: null, compact: null, comment: null };
}
