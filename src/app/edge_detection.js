/**
 * Canny Edge Detection and Intersection Finder
 * This script detects edges in an image using the Canny edge detection algorithm
 * and identifies intersections between edges (vertices)
 */

class CannyEdgeDetector {
     constructor(imagePath) {
          this.imagePath = imagePath;
          this.canvas = document.createElement("canvas");
          this.ctx = this.canvas.getContext("2d");
          this.width = 0;
          this.height = 0;
          this.imageData = null;
          this.edges = [];
          this.vertices = [];
     }

     /**
      * Load and process the image
      */
     async loadImage() {
          return new Promise((resolve, reject) => {
               const img = new Image();
               img.crossOrigin = "Anonymous";
               img.onload = () => {
                    this.width = img.width;
                    this.height = img.height;
                    this.canvas.width = this.width;
                    this.canvas.height = this.height;
                    this.ctx.drawImage(img, 0, 0);
                    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
                    resolve();
               };
               img.onerror = reject;
               img.src = this.imagePath;
          });
     }

     /**
      * Convert image to grayscale
      */
     toGrayscale() {
          const data = this.imageData.data;
          const gray = new Uint8ClampedArray(this.width * this.height);

          for (let i = 0; i < data.length; i += 4) {
               const r = data[i];
               const g = data[i + 1];
               const b = data[i + 2];
               // Using luminosity method
               gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
          }

          return gray;
     }

     /**
      * Apply Gaussian blur to reduce noise
      */
     gaussianBlur(gray, kernel = 5, sigma = 1.4) {
          const output = new Uint8ClampedArray(gray.length);
          const gaussianKernel = this.createGaussianKernel(kernel, sigma);
          const half = Math.floor(kernel / 2);

          for (let y = 0; y < this.height; y++) {
               for (let x = 0; x < this.width; x++) {
                    let sum = 0;
                    let weightSum = 0;

                    for (let ky = -half; ky <= half; ky++) {
                         for (let kx = -half; kx <= half; kx++) {
                              const px = x + kx;
                              const py = y + ky;

                              if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                                   const weight = gaussianKernel[ky + half][kx + half];
                                   sum += gray[py * this.width + px] * weight;
                                   weightSum += weight;
                              }
                         }
                    }

                    output[y * this.width + x] = sum / weightSum;
               }
          }

