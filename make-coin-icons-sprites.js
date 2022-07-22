const fs = require('fs');
const path = require('path');
const Spritesmith = require('spritesmith');
const maxSize = { // max size of icon item
  md: {
    width: 35,
    height: 35
  },
  sm: {
    width: 30,
    height: 30
  },
};

let iconsList = [];
// get all icons in a list
const directoryPath = path.join(__dirname, '/public/coins');
const files = fs.readdirSync(directoryPath);
files.forEach((file) => {
  if (file.indexOf('.png') > -1) {
    iconsList.push(file.substr(0, file.indexOf('.png')));
  }
});

console.log('icons list');
console.log(iconsList);

// generate spritesheet
Spritesmith.run({
  src: iconsList.map((x) => `${__dirname}/public/coins/${x}.png`),
  algorithm: 'binary-tree'
}, (err, result) => {
  if (err) {
    throw err;
  }

  // output the image
  fs.writeFileSync(__dirname + '/public/coin-icons.png', result.image);
  //console.log(result.coordinates)
  //console.log(result.properties)

  let coinsCss = [];
  let coinsCssResize = [];
  let resultKeys = Object.keys(result.coordinates);

  for (let i = 0; i < iconsList.length; i++) {
    coinsCss.push(`
      &.${iconsList[i]} {
        width: ${result.coordinates[resultKeys[i]].width}px;
        height: ${result.coordinates[resultKeys[i]].height}px;
        background-position-x: -${result.coordinates[resultKeys[i]].x}px;
        background-position-y: -${result.coordinates[resultKeys[i]].y}px;
        background-size: ${result.properties.width}px ${result.properties.height}px;
        position: absolute;
      }`);

    // calc scaling values
    const resizeXmd = (maxSize.md.width / result.coordinates[resultKeys[i]].width) * 100;
    const resizeYmd = (maxSize.md.height / result.coordinates[resultKeys[i]].height) * 100;
    const resizeXsm = (maxSize.sm.width / result.coordinates[resultKeys[i]].width) * 100;
    const resizeYsm = (maxSize.sm.height / result.coordinates[resultKeys[i]].height) * 100;
    console.log(iconsList[i], 'orig size', result.coordinates[resultKeys[i]].width, result.coordinates[resultKeys[i]].height, ', resize',  resizeXmd, resizeYmd);

    coinsCssResize.push(`
      .${iconsList[i]}-icon-size-md {
        transform: scaleX(${resizeXmd}%) scaleY(${resizeYmd}%);
      }
      .${iconsList[i]}-icon-size-sm {
        transform: scaleX(${resizeXsm}%) scaleY(${resizeYsm}%);
      }
    `);
  }

  const css = `
    .coin-icons {
      ${coinsCss.join('')}
    }`;

  fs.writeFileSync(__dirname + '/src/coin-icons.scss', css + coinsCssResize.join(''));
  //console.log(coinsCss)
});