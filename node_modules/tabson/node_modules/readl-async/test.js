//Import dependencies
var readl = require('./index.js');

//Initialize the reader object
var reader = new readl('./file.txt', { emptyLines: false });

//Error event
reader.on('error', function(e){ console.log(e.message); });

//Read line event
reader.on('line', function(line, index, start, end, length)
{
  //Display in console
  console.log('Line ' + index + ': ' + line);
});

//End event
reader.on('end', function(){ console.log('Completed!'); });

//Start reading the file
reader.read();
