const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

// Define the directory where your source images are located.
// __dirname refers to the directory of the current script file.
const imageDirectory = path.join(__dirname, './Images');
// Define the name of the output spritesheet file.
const outputFileName = 'game.png';
// Construct the full path for the output spritesheet.
const outputFilePath = path.join(__dirname, outputFileName);

/**
 * Asynchronously creates a spritesheet from images found in a specified directory.
 * The images are stacked vertically in the spritesheet.
 */
async function createSpritesheet() {
    try {
        // Read all file names from the image directory.
        const files = await fs.promises.readdir(imageDirectory);

        // Filter the files to include only common image formats.
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.bmp' || ext === '.gif';
        });

        // If no image files are found, log a message and exit.
        if (imageFiles.length === 0) {
            console.log('No image files found in the specified directory.');
            return;
        }

        // Sort the image file names alphabetically to ensure a consistent order
        // in the spritesheet (e.g., frame1, frame2, frame3).
        imageFiles.sort();

        console.log(`Found ${imageFiles.length} image(s):`, imageFiles);

        const images = []; // Array to hold loaded Jimp image objects.
        let maxWidth = 0;    // Will store the maximum width among all images.
        let totalHeight = 0; // Will store the sum of heights of all images (for vertical stacking).

        // Loop through each image file to load it and calculate overall dimensions.
        for (const file of imageFiles) {
            const imagePath = path.join(imageDirectory, file); // Full path to the current image.

            const image = await Jimp.read(imagePath);         // Load the image using Jimp.
            images.push(image);                                // Add the loaded image to our array.

            // Update maxWidth if the current image is wider.
            maxWidth = Math.max(maxWidth, image.bitmap.width);
            // Add the current image's height to totalHeight.
            totalHeight += image.bitmap.height;
        }

        // Create a new blank Jimp image for the spritesheet.
        // CORRECTED: Instantiate Jimp using Jimp.Jimp as per console log output
        // It will have the maxWidth and the combined totalHeight.
        // 0x00000000 represents a fully transparent background (RGBA: 0,0,0,0).
        const spritesheet = await new Jimp({ width: maxWidth, height: totalHeight, color: 0x00000000 });

        let yOffset = 0; // This variable tracks the current Y position for pasting images.

        // Loop through the loaded image objects and composite them onto the spritesheet.
        for (const image of images) {
            // Paste the current image onto the spritesheet.
            // The X-coordinate is 0 (left-aligned), and Y-coordinate is yOffset.
            spritesheet.composite(image, 0, yOffset);
            // Increment yOffset by the height of the current image,
            // so the next image is placed directly below it.
            yOffset += image.bitmap.height;
        }

        // Save the final spritesheet image to the specified output path
        await spritesheet.write(outputFilePath);
        console.log(`Spritesheet created successfully at: ${outputFilePath}`);

    } catch (error) {
        // Catch and log any errors that occur during the process
        console.error('Error creating spritesheet:', error);
    }
}

// Call the main function to start the spritesheet creation process
createSpritesheet();
