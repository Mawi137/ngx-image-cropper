import resolve from 'rollup-plugin-node-resolve';

// Add here external dependencies that actually you use.
const globals = {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common'
};

export default {
    entry: './dist/modules/ngx-image-cropper.es5.js',
    dest: './dist/bundles/ngx-image-cropper.umd.js',
    format: 'umd',
    exports: 'named',
    moduleName: 'ng.imageCropper',
    plugins: [resolve()],
    external: Object.keys(globals),
    globals: globals,
    onwarn: () => { return }
}
