//모듈 or 경로
var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const hljs=require('highlight.js');
const ejs = require('ejs');
const directoryPath = path.join(__dirname, '../posts');



  


const md = require('markdown-it')({
    html:false,
    xhtmlOut: false,
    breaks: false,
    langPrefix: "language-",
    linkify: true,
    typographer: true,
    quotes: "“”‘’",
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return '<pre class="hljs"><code>' +
                   hljs.highlight(lang, str, true).value +
                   '</code></pre>';
          } catch (__) {}
        }
    
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
      }   
  });
  
const indexHtmlFormat = fs.readFileSync("./views/index.html","utf8");
const homeHtmlFormat = fs.readFileSync("./views/home.html","utf8");
const postHtmlFormat = fs.readFileSync("./views/post.html","utf8");
const listHtmlFormat = fs.readFileSync("./views/list.html","utf8");

const nav = fs.readFileSync("./public/nav.html","utf8");
const footer = fs.readFileSync("./public/footer.html","utf8");





const directories = fs.readdirSync(directoryPath);





//md파일 사용자 입력값 가져오기
function extractValue(md) {
    //---key:value--- 분리
    string = md.match(/(\-{3})([\s|\S]+?)\1/);
    //console.log(string);
    if(string === null){
        value={title: "", date: "", desc: ""};
        //console.log(value);

        return value;
    } else {
        //  '\n' '\r'제외
        //console.log(string);

        str = string[2].match(/[^\r\n]+/g);


        let extractValue={};
        str.forEach(value => {
            if(value!==" "){
                //key와 value 분리
                let valueline= value.match(/(.+?):(.+)/);
    
                if(valueline!=null){
                    
                    key = valueline[1].replace(/\s/g,"");
                    value = valueline[2].replace(/['"]/g,"");
                    
                    
                    extractValue[key] = value.trim();

                }
            }
        });

        return extractValue;
    }
};

function extractBody(md) {
    
    return md.replace(/(\-{3})([\s\S]+?)(\1)/,"");
}


let posts= [];
let allPosts= [];
let categoryByfiles=[];

function removeAllBlank(string){
    return string.replace(/(\s*)/g, "");
}





directories.forEach((directory, index)=>{
    const fileList=fs.readdirSync(`./posts/${directory}`);
    let files=[];
    fileList.forEach(file=>{
        const markdownFile = fs.readFileSync(
            `./posts/${directories[index]}/${file}`,"utf8"
        );
        let value= extractValue(markdownFile);
        let body = md.render(extractBody(markdownFile));


        let categoryName= value.category;
        let folder= value.category&&value.category.toLocaleLowerCase();
        let fileName=(
            file.slice(0,file.indexOf(".")).toLocaleLowerCase()+`.html`
        );

        let front= value.front;
        if(front){
            front=removeAllBlank(front);
            front=/true/i.test(front);
        }
        let i = files.findIndex(o => o.categoryName===categoryName);

        let fileObj={
            fileName,
            folder,
            body,
            value
        };    

        // show=true는 완성으로 웹으로 보여줘도됨
        let show = !value.show||(value.show && /true/i.test(removeAllBlank(value.show)));
        if(value.category&&show){
            //console.log(value);
            allPosts.push({
                title : value.title,
                date : value.date,
                path : `/convert/${folder}/${fileName}`
            });

            if(i<0){
                files.push({
                    categoryName,
                    folder,
                    files: [fileObj]
                });
            }else{
                files[i].files.push(fileObj);
            }
            if(front){
                posts.push(fileObj);
            }
            
        }

    });

    categoryByfiles.push(...files);
    
});
//posts 포스트 모아놓음 [{value:"", body:"", fileName:""}]
//categoryByfiles: 카테고리 별로 포스터 모음 [{categoryName:"", folder:"", files:""}]



posts=posts.sort((a,b)=>{
    return parseInt(b.value.date, 10) - parseInt(a.value.date, 10);
});



//about
const about = fs.readFileSync("./about/about.md","utf8");
const aboutValue = extractValue(about);






//about
const aboutMain = md.render(extractBody(about));
const aboutHtml = ejs.render(indexHtmlFormat,{
    title: `${aboutValue.username}`,
    nav,
    main: aboutMain,
    footer

});
dir=`./convert/about`;
if(!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
fs.writeFileSync("./convert/about/about.html",aboutHtml);

console.log(posts);

//list 페이지 생성

const list = ejs.render(listHtmlFormat,{
    
    categories: categoryByfiles,
    posts: posts,

});
const listhtml = ejs.render(indexHtmlFormat, {
    title: "Study",
    main: list,
    nav: nav,
    footer: footer
});
fs.writeFileSync('./convert/category/list.html',listhtml);



    //카테고리 페이지

categoryByfiles.forEach(category=>{
    if(category.folder!=undefined){
        let dir = `./convert/${category.folder}`;
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    }
    //카테고리 별 file리스트 보여주는 카테고리 페이지 생성
    //files정렬

    const sortFiles = category.files.sort((a,b)=>{

        return parseInt(b.value.date, 10) - parseInt(a.value.date,10);
    });

    

    // 각각의 post 페이지 생성

    

    category.files.forEach(file=>{
        const path = `http://tamjeong.github.io/convert/${category.folder}/${file.fileName}`;
        const post = ejs.render(postHtmlFormat, {
            body: file.body,
            value: file.value,
            //path: path
        });

        const html = ejs.render(indexHtmlFormat, {
            title: `${file.value.title}`,
            main: post,
            nav: nav,
            footer: footer
        });
        fs.writeFileSync(`./convert/${category.folder}/${file.fileName}`,html);
    });
});








//home


main = ejs.render(homeHtmlFormat,{
    posts: posts,
    
});

html=ejs.render(indexHtmlFormat,{
    title: aboutValue.username,
    main,
    nav,
    footer
});

fs.writeFileSync('./index.html',html);


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
      title: 'Detective Code', 
      main,
      nav,
      footer
      });
    
  });




















module.exports = router;
