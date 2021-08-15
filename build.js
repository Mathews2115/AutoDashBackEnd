var exec = require('child_process').exec;
var os = require('os');

function puts(error, stdout, stderr) { console.log(stdout) }

// Run command depending on the OS
// if (os.type() === 'Linux') 
//    exec("node build-linux.js", puts); 
// else if (os.type() === 'Darwin') 
//    exec("node build-mac.js", puts); 
// else if (os.type() === 'Windows_NT') 
//    exec("node build-windows.js", puts);
// else
//    throw new Error("Unsupported OS found: " + os.type());