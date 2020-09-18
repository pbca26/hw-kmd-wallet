const fs = require('fs');
const buildPath = 'build';

let files = [{
  name: `${buildPath}/index.html`,
  data: fs.readFileSync(`${buildPath}/index.html`, 'utf-8'),
}];

fs.readdirSync(`${buildPath}/static/css`).forEach(file => {
  if (file.indexOf('.css.map') === -1)
    files.push({
      name: `${buildPath}/static/css/${file}`,
      data: fs.readFileSync(`${buildPath}/static/css/${file}`, 'utf-8'),
    });
});

const regexPattern = /hw-kmd-wallet\//g;
const regexPatternCss = /static\//g;

files[0].data = files[0].data.replace(regexPattern, '');
files[0].data = files[0].data.replace(/"\//g, '"');

fs.writeFileSync(files[0].name, files[0].data); 
console.log(`${files[0].name} path changed`);

files[1].data = files[1].data.replace(regexPattern, '');
files[1].data = files[1].data.replace(regexPatternCss, '');
files[1].data = files[1].data.replace(/url\(\//g, 'url(../');

fs.writeFileSync(files[1].name, files[1].data); 
console.log(`${files[1].name} path changed`);