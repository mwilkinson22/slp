import { createCanvas, loadImage, registerFont } from "canvas";
import svg2img from "svg2img";
import { bucket } from "~/services/googleBucket";

//Define Fonts
const fonts = {
	Jersey: "Jersey.ttf",
	"Roboto Slab": "RobotoSlab.ttf"
};

//Interfaces & Types
import { Canvas, CanvasRenderingContext2D, Image } from "canvas";
import { getExtensionFromFileName } from "~/helpers/fileHelper";

type TextStyles = {
	[key: string]: {
		size: number;
		family: keyof typeof fonts;
	};
};

type RoundedRectangleOptions = {
	topLeft: number;
	topRight: number;
	bottomLeft: number;
	bottomRight: number;
	fill: boolean;
	stroke: boolean;
	ctx: CanvasRenderingContext2D;
};

type xAlignOptions = "left" | "center" | "right";
type yAlignOptions = "top" | "center" | "bottom";
type FitOptions = {
	background?: string;
	ctx: CanvasRenderingContext2D;
	xAlign: xAlignOptions;
	yAlign: yAlignOptions;
	zoom: number;
};

export type TextRowBlock = {
	content: string;
	textStyle?: string;
	maxWidth?: number;
	colour?: string;
};
type TextRowOptions = {
	ctx: CanvasRenderingContext2D;
	lineHeight: number;
	padding: number;
	xAlign: xAlignOptions;
	yAlign: yAlignOptions;
};

export class CanvasBuilder {
	canvas: Canvas;
	ctx: CanvasRenderingContext2D;
	colours: Record<string, string> = {
		red: "#880000",
		black: "#000000",
		white: "#FFFFFF"
	};
	textStyles: TextStyles = {};

	/* --------------------------------- */
	/* CanvasBuilder Initialisation Methods
	/* --------------------------------- */
	constructor(public cWidth: number, public cHeight: number) {
		this.registerFonts(fonts);

		//Constants
		this.canvas = createCanvas(cWidth, cHeight);
		this.ctx = this.canvas.getContext("2d");
	}

	/**
	 * Registers the font files, allowing them to be used by canvas
	 * @param fontList
	 */
	registerFonts(fontList: typeof fonts): void {
		for (const family in fontList) {
			const file = fontList[family as keyof typeof fonts];
			if (file && family) {
				registerFont(`./src/assets/fonts/${file}`, { family });
			} else {
				console.error("Invalid Font Data", { file, family });
			}
		}
	}

	/* --------------------------------- */
	/* CanvasBuilder Formatting Helpers
	/* --------------------------------- */
	/**
	 * Takes a text style name and makes it the active one in the context.
	 * @param styleName - As defined in textStyles object
	 * @param ctx - Optional context, defaults to class property
	 */
	setTextStyle(styleName: keyof TextStyles, ctx: CanvasRenderingContext2D = this.ctx): void {
		if (!this.textStyles) {
			console.error("textStyles object not initiated");
		} else if (!this.textStyles[styleName]) {
			console.error(`Style: '${styleName}' not found in textStyles`);
		} else {
			//Update the context
			const { size, family } = this.textStyles[styleName];
			ctx.font = `${Math.round(size)}px ${family}`;
		}
	}

	/**
	 * Returns the given percentage of the canvas width, to the nearest pixel
	 * @param percentage
	 * @param totalWidth - the source value, defaults to cWidth
	 */
	relativeWidth(percentage: number, totalWidth: number = this.cWidth): number {
		return Math.round(totalWidth * (percentage / 100));
	}

	/**
	 * Returns the given percentage of the canvas height, to the nearest pixel
	 * @param percentage
	 * @param totalHeight - the source value, defaults to cHeight
	 */
	relativeHeight(percentage: number, totalHeight: number = this.cHeight): number {
		return Math.round(totalHeight * (percentage / 100));
	}

	/**
	 * Updates the cWidth and cHeight references, and resizes the canvas property
	 * @param width
	 * @param height
	 */
	resizeCanvas(width?: number, height?: number): void {
		if (width) {
			this.cWidth = width;
			this.ctx.canvas.width = width;
		}

		if (height) {
			this.cHeight = height;
			this.ctx.canvas.height = height;
		}
	}

	/**
	 * Undoes any shadow settings on the given context
	 * @param ctx - Optional context, defaults to class property
	 */
	resetShadow(ctx: CanvasRenderingContext2D = this.ctx) {
		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
	}

