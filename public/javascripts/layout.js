const fs = require('fs');

dir=`./about`;
if(!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
//fs.writeFileSync("./site/about/about.md")
//const about = fs.readFileSync("./about/about.md","utf8");