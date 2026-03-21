export function analyzeLuminanceGrid(imageData: ImageData): number[] {
  const { data, width, height } = imageData;
  const gridSize = 4;
  const grid = new Array(gridSize * gridSize).fill(0);
  const counts = new Array(gridSize * gridSize).fill(0);

  const cellW = width / gridSize;
  const cellH = height / gridSize;

  for (let y = 0; y < height; y++) {
    const row = Math.min(gridSize - 1, Math.floor(y / cellH));
    for (let x = 0; x < width; x++) {
      const col = Math.min(gridSize - 1, Math.floor(x / cellW));
      const idx = (y * width + x) * 4;
      const luminance = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
      const cellIdx = row * gridSize + col;
      grid[cellIdx] += luminance;
      counts[cellIdx]++;
    }
  }

  for (let i = 0; i < grid.length; i++) {
    grid[i] = counts[i] > 0 ? grid[i] / counts[i] / 255 : 0;
  }

  return grid;
}