          return output;
     }

     /**
      * Create Gaussian kernel
      */
     createGaussianKernel(size, sigma) {
          const kernel = [];
          const half = Math.floor(size / 2);
          let sum = 0;

          for (let y = -half; y <= half; y++) {
               kernel[y + half] = [];
               for (let x = -half; x <= half; x++) {
                    const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
                    kernel[y + half][x + half] = value;
                    sum += value;
               }
          }

          // Normalize
          for (let y = 0; y < size; y++) {
               for (let x = 0; x < size; x++) {
                    kernel[y][x] /= sum;
               }
          }

          return kernel;
     }

     /**
      * Compute gradients using Sobel operator
      */
     sobelOperator(gray) {
          const Gx = new Float32Array(gray.length);
          const Gy = new Float32Array(gray.length);
          const magnitude = new Float32Array(gray.length);
          const direction = new Float32Array(gray.length);

          // Sobel kernels
          const sobelX = [
               [-1, 0, 1],
               [-2, 0, 2],
               [-1, 0, 1],
          ];
          const sobelY = [
               [-1, -2, -1],
               [0, 0, 0],
               [1, 2, 1],
          ];

          for (let y = 1; y < this.height - 1; y++) {
               for (let x = 1; x < this.width - 1; x++) {
                    let gx = 0;
                    let gy = 0;

                    for (let ky = -1; ky <= 1; ky++) {
                         for (let kx = -1; kx <= 1; kx++) {
                              const pixel = gray[(y + ky) * this.width + (x + kx)];
                              gx += pixel * sobelX[ky + 1][kx + 1];
                              gy += pixel * sobelY[ky + 1][kx + 1];
                         }
                    }

                    const idx = y * this.width + x;
                    Gx[idx] = gx;
                    Gy[idx] = gy;
                    magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
                    direction[idx] = Math.atan2(gy, gx);
               }
          }

          return { magnitude, direction };
     }

     /**
      * Non-maximum suppression
      */
     nonMaximumSuppression(magnitude, direction) {
          const output = new Float32Array(magnitude.length);

          for (let y = 1; y < this.height - 1; y++) {
               for (let x = 1; x < this.width - 1; x++) {
                    const idx = y * this.width + x;
                    const angle = (direction[idx] * 180) / Math.PI;
                    let normalizedAngle = angle < 0 ? angle + 180 : angle;

                    let q = 255,
                         r = 255;

                    // 0 degrees
                    if (
                         (0 <= normalizedAngle && normalizedAngle < 22.5) ||
                         (157.5 <= normalizedAngle && normalizedAngle <= 180)
                    ) {
                         q = magnitude[y * this.width + (x + 1)];
                         r = magnitude[y * this.width + (x - 1)];
                    }
                    // 45 degrees
                    else if (22.5 <= normalizedAngle && normalizedAngle < 67.5) {
                         q = magnitude[(y + 1) * this.width + (x - 1)];
                         r = magnitude[(y - 1) * this.width + (x + 1)];
                    }
                    // 90 degrees
                    else if (67.5 <= normalizedAngle && normalizedAngle < 112.5) {
                         q = magnitude[(y + 1) * this.width + x];
                         r = magnitude[(y - 1) * this.width + x];
                    }
                    // 135 degrees
                    else if (112.5 <= normalizedAngle && normalizedAngle < 157.5) {
                         q = magnitude[(y - 1) * this.width + (x - 1)];
                         r = magnitude[(y + 1) * this.width + (x + 1)];
                    }

                    if (magnitude[idx] >= q && magnitude[idx] >= r) {
                         output[idx] = magnitude[idx];
                    } else {
                         output[idx] = 0;
                    }
               }
          }

          return output;
     }

     /**
      * Double threshold and edge tracking by hysteresis
      */
     doubleThreshold(nms, lowThresholdRatio = 0.05, highThresholdRatio = 0.15) {
          // Find max value without spread operator (avoids stack overflow for large arrays)
          let maxVal = 0;
          for (let i = 0; i < nms.length; i++) {
               if (nms[i] > maxVal) {
                    maxVal = nms[i];
               }
          }

          const highThreshold = maxVal * highThresholdRatio;
          const lowThreshold = maxVal * lowThresholdRatio;

          const strong = 255;
          const weak = 75;

          const output = new Uint8ClampedArray(nms.length);

          for (let i = 0; i < nms.length; i++) {
               if (nms[i] >= highThreshold) {
                    output[i] = strong;
               } else if (nms[i] >= lowThreshold) {
                    output[i] = weak;
               } else {
                    output[i] = 0;
               }
          }

          return { output, strong, weak };
     }

     /**
      * Edge tracking by hysteresis
      */
     hysteresis(img, weak, strong = 255) {
          const output = new Uint8ClampedArray(img);

          for (let y = 1; y < this.height - 1; y++) {
               for (let x = 1; x < this.width - 1; x++) {
                    const idx = y * this.width + x;

                    if (img[idx] === weak) {
                         let hasStrongNeighbor = false;

                         for (let dy = -1; dy <= 1; dy++) {
                              for (let dx = -1; dx <= 1; dx++) {
                                   if (dx === 0 && dy === 0) continue;

                                   const nIdx = (y + dy) * this.width + (x + dx);
                                   if (img[nIdx] === strong) {
                                        hasStrongNeighbor = true;
                                        break;
                                   }
                              }
                              if (hasStrongNeighbor) break;
                         }

                         output[idx] = hasStrongNeighbor ? strong : 0;
                    }
               }
          }

          return output;
     }

     /**
      * Main Canny edge detection process
      */
     async detectEdges() {
          await this.loadImage();

          console.log("Step 1: Converting to grayscale...");
          const gray = this.toGrayscale();

          console.log("Step 2: Applying Gaussian blur...");
          const blurred = this.gaussianBlur(gray);

          console.log("Step 3: Computing gradients...");
          const { magnitude, direction } = this.sobelOperator(blurred);

          console.log("Step 4: Non-maximum suppression...");
          const nms = this.nonMaximumSuppression(magnitude, direction);

          console.log("Step 5: Double threshold...");
          const { output: threshold, strong, weak } = this.doubleThreshold(nms);

          console.log("Step 6: Edge tracking by hysteresis...");
          this.edges = this.hysteresis(threshold, weak, strong);

          console.log("Edge detection complete!");
          return this.edges;
     }

     /**
      * Find vertices (intersections between edges)
      */
     findVertices(minNeighbors = 3) {
          this.vertices = [];
          const visited = new Set();

          for (let y = 2; y < this.height - 2; y++) {
               for (let x = 2; x < this.width - 2; x++) {
                    const idx = y * this.width + x;

                    if (this.edges[idx] === 255) {
                         // Count edge neighbors in 8 directions
                         let edgeCount = 0;
                         const directions = [
                              [-1, -1],
                              [-1, 0],
                              [-1, 1],
                              [0, -1],
                              [0, 1],
                              [1, -1],
                              [1, 0],
                              [1, 1],
                         ];

                         for (const [dy, dx] of directions) {
                              const nIdx = (y + dy) * this.width + (x + dx);
                              if (this.edges[nIdx] === 255) {
                                   edgeCount++;
                              }
                         }

                         // A vertex is a point where multiple edges meet
                         // We look for points with at least minNeighbors edge neighbors
                         // that aren't just part of a straight line
                         if (edgeCount >= minNeighbors) {
                              // Check if edges are in different directions (not just a line)
                              const segments = this.countEdgeSegments(x, y);
                              if (segments >= 3) {
                                   this.vertices.push({ x, y });
                              }
                         }
                    }
               }
          }

          console.log(`Found ${this.vertices.length} vertices`);
          return this.vertices;
     }

     /**
      * Count distinct edge segments around a point
      */
     countEdgeSegments(x, y) {
          const directions = [
               [-1, -1],
               [-1, 0],
               [-1, 1],
               [0, -1],
               [0, 1],
               [1, -1],
               [1, 0],
               [1, 1],
          ];

          const neighbors = directions.map(([dy, dx]) => {
               const nIdx = (y + dy) * this.width + (x + dx);
               return this.edges[nIdx] === 255 ? 1 : 0;
          });

          // Count transitions from non-edge to edge (segments)
          let segments = 0;
          for (let i = 0; i < neighbors.length; i++) {
               const curr = neighbors[i];
               const prev = neighbors[(i - 1 + neighbors.length) % neighbors.length];
               if (curr === 1 && prev === 0) {
                    segments++;
               }
          }

          return segments;
     }

     /**
      * Display the result with edges in red and vertices as blue circles
      */
     displayResult(targetCanvasId) {
          const displayCanvas = document.getElementById(targetCanvasId);
          if (!displayCanvas) {
               console.error(`Canvas with id '${targetCanvasId}' not found`);
               return;
          }

          displayCanvas.width = this.width;
          displayCanvas.height = this.height;
          const displayCtx = displayCanvas.getContext("2d");

          // Draw original image
          displayCtx.drawImage(this.canvas, 0, 0);

          // Overlay edges in red
          const overlayData = displayCtx.getImageData(0, 0, this.width, this.height);
          for (let i = 0; i < this.edges.length; i++) {
               if (this.edges[i] === 255) {
                    const idx = i * 4;
                    overlayData.data[idx] = 255; // R
                    overlayData.data[idx + 1] = 0; // G
                    overlayData.data[idx + 2] = 0; // B
                    overlayData.data[idx + 3] = 255; // A
               }
          }
          displayCtx.putImageData(overlayData, 0, 0);

          // Draw vertices as blue circles
          displayCtx.fillStyle = "blue";
          displayCtx.strokeStyle = "white";
          displayCtx.lineWidth = 1;

          for (const vertex of this.vertices) {
               displayCtx.beginPath();
               displayCtx.arc(vertex.x, vertex.y, 4, 0, 2 * Math.PI);
               displayCtx.fill();
               displayCtx.stroke();
          }

          console.log("Result displayed!");
     }

     /**
      * Process the entire pipeline
      * @param {string|null} targetCanvasId - Canvas ID for display (optional if display=false)
      * @param {boolean} display - Whether to display the result visually
      */
     async process(targetCanvasId = null, display = false) {
          try {
               console.log("Starting edge detection...");
               await this.detectEdges();

               console.log("Finding vertices...");
               this.findVertices();

               if (display && targetCanvasId) {
                    console.log("Displaying result...");
                    this.displayResult(targetCanvasId);
               }

               return {
                    edges: this.edges,
                    vertices: this.vertices,
                    width: this.width,
                    height: this.height,
               };
          } catch (error) {
               console.error("Error processing image:", error);
               throw error;
          }
     }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
     module.exports = CannyEdgeDetector;
}

// Example usage function
async function processImage(imagePath, canvasId = "resultCanvas", display = false) {
     const detector = new CannyEdgeDetector(imagePath);
     const result = await detector.process(canvasId, display);

     console.log(`Processing complete!`);
     console.log(`Image dimensions: ${result.width}x${result.height}`);
     console.log(`Total vertices found: ${result.vertices.length}`);

     return result;
}

// For browser testing
if (typeof window !== "undefined") {
     window.CannyEdgeDetector = CannyEdgeDetector;
     window.processImage = processImage;
}
