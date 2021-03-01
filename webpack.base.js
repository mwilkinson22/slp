const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const isProduction = process.env.NODE_ENV === "production";

const babelPlugins = ["@babel/plugin-transform-runtime"];
if (!isProduction) {
	babelPlugins.push("babel-plugin-typescript-to-proptypes");
}

module.exports = {
	devtool: isProduction ? "source-map" : "eval-source-map",
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					"style-loader",
					{
						loader: "postcss-loader",
						options: {
							ident: "postcss",
							sourceMap: true,
							plugins: [require("autoprefixer")()]
						}
					},
					"css-loader"
				]
			},
			{ test: /\.tsx?$/, loader: "ts-loader" },
			{ test: /\.js$/, loader: "source-map-loader" },
			{
				test: /\.m?js$/,
				loader: "babel-loader",
				exclude: /node_modules\/(?!(kareem|he|@babel\/runtime)\/).*/,
				options: {
					plugins: ["@babel/plugin-transform-arrow-functions"],
					presets: [
						"@babel/preset-react",
						[
							"@babel/preset-env",
							{
								targets: { browsers: ["last 2 versions", "ie >= 11"] }
							}
						]
					]
				}
			},
			{
				test: /\.m?js$/,
				loader: "babel-loader",
				exclude: /node_modules/,
				options: {
					plugins: babelPlugins,
					presets: [
						"@babel/preset-react",
						[
							"@babel/preset-env",
							{
								targets: { browsers: ["last 2 versions", "ie >= 11"] }
							}
						]
					]
				}
			},
			{
				test: /\.scss$/,
				use: [
					//Saves to styles.css
					MiniCssExtractPlugin.loader,
					//Handles imports
					{
						loader: "css-loader",
						options: {
							sourceMap: true
						}
					},
					//Processes css through autoprefixer
					{
						loader: "postcss-loader",
						options: {
							ident: "postcss",
							sourceMap: true,
							plugins: [require("autoprefixer")()]
						}
					},
					//Converts sass to css
					{
						loader: "fast-sass-loader",
						options: {
							sourceMap: true
						}
					}
				]
			}
		]
	},
	resolve: {
		alias: {
			"~": path.resolve("./src")
		},
		extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
	},
	plugins: [new MiniCssExtractPlugin({ filename: "styles.css" })],
	performance: {
		hints: false
	}
};
