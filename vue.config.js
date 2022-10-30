const path = require('path')

module.exports = {
	publicPath: './',
	outputDir: 'dist',
	assetsDir: 'static',
	productionSourceMap: false,
	chainWebpack: config => {
		config.plugin('copy').tap(args => {
			args[0].push({
				from: path.resolve(__dirname, 'README.md'),
				to: path.resolve(__dirname, 'dist'),
				toType: 'dir'
			},
			{
				from: path.resolve(__dirname, 'LICENSE'),
				to: path.resolve(__dirname, 'dist'),
				toType: 'dir'
			})
			return args
		})
	}
}