	/**
	 * Downloads a file from the google bucket and turns it into a CanvasBuilder-compatible image
	 * @param fileName
	 * @param withSharp
	 */
	async googleToCanvas(fileName: string, withSharp?: (buffer: Buffer) => Buffer): Promise<Image | false> {
		const fileType = getExtensionFromFileName(fileName);

		//Ensure no trailing slash
		fileName = fileName.replace(/^\//, "");

		//Download buffer from google bucket
		let buffer: Buffer;
		try {
			const result = await bucket.file(fileName).download();
			buffer = result[0];
		} catch (e) {
			console.error(`Error loading image: ${e.message}`);
			return false;
		}

		//For SVG files we need to run svg2img to convert them to raster
		if (fileType == "svg") {
			return new Promise((resolve, reject) => {
				svg2img(buffer.toString(), async (err, result) => {
					if (err) {
						reject(err);
					}
					if (withSharp) {
						result = await withSharp(result);
						result = await result.toBuffer();
					}
					const image = await loadImage(result);
					resolve(image);
				});
			});
		} else {
			if (withSharp) {
				buffer = await withSharp(buffer);
			}
			return await loadImage(buffer);
		}
	}

	/**
	 * Outputs the created canvas as an image
	 * @param type
	 */
	outputFile(type: string = "base64") {
		const { canvas } = this;
		switch (type) {
			case "base64":
				return canvas.toDataURL();
			case "twitter":
				return canvas.toDataURL().split("base64,")[1];
			default:
				console.error(`Invalid render type: '${type}'`);
				return null;
		}
	}

	/* --------------------------------- */
	/* CanvasBuilder Drawing Helpers
	/* --------------------------------- */
	/**
	 * Draws a rectangle with rounded corners
	 * @param x - location of the left of the rectangle
	 * @param y - location of the top of the rectangle
	 * @param w - width of the rectangle
	 * @param h - height of the rectangle
	 * @param defaultRadius - default radius (can be overwritten on each corner)
	 * @param passedOptions
	 */
	fillRoundedRect(
		x: number,
		y: number,
		w: number,
		h: number,
		defaultRadius: number,
		passedOptions: Partial<RoundedRectangleOptions> = {}
	): void {
		const options: RoundedRectangleOptions = {
			topLeft: defaultRadius,
			topRight: defaultRadius,
			bottomLeft: defaultRadius,
			bottomRight: defaultRadius,
			fill: true,
			stroke: false,
			ctx: this.ctx,
			...passedOptions
		};
		const { topLeft, topRight, bottomLeft, bottomRight, ctx, fill, stroke } = options;

		//Draw path
		ctx.beginPath();
		ctx.moveTo(x + topLeft, y);
		ctx.lineTo(x + w - topRight, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + topRight);
		ctx.lineTo(x + w, y + h - bottomRight);
		ctx.quadraticCurveTo(x + w, y + h, x + w - bottomRight, y + h);
		ctx.lineTo(x + bottomLeft, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - bottomLeft);
		ctx.lineTo(x, y + topLeft);
		ctx.quadraticCurveTo(x, y, x + topLeft, y);
		ctx.closePath();

		//Optionally fill and stroke
		if (fill) {
			ctx.fill();
		}
		if (stroke) {
			ctx.stroke();
		}
	}

	/**
	 * Draws a simple line
	 * @param startX
	 * @param startY
	 * @param endX
	 * @param endY
	 * @param ctx
	 */
	drawLine(
		startX: number,
		startY: number,
		endX: number,
		endY: number,
		ctx: CanvasRenderingContext2D = this.ctx
	): void {
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.closePath();
		ctx.stroke();
	}

	/**
	 * Draws an image and reduces its size, to ensure it fits within the destination dimensions
	 * @param src - the source image to fit
	 * @param destinationX - x-center of the image
	 * @param destinationY - y-center of the image
	 * @param destinationW - width of the image
	 * @param destinationH - height of the image
	 * @param options
	 */
	containImage(
		src: Image | Canvas,
		destinationX: number,
		destinationY: number,
		destinationW: number,
		destinationH?: number,
		options?: Partial<FitOptions>
	) {
		return this.fitImage(true, src, destinationX, destinationY, destinationW, destinationH, options);
	}

	/**
	 * Draws an image and crops its edges, to ensure it fills the destination dimensions
	 * @param src - the source image to fit
	 * @param destinationX - x-center of the image
	 * @param destinationY - y-center of the image
	 * @param destinationW - width of the image
	 * @param destinationH - height of the image
	 * @param options
	 */
	coverImage(
		src: Image | Canvas,
		destinationX: number,
		destinationY: number,
		destinationW: number,
		destinationH?: number,
		options?: Partial<FitOptions>
	) {
		return this.fitImage(false, src, destinationX, destinationY, destinationW, destinationH, options);
	}

	/**
	 *
	 * @param contain - corresponds to the css contain/cover background-image properties
	 * @param src - the source image to fit
	 * @param destinationX - x-center of the image
	 * @param destinationY - y-center of the image
	 * @param destinationW - width of the image
	 * @param destinationH - height of the image
	 * @param passedOptions
	 * @param passedOptions.ctx - defaults to class property
	 * @param passedOptions.xAlign - defaults to "center"
	 * @param passedOptions.yAlign - defaults to "center"
	 * @param passedOptions.zoom - defaults to 1
	 * @private
	 */
	private fitImage(
		contain: boolean,
		src: Image | Canvas,
		destinationX: number,
		destinationY: number,
		destinationW: number,
		destinationH?: number,
		passedOptions: Partial<FitOptions> = {}
	) {
		const options: FitOptions = {
			ctx: this.ctx,
			xAlign: "center",
			yAlign: "center",
			zoom: 1,
			...passedOptions
		};
		const { xAlign, yAlign, ctx, zoom } = options;

		//If we don't specify destinationH, then we use destinationW and make a square
		if (!destinationH) {
			destinationH = destinationW;
		}

		//Add Background Box (usually for testing)
		if (options.background) {
			ctx.fillStyle = options.background;
			ctx.fillRect(destinationX, destinationY, destinationW, destinationH);
		}

		//Set Default Values for the source image
		let sourceWidth = src.width;
		let sourceHeight = src.height;
		//Source x and y start as 0.
		//We then work out the aspect ratio and increase one of them accordingly.
		//If we need to zoom, we increase again
		let sourceX = 0;
		let sourceY = 0;

		//Get Aspect Ratios for source image and destination block
		const srcRatio = sourceWidth / sourceHeight;
		const destRatio = destinationW / destinationH;

		/**
		 * A callback that adjusts either the source or destination size and location
		 * The values we adjust depend on two factors
		 *     1. Whether the source aspect ratio is wider than the destination
		 *     2. Whether we are looking to contain or cover the image
		 * Height and Width values will always be decreased.
		 *
		 * X and Y values will be increased, unless we're using Top or Left alignment, in which case they
		 * are not changed.
		 *
		 * Quick reference as to what we change:
		 *
		 *               |   source is wider than dest   |   source is taller than dest
		 *     __________|_______________________________|________________________________
		 *               |                               |
		 *      contain  |    destination Y & Height     |     destination X & width
		 *     __________|_______________________________|________________________________
		 *               |                               |
		 *       cover   |       source X & width        |        source Y & Height
		 *               |                               |
		 *
		 * @param originalSize - either sourceHeight, sourceWidth, destinationHeight or destinationWidth
		 * @param originalLocation - the corresponding X or Y value for originalSize
		 * @param ratio - the difference between the source and destination aspect ratios
		 * @param alignment - the xAlign or yAlign value, based on what we get for originalLocation
		 */
		const updateDimensions = (
			originalSize: number,
			originalLocation: number,
			ratio: number,
			alignment: typeof xAlign | typeof yAlign
		) => {
			//Get the new size
			const newSize = originalSize / ratio;

			let newLocation = originalLocation;
			switch (alignment) {
				case "top":
				case "left":
					//Use the original value, the height/width adjustment will
					//be taken from the bottom/right respectively
					break;
				case "bottom":
				case "right":
					//For "end" alignment, we increase the position by the difference in size
					newLocation += originalSize - newSize;
					break;
				case "center":
					//For center alignment we do half of this
					newLocation += (originalSize - newSize) / 2;
			}

			return { newSize, newLocation };
		};

		if (srcRatio > destRatio) {
			//This means the source image is wider than the destination block
			if (contain) {
				//Reduce the destination height & y
				const adjustedValues = updateDimensions(destinationH, destinationY, srcRatio / destRatio, yAlign);
				destinationH = adjustedValues.newSize;
				destinationY = adjustedValues.newLocation;
			} else {
				//Reduce the source width & x
				const adjustedValues = updateDimensions(sourceWidth, sourceX, srcRatio / destRatio, xAlign);
				sourceWidth = adjustedValues.newSize;
				sourceX = adjustedValues.newLocation;
			}
		} else if (destRatio > srcRatio) {
			//This means the source image is taller than the destination block
			if (contain) {
				//Reduce the destination width & x
				const adjustedValues = updateDimensions(destinationW, destinationX, destRatio / srcRatio, xAlign);
				destinationW = adjustedValues.newSize;
				destinationX = adjustedValues.newLocation;
			} else {
				//Reduce the source height & y
				const adjustedValues = updateDimensions(sourceHeight, sourceY, destRatio / srcRatio, yAlign);
				sourceHeight = adjustedValues.newSize;
				sourceY = adjustedValues.newLocation;
			}
		}

		//At this we're ready to draw on the assumption that zoom = 1.
		//Otherwise, we adjust
		if (zoom && zoom !== 1) {
			const initialSw = sourceWidth;
			const initialSh = sourceHeight;
			sourceWidth = sourceWidth / zoom;
			sourceHeight = sourceHeight / zoom;

			switch (xAlign) {
				case "center":
					sourceX += (initialSw - sourceWidth) / 2;
					break;
				case "right":
					sourceX += initialSw - sourceWidth;
					break;
			}
			switch (yAlign) {
				case "center":
					sourceY += (initialSh - sourceHeight) / 2;
					break;
				case "bottom":
					sourceY += initialSh - sourceHeight;
					break;
			}
		}

		//Finally, draw the image on the canvas
		ctx.drawImage(
			src,
			sourceX,
			sourceY,
			sourceWidth,
			sourceHeight,
			destinationX,
			destinationY,
			destinationW,
			destinationH
		);

		//And return the data
		return {
			sourceX,
			sourceY,
			sourceWidth,
			sourceHeight,
			destinationX,
			destinationY,
			destinationW,
			destinationH
		};
	}

	/**
	 * Automatically positions, aligns, sizes and creates text
	 * @param rows
	 * @param x - x-origin of the text-block. Depending on the xAlign option this
	 *            will either be the left-most, right-most or center of the block
	 * @param y - y-center of the text-block
	 * @param passedOptions
	 */
	textBuilder(rows: TextRowBlock[][], x: number, y: number, passedOptions: Partial<TextRowOptions> = {}) {
		const options = {
			ctx: this.ctx,
			lineHeight: 1.2,
			padding: 0.1, //Avoid setting to 0 to account for tails on letters like g
			xAlign: "center",
			yAlign: "center",
			...passedOptions
		};
		const { ctx, xAlign, yAlign, lineHeight, padding } = options;

		//First, calculate the total width and height we'll need
		let drawableWidth = 0;
		let drawableHeight = 0;
		const processedRows = rows.map((row: TextRowBlock[], i: number) => {
			let rowWidth = 0;
			let rowHeight = 0;
			//Loop each block within a row
			row.map((textRowBlock: TextRowBlock) => {
				//Update font, if one is provided
				if (textRowBlock.textStyle) {
					this.setTextStyle(textRowBlock.textStyle);
				}

				//Increase the row width
				const dimensions = this.ctx.measureText(textRowBlock.content);
				if (textRowBlock.maxWidth) {
					rowWidth += Math.min(dimensions.width, textRowBlock.maxWidth);
				} else {
					rowWidth += dimensions.width;
				}

				//Get the row height
				let textHeight = dimensions.actualBoundingBoxAscent;

				//If this is 0, then we've passed in whitespace.
				//If the whole row is whitespace, we assume we want a line break,
				//so we measure the height of a random character.
				//If this is wrong and other blocks in the same row have a value, then that height
				//will almost certainly overwrite it, so it's a low-risk approach
				if (textHeight === 0) {
					textHeight = ctx.measureText("a").actualBoundingBoxAscent;
				}

				//Update the rowHeight variable if larger than what we already have
				rowHeight = Math.max(rowHeight, textHeight);
			});

			//Once we've looped every block in a row, we add the row's height and
			//width to the total drawable area
			drawableWidth = Math.max(drawableWidth, rowWidth);
			if (i > 0) {
				drawableHeight += Math.round(rowHeight * lineHeight);
			} else {
				drawableHeight += rowHeight;
			}

			//Return the row as part of an object with the calculated width and height
			return { row, rowWidth, rowHeight };
		});

		//We draw the text onto a temporary canvas, which we then draw onto the main one
		//First, get the dimensions we need
		const xPadding = drawableWidth * padding;
		const yPadding = drawableHeight * padding;
		const totalWidth = drawableWidth + xPadding * 2;
		const totalHeight = drawableHeight + yPadding * 2;

		//Create the temporary canvas
		const tempCanvas = createCanvas(totalWidth, totalHeight);
		const tempCtx = tempCanvas.getContext("2d");

		//Pass in the parent fillStyle and font, to potentially be overwritten later
		tempCtx.fillStyle = ctx.fillStyle;
		tempCtx.font = ctx.font;
		//We've already calculated the row width and will draw left to right, so we
		//set textAlign to left
		tempCtx.textAlign = "left";

		//Row Y will be updated each time we finish a row. We begin with the padding value
		let rowY = yPadding;

		//Loop the rows and draw onto temporary canvas
		processedRows.map((processedRow, i) => {
			const { row, rowWidth, rowHeight } = processedRow;

			//Since we know the width of the row, we set the x value here
			let rowX = xPadding;
			switch (xAlign) {
				case "left":
					//For left align, we do nothing
					break;
				case "right":
					//For right align, we add in all the leftover space to the x value
					rowX += drawableWidth - rowWidth;
					break;
				case "center":
					//For center align, we do half of what we do for right align
					rowX += (drawableWidth - rowWidth) / 2;
					break;
			}

			//Set Y Value
			//For the first row, this is simply the row height
			//For all subsequent rows, we factor in line height
			if (i === 0) {
				rowY += rowHeight;
			} else {
				rowY += Math.round(rowHeight * lineHeight);
			}

			//Print Text
			row.map(textRowBlock => {
				//Set the custom font
				if (textRowBlock.textStyle) {
					this.setTextStyle(textRowBlock.textStyle, tempCtx);
				}

				//Set the custom colour
				if (textRowBlock.colour) {
					tempCtx.fillStyle = textRowBlock.colour;
				}

				//Work out the predicted width
				const { width } = tempCtx.measureText(textRowBlock.content);

				//And get the max allowed width of the block
				let maxWidth = width;
				if (textRowBlock.maxWidth && textRowBlock.maxWidth < maxWidth) {
					maxWidth = textRowBlock.maxWidth;
				}

				//Draw the text on the temporary canvas
				tempCtx.fillText(textRowBlock.content, rowX, rowY, maxWidth);

				//Increment the rowX position
				rowX += maxWidth;
			});
		});

		//At this stage, tempCtx should be ready to be mapped onto the main canvas
		//First we calculate the destination x position
		//Calculate destination x
		switch (xAlign) {
			case "left":
				//For left align, the passed-in x param will be the the left-most point
				//so we leave it as is
				break;
			case "right":
				//For right align, the passed in x param will be the right-most point,
				//so we need to subtract the entire width of the tempCtx canvas
				x = x - drawableWidth;
				break;
			case "center":
				//For center align, we do half of the right align logic
				x = x - drawableWidth / 2;
				break;
		}
		//Adjust for padding
		x = x - xPadding;

		//Calculate destination y
		switch (yAlign) {
			case "top":
				//For top align, the passed-in y param will be the top-most point,
				//so we leave it as is
				break;
			case "bottom":
				//For bottom align, the passed-in y param will be the bottom-most point,
				//so we need to subtract the entire height of the tempCtx canvas
				y = y - drawableHeight - yPadding;
				break;
			case "center":
				//For center align, we do half of the bottom align logic
				y = y - drawableHeight / 2;
				break;
		}
		//Adjust for padding
		y = y - yPadding;

		//innerX and innerY mark the point where text actually begins on the target canvas,
		//without padding. This isn't used to draw but is returned from the function call for reference
		const innerX = (totalWidth - drawableWidth) / 2 + x;
		const innerY = (totalHeight - drawableHeight) / 2 + y;

		//Finally, transfer the temporary canvas to the main one
		ctx.drawImage(tempCanvas, x, y);

		//Return Key Positioning Values
		return {
			drawableHeight,
			drawableWidth,
			totalHeight,
			totalWidth,
			x,
			y,
			innerX,
			innerY,
			padding
		};
	}
}
