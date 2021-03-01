const path = require("path");
const merge = require("webpack-merge");
const baseConfig = require("./webpack.base");

const config = {
	//Tell webpack the root file
	entry: "./src/client/index.tsx",

	//output file
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist", "public")
	},
	devtool: "source-map"
};
module.exports = merge(baseConfig, config);
