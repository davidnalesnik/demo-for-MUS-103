const input = document.getElementById('displacements');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.font = '16px Arial';

// VARIABLES FOR LINES
const semitoneVerticalSpacing = 50;
const solfegeLineLength = 100;

const melodyLineLength = 60;
const melodyLineSeparation = 10;

const majorScaleSemitones = [0, 2, 4, 5, 7, 9, 11, 12];
const majorScaleSolfege = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];

const majorScaleVerticalPositions = majorScaleSemitones.map(
  (semitone) =>
    semitoneVerticalSpacing * 2 +
    12 * semitoneVerticalSpacing -
    semitone * semitoneVerticalSpacing
);

function drawReferenceLines() {
  ctx.fillStyle = 'green';

  majorScaleSemitones.forEach((_semitone, idx) => {
    const y = majorScaleVerticalPositions[idx];

    ctx.fillRect(0, y - 2, solfegeLineLength, 4);
    ctx.fillText(majorScaleSolfege[idx], 5, y - 5);
  });
}

let melodySemitonePattern;

const melodyXStart = canvas.width / 6; // Start drawing melody from 1/4th of canvas width

let melodyRange;

let currentY = 0;

let isDragging = false;
let dragStartY = 0;
let melodyOffsetY = semitoneVerticalSpacing * -6; // Initial vertical offset to position melody

drawReferenceLines();

function reset() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw staff lines and labels
  drawReferenceLines();

  currentY = 0;
  dragStartY = 0;
  melodyOffsetY = semitoneVerticalSpacing * -6; // Initial vertical offset to position melody
}

function main() {
  const melodyAbsoluteSemitones = [];

  // Convert to absolute semitone values
  melodySemitonePattern.reduce((acc, step) => {
    const absolute = acc + step;

    melodyAbsoluteSemitones.push(absolute);

    return absolute;
  }, 0);

  melodyAbsoluteSemitones.forEach((_semitone, idx) => {
    melodyAbsoluteSemitones[idx] += Math.min(...melodyAbsoluteSemitones) * -1;
  });

  melodyRange =
    Math.max(...melodyAbsoluteSemitones) - Math.min(...melodyAbsoluteSemitones);

  currentY = majorScaleVerticalPositions[0] + melodyOffsetY;

  let melodyX = melodyXStart; // Initial X position for melody notes

  ctx.fillStyle = 'blue'; // Color for melody notes

  // draw short horizontal lines for melody make whole melody draggable vertically
  melodySemitonePattern.forEach((step) => {
    const nextY = currentY - step * semitoneVerticalSpacing;

    ctx.fillRect(melodyX, nextY - 2, melodyLineLength, 4);

    currentY = nextY;
    melodyX += melodyLineLength + melodyLineSeparation; // Move right for next note
  });
}

// Add pointer event listeners for dragging the melody vertically

function redrawCanvas(userLineColor = 'blue') {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw staff lines and labels
  drawReferenceLines();

  // Redraw melody notes with vertical offset
  ctx.fillStyle = userLineColor;

  currentY = majorScaleVerticalPositions[0] + melodyOffsetY; // Apply vertical offset
  let melodyX = melodyXStart; // Reset X position for melody notes

  melodySemitonePattern.forEach((step) => {
    const nextY = currentY - step * semitoneVerticalSpacing; // Calculate Y position of next melody note

    ctx.fillRect(melodyX, nextY - 2, melodyLineLength, 4);

    currentY = nextY;
    melodyX += melodyLineLength + melodyLineSeparation;
  });
}

function checkMelodyAlignment() {
  const tolerance = 5; // pixels
  let allAligned = true;

  let currentY = majorScaleVerticalPositions[0] + melodyOffsetY; // Apply vertical offset

  for (let i = 0; i < melodySemitonePattern.length; i++) {
    const step = melodySemitonePattern[i];
    const nextY = currentY - step * semitoneVerticalSpacing;

    // Check if nextY is close to any staff line
    const isAligned = majorScaleVerticalPositions.some(
      (lineY) => Math.abs(lineY - nextY) <= tolerance
    );

    if (!isAligned) {
      allAligned = false;
      break;
    }

    currentY = nextY;
  }

  if (allAligned) {
    console.log('all aligned!');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw staff lines and labels
    drawReferenceLines();

    // snap melody to staff lines
    currentY = majorScaleVerticalPositions[0] + melodyOffsetY; // Reset currentY

    let melodyX = melodyXStart; // Reset X position for melody notes

    ctx.fillStyle = 'green'; // Color for melody notes

    melodySemitonePattern.forEach((step) => {
      const nextY = currentY - step * semitoneVerticalSpacing;

      // Find the closest staff line to snap to
      let closestLineY = majorScaleVerticalPositions[0];
      let minDiff = Math.abs(closestLineY - nextY);

      majorScaleVerticalPositions.forEach((lineY) => {
        const diff = Math.abs(lineY - nextY);
        if (diff < minDiff) {
          minDiff = diff;
          closestLineY = lineY;
        }
      });

      ctx.fillRect(melodyX, closestLineY - 2, melodyLineLength, 4);

      currentY = closestLineY;
      melodyX += melodyLineLength + melodyLineSeparation; // Move right for next note
    });
  }
}

// EVENT LISTENERS

document.getElementById('show-melody').addEventListener('click', () => {
  melodySemitonePattern = input.value.split(' ').map((s) => parseInt(s, 10));

  main();
});

document.getElementById('reset').addEventListener('click', () => {
  reset();
});

canvas.addEventListener('pointerup', checkMelodyAlignment);

canvas.addEventListener('pointerdown', (e) => {
  const canvasRect = canvas.getBoundingClientRect();
  const xInCanvas = e.clientX - canvasRect.left;

  if (
    xInCanvas >= melodyXStart &&
    xInCanvas <=
      melodyXStart +
        melodySemitonePattern.length * (melodyLineLength + melodyLineSeparation)
  ) {
    isDragging = true;
    dragStartY = e.clientY;
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (isDragging) {
    const deltaY = e.clientY - dragStartY;
    melodyOffsetY += deltaY;
    dragStartY = e.clientY;
    redrawCanvas();
  }
});

canvas.addEventListener('pointerup', () => {
  isDragging = false;
});

canvas.addEventListener('pointerleave', () => {
  isDragging = false;
});
