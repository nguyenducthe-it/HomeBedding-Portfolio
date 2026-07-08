const fs = require('fs');
const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const data = fs.readFileSync('public/img/4mua1.jpg');
const body = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="4mua1.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'),
    data,
    Buffer.from('\r\n--' + boundary + '--\r\n')
]);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/consultations/upload-file',
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length
    }
};

const req = http.request(options, (res) => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => console.log('Response:', res.statusCode, d));
});
req.on('error', e => console.error(e));
req.write(body);
req.end();
