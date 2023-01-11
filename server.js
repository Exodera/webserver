const http = require('http');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const logEvent = require('./logEvents');
const EventsEmitter = require('events');
class MyEmitter extends EventsEmitter{};

const myEmitter = new MyEmitter();
myEmitter.on('log', (msg, fileName) => logEvent(msg, fileName)); 
const PORT = process.env.PORT || 3500;

const serveFile = async (filePath, contentType, response)=>{
    try{
       const rawData = await fsPromises.readFile(
        filePath, 
        !contentType.includes("image")
        ?'utf-8'
        :''
        );
       const data = contentType === "application/json" ? JSON.parse(rawData) : rawData;
       
       response.writeHead(
        filePath.includes("404.html")? 404: 200,
        {'contentType':contentType});
       response.end(
        contentType === "application/json" ? JSON.stringify(data): data
       );
    }
    catch(err){
        console.log(err);
        myEmitter.emit('log',`${err.name}\t${err.message}`, 'errLog.txt');
        response.statusCode = 500;
        response.end();
    }
}

const server = http.createServer((req, res)=>{
    console.log(req.url, req.method)

    myEmitter.emit('log',`${req.url}\t${req.method}`, 'reqLog.txt');

    const extension = path.extname(req.url);
    let contentType;

    switch(extension){
        case '.css':
            contentType = "text/css";
            break;
    
        case '.js':
            contentType = "text/javascript";
            break;

        case '.json':
            contentType = "application/json";
            break;
        
        case '.jpg':
            contentType = "image/jpeg";
            break;
     
        case '.png':
            contentType = "image/png";
            break;
            
        case '.txt':
            contentType = "text/plain";
            break;
    
        default:
        contentType = "text/html";
       
    }
    
    let filePath =
        contentType === "text/html" && req.url ==='/'
        ?path.join(__dirname, 'views', 'index.html')
        :contentType === "text/html" && req.url.slice(-1) ==='/'
            ?path.join(__dirname, 'views', req.url, 'index.html')
            :contentType === "text/html"
                ?path.join(__dirname, 'views', req.url)
                :path.join(__dirname,  req.url);
    
    
   // if(!extension && req.url.slice(-1)==='/') filePath +='.html';
    
    const fileExists = fs.existsSync(filePath);
    if(fileExists){
        // serve the file
        serveFile(filePath,contentType,res)
    
    }
    else{
        //404
        //301
       switch(path.parse(filePath).base){
        case 'old':
            res.writeHead(301,{'Location': 'new-page.html'});
            res.end();
            break;

        case 'custom':
        res.writeHead(301,{'Location': 'new-page.html'});
        res.end();
        break;

        default:
            serveFile(path.join(__dirname, 'views','404.html'),'text/html',res)
       }
    
    }
    
   

})

server.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`)
})




// myEmitter.on('log', (msg) => logEvent(msg));  
// myEmitter.emit('log','Log Event Emitted!');
