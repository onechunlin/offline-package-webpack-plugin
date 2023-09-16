import { Compilation, Compiler } from "webpack";
import JSZip from 'jszip';

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

class OfflinePackagePlugin {
  options: Required<PackageOption>

  static defaultOptions: Omit<Required<PackageOption>, 'packageName' | 'publicPath'> = {
    mapFileName: 'map.json',
    zipName: 'package',
    includeFileTypes: [],
    excludeFileTypes: [],
    serialize: manifest => JSON.stringify(manifest, null, 2),
  }

  constructor(options: PackageOption) {
    this.options = {
      ...OfflinePackagePlugin.defaultOptions,
      ...options,
    }
  }

  private getFileType(str: string) {
    const split = str.split('.')
    return split.pop() || ''
  }

  private prepareZip(zip: JSZip, compilation: Compilation) {
    const folder = zip.folder(this.options.zipName)!;
    // 创建映射文件内容
    const manifest: Manifest = {
      package: this.options.packageName,
      items: [],
    }

    for (const filename in compilation.assets) {
      const fileType = this.getFileType(filename)
      // 如果排除该文件类型，则跳过
      if (this.options.excludeFileTypes.includes(fileType)) {
        continue
      }
      // 如果设置了包括文件类型，且该文件类型不在包括的文件类型中则跳过
      if (this.options.includeFileTypes.length > 0 && !this.options.includeFileTypes.includes(fileType)) {
        continue
      }
      manifest.items.push({
        remoteUrl: this.options.publicPath + filename,
        path: filename,
      })
      const source = compilation.assets[filename].source();
      folder.file(filename, source);
    }
    const outputFileContent = this.options.serialize(manifest)
    // 在压缩包的输出文件里加上映射文件
    folder.file(this.options.mapFileName, outputFileContent)
  }

  apply(compiler: Compiler) {
    const { RawSource } = compiler.webpack.sources
    // 在输出静态资源到 output 目录之前执行
    compiler.hooks.emit.tapAsync(OfflinePackagePlugin.name, (compilation, callback) => {
      const zip = new JSZip();
      // 准备压缩包内容
      this.prepareZip(zip, compilation)
      zip
        .generateAsync({
          type: 'nodebuffer',
          streamFiles: true,
          compressionOptions: { level: 9 }
        })
        .then((content) => {
          const outputPath = `${this.options.zipName}.zip`;
          // 生成压缩包
          compilation.assets[outputPath] = new RawSource(content);
          callback();
        });
    })
  }
}

export { OfflinePackagePlugin }