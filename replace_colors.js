const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return callback(null);
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        next();
                    });
                } else {
                    if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
                        processFile(file);
                    }
                    next();
                }
            });
        })();
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Do NOT replace the variable definitions in :root of css files.
    // We'll replace globally, but then revert the variable definitions if necessary,
    // or just use regex with lookbehinds (which JS supports).
    
    // Replace #7f866e with var(--primary-olive) 
    // BUT only if it is NOT preceded by "--primary-olive: " or "--primary-olive:"
    content = content.replace(/(?<!--primary-olive:\s*)(?<!--primary-olive:)(#7f866e)/gi, 'var(--primary-olive)');
    
    // Replace #5a6b53 with var(--primary-olive-dark)
    content = content.replace(/#5a6b53/gi, 'var(--primary-olive-dark)');

    // Replace #e8eee6 with var(--primary-olive-light)
    content = content.replace(/#e8eee6/gi, 'var(--primary-olive-light)');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

walk(path.join(__dirname, 'public'), function(err) {
    if (err) throw err;
    console.log('Done!');
});
