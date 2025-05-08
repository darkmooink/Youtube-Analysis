const browserSync = require('browser-sync').create();

browserSync.init({
  proxy: 'http://localhost:3000', // your Express server
  files: ['src2/**/*.ts',
    'src2/**/*.html',
    '!**/*.sqlite'
  ], // watch these
  ignore: ['node_modules'],
  port: 3001,
  open: true,
  reloadDelay: 5000
});