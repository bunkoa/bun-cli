module.exports = (userConf) => {
    const webpack = require('webpack');
    const nodeExternals = require('webpack-node-externals');
    const appname = userConf.appname;
    const path = require('path');

    let plugins = [];
    if (userConf.definePlugin && userConf.definePlugin.dev) {
        plugins.push(new webpack.DefinePlugin(userConf.definePlugin.dev));
    }

    let alias = {};
    for (let [k, v] of Object.entries(userConf.globalPath)) {
        alias[k] = path.resolve(userConf.dirname, v);
    }
    let staticPath = `/static/${appname}/`;
    let staticDomain = userConf.publicStaticDomain;
    if (process.env.NODE_ENV === 'development') {
        staticPath = `/${appname}/`;
        staticDomain = userConf.localStaticDomain;
    }

    let webpackConfig = {
        mode: 'production', // development || production
        devtool: '#cheap-module-eval-source-map',
        entry: path.resolve(userConf.dirname, userConf.serverEntry),
        output: {
            // 此处告知 server bundle 使用 Node 风格导出模块(Node-style exports)
            libraryTarget: 'commonjs2',
            publicPath: userConf.isbun ? staticDomain + staticPath : staticDomain,
            path: path.resolve(userConf.dirname, userConf.output, (userConf.isbun && !userConf.isSingle) ? userConf.appname : ''),
            // path: userConf.dirname + `/build/static/${appname}`,
            filename: "server-bundle.min.js",
        },
        resolve: {
            modules: [path.resolve(userConf.dirname, '/src'), 'node_modules'],
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
            alias: Object.assign({
                Src: path.resolve(userConf.dirname, '/src/')
            }, alias)
        },
        // 这允许 webpack 以 Node 适用方式(Node-appropriate fashion)处理动态导入(dynamic import)，
        // 并且还会在编译 Vue 组件时，
        // 告知 `vue-loader` 输送面向服务器代码(server-oriented code)。
        target: 'node',
        // https://webpack.js.org/configuration/externals/#function
        // https://github.com/liady/webpack-node-externals
        // 外置化应用程序依赖模块。可以使服务器构建速度更快，
        // 并生成较小的 bundle 文件。
        externals: nodeExternals({
            // 不要外置化 webpack 需要处理的依赖模块。
            // 你可以在这里添加更多的文件类型。例如，未处理 *.vue 原始文件，
            // 你还应该将修改 `global`（例如 polyfill）的依赖模块列入白名单
            whitelist: [/\.css$/]
        }),
        module: { // 在配置文件里添加JSON loader
            rules: [{
                    test: /\.(t|j)sx?$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'babel-loader',
                        options: {
                            configFile: path.resolve(userConf.dirname, './client/babel.config.js')
                        }
                    }]
                },
                {
                    test: /\.less$/,
                    use: [
                        // 'vue-style-loader',
                        'null-loader',
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        // 'vue-style-loader',
                        'null-loader',
                    ]
                },
                {
                    test: /\.json$/,
                    type: 'javascript/auto',
                    use: [{
                        loader: 'json-loader'
                    }]
                },
                {
                    test: /\.pug$/,
                    use: [{
                        loader: "pug-plain-loader",
                    }],
                },
                {
                    test: /\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/,
                    use: [{
                        loader: 'url-loader',
                        options: {
                            limit: 5 * 1024,
                            name: 'img/[name].[hash:7].[ext]',
                            // publicPath: userConf.publicStaticDomain + `/static/${appname}`
                        }
                    }]
                }
            ]
        },
        optimization: {
            splitChunks: false
        },
        plugins: [
            new webpack.DefinePlugin({
                IS_SERVER_RENDER: true
            }),
            // new MiniCssExtractPlugin({
            //     filename: "css/[name].[contenthash:12].css",
            //     chunkFilename: "css/[name].chunk.[contenthash:12].css"
            // }),
        ].concat(plugins)
    };
    return webpackConfig;
}