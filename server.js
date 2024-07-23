const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

const server = http.createServer((req, res) => {
    const method = req.method;
    const url = req.url;
    if (method === 'GET' && url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'),  'utf8', (err, htmlData) => {
            if (err) {
                res.statusCode = 500;
                res.end('Internal Server Error');
                return;
            }
            fs.readFile(path.join(__dirname, 'data.json'), (err, data)=>{
                let todos = JSON.parse(data);
                const todoListHtml = todos.map((todo, index) => `
                    <li class="todo-item py-1">
                        <span class="cursor-pointer text-sm text-red-500 delete-task">x</span>
                        <span data-id="${index}" class="cursor-pointer hover:underline hover:underline-offset-4 pl-4">${todo}</span>
                    </li>
                `).join('');

                const placeholders = {
                    'title': 'To-Do List Application',
                    'todoList': todoListHtml,
                };
                
                let finalHtml = htmlData
                for (const [key, value] of Object.entries(placeholders)) {
                    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                    finalHtml = finalHtml.replace(regex, value);
                }
                res.setHeader('Content-Type', 'text/html');
                res.statusCode = 200;
                res.end(finalHtml);
            })

        });
    } else if (method === 'GET' && url.match(/\.css$/)) {
        const cssPath = path.join(__dirname, url);
        fs.readFile(cssPath, 'utf8', (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.end('Not Found');
                return;
            }
            res.setHeader('Content-Type', 'text/css');
            res.statusCode = 200;
            res.end(data);
        });
    }else if (method === 'POST' && url === '/add-todo') {
        let body='';
        req.on('data', chunk => {
            body+=chunk.toString();
        });
        req.on('end', ()=>{
            const task = new URLSearchParams(body).get('task');
            const dataFilePath = path.join(__dirname, 'data.json');
            fs.readFile(dataFilePath, 'utf8', (err, data) => {
                const todos = JSON.parse(data);
                todos.push(task);
                fs.writeFile(dataFilePath, JSON.stringify(todos, null, 2), (err) => {
                    if (err) {
                        console.error('Error writing to file:', err);
                    }
                });
            })
        })
        res.writeHead(302, { 'Location': '/' });
        res.end();
    }else if (method === 'DELETE' && url.startsWith('/delete-todo/')) {
        const id = url.split('/')[2];
        const dataFilePath = path.join(__dirname, 'data.json');
        fs.readFile(dataFilePath, 'utf8', (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Internal Server Error');
                return;
            }
            let todos = JSON.parse(data);
            todos.splice(id, 1); // Remove the todo item by index
            fs.writeFile(dataFilePath, JSON.stringify(todos, null, 2), (err) => {
                if (err) {
                    res.statusCode = 500;
                    res.end('Internal Server Error');
                    return;
                }
                res.setHeader('Content-Type', 'text/plain');
                res.statusCode = 200;
                res.end('Deleted');
            });
        });
    }else if (method === 'GET' && url === '/todos') {
        res.setHeader('Content-Type', 'application/text');
        res.statusCode = 200;
        res.end('list');
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
