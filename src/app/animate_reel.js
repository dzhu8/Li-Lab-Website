// Configuration
const config = {
     reelImagePath: '../assets/lab_members_gallery/film_reel_asset.jpg',
     frameImagePaths: [
          '../assets/lab_members_gallery/Highlight_1.jpg',
          '../assets/lab_members_gallery/Highlight_2.jpg',
          '../assets/lab_members_gallery/Highlight_3.jpg',
          '../assets/lab_members_gallery/Highlight_4.jpg',
          '../assets/lab_members_gallery/Highlight_5.jpg',
     ],
     scrollSpeed: 0.4, // pixels per frame
     containerHeight: 1200, // pixels
     containerWidth: 400, // pixels
     reelSpacing: 40, // pixels between reel instances
     scaleFactor: 1.5, // scaling factor for canvas and all contents (1.0 = original size)
};

const frames = {
     imageWidth: 256,
     imageHeight: 938,
     coordinateSystem: "origin at bottom-left, x increases right, y increases up",
     points: [
          {
               x: 43,
               y: 929,
          },
          {
               x: 217,
               y: 929,
          },
          {
               x: 217,
               y: 754,
          },
          {
               x: 43,
               y: 754,
          },
          {
               x: 43,
               y: 742,
          },
          {
               x: 217,
               y: 742,
          },
          {
               x: 217,
               y: 568,
          },
          {
               x: 43,
               y: 568,
          },
          {
               x: 43,
               y: 555,
          },
          {
               x: 217,
               y: 555,
          },
          {
               x: 217,
               y: 381,
          },
          {
               x: 43,
               y: 381,
          },
          {
               x: 43,
               y: 369,
          },
          {
               x: 216,
               y: 369,
          },
          {
               x: 216,
               y: 195,
          },
          {
               x: 43,
               y: 195,
          },
          {
               x: 43,
               y: 182,
          },
          {
               x: 217,
               y: 182,
          },
          {
               x: 217,
               y: 8,
          },
          {
               x: 43,
               y: 8,
          },
     ],
     shapes: [
          {
               points: [0, 1, 2, 3],
               edges: [
                    [0, 1],
                    [1, 2],
                    [2, 3],
                    [3, 0],
               ],
          },
          {
               points: [4, 5, 6, 7],
               edges: [
                    [4, 5],
                    [5, 6],
                    [6, 7],
                    [7, 4],
               ],
          },
          {
               points: [8, 9, 10, 11],
               edges: [
                    [8, 9],
                    [9, 10],
                    [10, 11],
                    [11, 8],
               ],
          },
          {
               points: [12, 13, 14, 15],
               edges: [
                    [12, 13],
                    [13, 14],
                    [14, 15],
                    [15, 12],
               ],
          },
          {
               points: [16, 17, 18, 19],
               edges: [
                    [16, 17],
                    [17, 18],
                    [18, 19],
                    [19, 16],
               ],
          },
     ],
};

// Animation state
let reelImage = null;
let frameImages = [];
let animationRunning = false;
let animationFrameId = null;
let reelInstances = [];
let canvas = null;
let ctx = null;

/**
 * Load an image from a URL
 */
function loadImage(url) {
     return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
          img.src = url;
     });
}

/**
 * Initialize the animation system
 */
async function initAnimation(canvasElement) {
     canvas = canvasElement;
     ctx = canvas.getContext('2d');
     
     // Set canvas size with scaling applied
     canvas.width = frames.imageWidth * config.scaleFactor;
     canvas.height = config.containerHeight * config.scaleFactor;
     
     // Load all images
     try {
          reelImage = await loadImage(config.reelImagePath);
          frameImages = await Promise.all(
               config.frameImagePaths.map(path => loadImage(path))
          );
          console.log('All images loaded successfully');
     } catch (error) {
          console.error('Error loading images:', error);
          throw error;
     }
}

/**
 * Calculate bounding box of a frame from its points
 */
function calculateFrameBounds(pointIndices) {
     const framePoints = pointIndices.map(idx => frames.points[idx]);
     
     const minX = Math.min(...framePoints.map(p => p.x));
     const maxX = Math.max(...framePoints.map(p => p.x));
     const minY = Math.min(...framePoints.map(p => p.y));
     const maxY = Math.max(...framePoints.map(p => p.y));
     
     return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2
     };
}

/**
 * Convert local coordinates to canvas coordinates
 */
function localToCanvas(localX, localY) {
     return {
          x: localX,
          y: frames.imageHeight - localY
     };
}

/**
 * Scale and center image in frame
 */
function scaleAndCenterImage(image, frameBounds) {
     const scale = frameBounds.height / image.height;
     const scaledWidth = image.width * scale;
     const scaledHeight = frameBounds.height;
     
     const localX = frameBounds.centerX - scaledWidth / 2;
     const localY = frameBounds.centerY - scaledHeight / 2;
     
     const canvasX = localX;
     const canvasY = frames.imageHeight - localY - scaledHeight;
     
     return {
          scale,
          scaledWidth,
          scaledHeight,
          localX,
          localY,
          canvasX,
          canvasY
     };
}

