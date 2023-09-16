# 离线包 Webpack 插件

在 emit 阶段分析静态资源的映射关系，然后生成对应的映射文件（默认为 map.json）

## 使用

```js
const { OfflinePackagePlugin } = require('offline-package-webpack-plugin')

const baseUrl = '/'

module.exports = {
  plugins: [
    new OfflinePackagePlugin({
      packageName: 'packageName',
      publicPath: baseUrl,
      excludeFileTypes: ['map', 'txt']
    })
  ]
}

```

## 参数说明

请直接查看 PackageOption 的 ts 定义即可

```ts
export interface PackageOption {
  /** 包名 */
  packageName: string;
  /** 公共路径 */
  publicPath: string;
  /** 映射文件的名称 */
  mapFileName?: string;
  /** 压缩包名 */
  zipName?: string;
  /** 包含的文件类型，如 html/css/js */
  includeFileTypes?: string[],
  /** 不包含的文件类型，如 js.map */
  excludeFileTypes?: string[],
  /** 最终结果的输出函数。可以在这里更改最终内容的格式 */
  serialize?: (manifest: Manifest) => string,
}

export interface AssetsMap {
  remoteUrl: string;
  path: string;
}

export interface Manifest {
  /** 包名 */
  package: string;
  /** 具体静态资源的映射信息 */
  items: AssetsMap[]
}
```