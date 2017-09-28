export default {
  input: 'dist/index.js',
  file: 'dist/bundles/imagecropper.umd.js',
  sourceMap: false,
  output: {
    format: 'umd'
  },
  name: 'ng.imagecropper',
  globals: {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common'
  },
  external: ['@angular/core', '@angular/common']
}