/**
 * Clip image to frame boundaries
 */
function clipImageToFrame(ctx, pointIndices) {
     ctx.beginPath();
     
     for (let i = 0; i < pointIndices.length; i++) {
          const point = frames.points[pointIndices[i]];
          const canvasCoords = localToCanvas(point.x, point.y);
          
          if (i === 0) {
               ctx.moveTo(canvasCoords.x, canvasCoords.y);
          } else {
               ctx.lineTo(canvasCoords.x, canvasCoords.y);
          }
     }
     
     ctx.closePath();
     ctx.clip();
}

/**
 * Draw a single reel instance at given Y offset
 */
function drawReelInstance(yOffset) {
     ctx.save();
     
     // Apply scaling transformation
     ctx.scale(config.scaleFactor, config.scaleFactor);
     
     // Translate to position (moving along Y axis)
     ctx.translate(0, -yOffset);
     
     // Draw reel base first (behind frame images)
     ctx.drawImage(reelImage, 0, 0, frames.imageWidth, frames.imageHeight);
     
     // Draw frame images on top
     for (let i = 0; i < Math.min(frames.shapes.length, frameImages.length); i++) {
          ctx.save();
          
          const frameBounds = calculateFrameBounds(frames.shapes[i].points);
          const imageLayout = scaleAndCenterImage(frameImages[i], frameBounds);
          
          // Clip to frame
          clipImageToFrame(ctx, frames.shapes[i].points);
          
          // Draw frame image
          ctx.drawImage(
               frameImages[i],
               imageLayout.canvasX,
               imageLayout.canvasY,
               imageLayout.scaledWidth,
               imageLayout.scaledHeight
          );
          
          ctx.restore();
     }
     
     ctx.restore();
}

/**
 * Initialize reel instances
 */
function initializeReels() {
     reelInstances = [];
     
     // Start with first reel positioned so top is at top of viewport
     reelInstances.push({
          id: 0,
          yOffset: 0
     });
}

/**
 * Update reel positions and spawn new instances
 */
function updateReels() {
     // Move all reels along direction vector (increase Y offset = move up)
     reelInstances.forEach(reel => {
          reel.yOffset += config.scrollSpeed;
     });
     
     // Check if we need to spawn a new reel
     // The bottom line is at canvas Y position: frames.imageHeight - yOffset
     // It appears on screen when: frames.imageHeight - yOffset <= canvas.height
     const lastReel = reelInstances[reelInstances.length - 1];
     const bottomLineCanvasY = frames.imageHeight - lastReel.yOffset;
     
     // If bottom line is visible on screen, spawn new reel
     if (bottomLineCanvasY <= canvas.height) {
          const newReel = {
               id: reelInstances.length,
               yOffset: lastReel.yOffset - frames.imageHeight - config.reelSpacing
          };
          reelInstances.push(newReel);
     }
     
     // Remove reels that have scrolled completely off-screen (top)
     reelInstances = reelInstances.filter(reel => {
          return reel.yOffset < canvas.height + frames.imageHeight;
     });
}

/**
 * Render animation frame
 */
function render() {
     // Clear canvas
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     
     // Draw all reel instances
     reelInstances.forEach(reel => {
          drawReelInstance(reel.yOffset);
     });
}

/**
 * Animation loop
 */
function animate() {
     if (!animationRunning) return;
     
     updateReels();
     render();
     
     animationFrameId = requestAnimationFrame(animate);
}

/**
 * Start the animation
 */
function startAnimation() {
     if (!reelImage || frameImages.length === 0) {
          console.error('Images not loaded');
          return;
     }
     
     initializeReels();
     animationRunning = true;
     animate();
}

/**
 * Stop the animation
 */
function stopAnimation() {
     animationRunning = false;
     if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
     }
}

/**
 * Set scroll speed
 */
function setScrollSpeed(speed) {
     config.scrollSpeed = speed;
}

/**
 * Get current scroll speed
 */
function getScrollSpeed() {
     return config.scrollSpeed;
}

/**
 * Set scale factor
 */
function setScaleFactor(scale) {
     config.scaleFactor = scale;
     // Update canvas size if already initialized
     if (canvas) {
          canvas.width = frames.imageWidth * config.scaleFactor;
          canvas.height = config.containerHeight * config.scaleFactor;
     }
}

/**
 * Get current scale factor
 */
function getScaleFactor() {
     return config.scaleFactor;
}

// Export functions for external use
if (typeof module !== 'undefined' && module.exports) {
     module.exports = {
          initAnimation,
          startAnimation,
          stopAnimation,
          setScrollSpeed,
          getScrollSpeed,
          setScaleFactor,
          getScaleFactor,
          config,
          frames
     };
}
