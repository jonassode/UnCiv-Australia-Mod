const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

// Read command-line arguments
// process.argv[0] is 'node'
// process.argv[1] is the script file path
// process.argv[2] would be the first custom argument (image directory)
// process.argv[3] would be the second custom argument (output file name)
const args = process.argv.slice(2);

// Check if image directory and output file name are provided
if (args.length < 2) {
    console.error('Error: Both image directory and output file name must be provided as command-line arguments.');
    console.error('Usage: node atlas.js <image_directory_path> <output_spritesheet_name>');
    process.exit(1); // Exit with an error code
}

const inputImageDirectory = args[0];
const outputFileName = args[1];

// Define the directory where your source images are located.
// __dirname refers to the directory of the current script file.
const imageDirectory = path.join(__dirname, inputImageDirectory);
// Construct the full path for the output spritesheet.
const outputFilePath = path.join(__dirname, outputFileName);

/**
 * Recursively gets all image files from a directory and its subdirectories
 * @param {string} dir - The directory to scan
 * @returns {Promise<string[]>} Array of image file paths
 */
async function getImageFilesRecursively(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return getImageFilesRecursively(fullPath);
        } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.png', '.jpg', '.jpeg', '.bmp', '.gif'].includes(ext)) {
                return [fullPath];
            }
            return [];
        }
    }));
    
    return files.flat();
}

/**
 * Attempts to read an image file using Jimp
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Jimp>} The loaded Jimp image
 * @throws {Error} If the image cannot be loaded
 */
async function loadImage(imagePath) {
    try {
        return await Jimp.read(imagePath);
    } catch (error) {
        throw new Error(`Failed to load image at ${imagePath}: ${error.message}`);
    }
}

/**
 * Asynchronously creates a spritesheet from images found in a specified directory
 * and its subdirectories. The images are stacked vertically in the spritesheet.
 */
async function createSpritesheet() {
    try {
        // Read all image files recursively from the image directory
        const imageFiles = await getImageFilesRecursively(imageDirectory);

        // If no image files are found, log a message and exit
        if (imageFiles.length === 0) {
            console.log('No image files found in the specified directory or its subdirectories.');
            return;
        }

        // Sort the image file paths alphabetically to ensure a consistent order
        imageFiles.sort();

        console.log(`Found ${imageFiles.length} image(s):`, imageFiles);

        const images = []; // Array to hold loaded Jimp image objects
        let maxWidth = 0;    // Will store the maximum width among all images
        let totalHeight = 0; // Will store the sum of heights of all images (for vertical stacking)

        // Loop through each image file to load it and calculate overall dimensions
        for (const imagePath of imageFiles) {
            try {
                const image = await loadImage(imagePath);
                images.push(image);

                // Update maxWidth if the current image is wider
                maxWidth = Math.max(maxWidth, image.bitmap.width);
                // Add the current image's height to totalHeight
                totalHeight += image.bitmap.height;
            } catch (error) {
                console.error(error.message);
                throw new Error('Spritesheet creation aborted due to image loading errors');
            }
        }

        // Create a new blank Jimp image for the spritesheet
        const spritesheet = await new Jimp({ width: maxWidth, height: totalHeight, color: 0x00000000 });

        let yOffset = 0; // This variable tracks the current Y position for pasting images

        // Loop through the loaded image objects and composite them onto the spritesheet
        for (const image of images) {
            // Paste the current image onto the spritesheet
            spritesheet.composite(image, 0, yOffset);
            // Increment yOffset by the height of the current image
            yOffset += image.bitmap.height;
        }

        // Save the final spritesheet image to the specified output path
        await spritesheet.write(outputFilePath);
        console.log(`Spritesheet created successfully at: ${outputFilePath}`);

    } catch (error) {
        // Catch and log any errors that occur during the process
        console.error('Error creating spritesheet:', error.message);
        process.exit(1); // Exit with error code
    }
}

// Call the main function to start the spritesheet creation process
createSpritesheet();
