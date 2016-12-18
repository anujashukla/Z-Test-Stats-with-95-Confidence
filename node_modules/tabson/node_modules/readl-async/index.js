//Import dependencies
var fs = require('fs');
var pstat = require('pstat');

//Read line by line object
var readl = function(file, opt)
{
  //Check the file
  if(typeof file !== 'string'){ throw new Error('Missing file argument'); return null; }

  //Check the options
  if(typeof opt === 'undefined'){ var opt = {}; }

  //Save the file name
  this._file = file;

  //Check the encoding option
  this._encoding = (typeof opt.encoding === 'undefined') ? 'utf8' : opt.encoding.toString();

  //Check the chunk option
  this._chunk = (typeof opt.chunk === 'undefined') ? 1024 : opt.chunk;

  //Check the line break option
  this._endl = (typeof opt.endl === 'undefined') ? 0x0a : opt.endl;

  //Check the emptylines option
  this._emptyLines = (typeof opt.emptyLines === 'undefined') ? true : opt.emptyLines;

  //File object
  this._fd = null;

  //Actual position
  this._position = (typeof opt.start === 'undefined') ? 0 : opt.start;

  //Line count
  this._count = 0;

  //Events
  this._events = {};

  //Return this
  return this;
};

//Set the on functions
readl.prototype.on = function(name, handler){ this._events[name] = handler; };

//Read the file
readl.prototype.read = function()
{
  //Check if file exists
  if(pstat.isFileSync(this._file) === false){ return this._emit('error', [ new Error('File not found') ]); }

  //Save this
  var self = this;

  //Open the file
  fs.open(this._file, 'r', function(error, fd)
  {
    //Check for error
    if(error){ return self._emit('error', [ error ]); }

    //Save the file
    self._fd = fd;

    //Read lines from the file
    self._getLine(function()
    {
      //Close the file and emit the done event
      fs.close(self._fd, function(){ return self._emit('end'); });
    });
  });
};

//Emit an event
readl.prototype._emit = function(name, args)
{
  //Check the arguments
  if(typeof args === 'undefined'){ var args = []; }

  //Check if event exists
  if(typeof this._events[name] !== 'function'){ return true; }

  //Call the event
  var out = this._events[name].apply(null, args);

  //Check for not boolean
  if(typeof out !== 'boolean'){ return true; }

  //Default, return the boolean
  return out;
};

//Get a buffer from file
readl.prototype._getBuffer = function(cb)
{
  //Save this
  var self = this;

  //Create the buffer
  var buff = new Buffer(this._chunk);

  //Get the chunk
  fs.read(this._fd, buff, 0, this._chunk, this._position, function(error, bytesRead, buff)
  {
    //Check for error
    if(error){ return self._emit('error', [ error ]); }

    //Check the length
    if(bytesRead === 0){ return cb(false); }

    //Compare with the chunk size
    if(bytesRead < self._chunk){ buff = buff.slice(0, bytesRead); }

    //Get the line end
    var index = buff.indexOf(self._endl);

    //Slice the buffer
    buff = (index !== -1) ? buff.slice(0, index) : buff;

    //Return the buffer
    return cb(buff);
  });
};

//Get line from file
readl.prototype._getLine = function(cb)
{
  //Save this
  var self = this;

  //Get the buffer
  this._getBuffer(function(line)
  {
    //Check for exit
    if(line === false){ return cb(); }

    //Convert the line to utf8
    var line_str = line.toString(self._encoding);

    //Increment the line counter
    self._count = self._count + 1;

    //Save the start position
    var position_start = self._position;

    //Save the end position
    var position_end = self._position + line.length + 1;

    //Update the position
    self._position = position_end;

    //Check for empty line
    if(line_str.replace(/\s/g, '') === '' && self._emptyLines === false){ return self._getLine(cb); }

    //Emit the line
    var next = self._emit('line', [ line_str, self._count, position_start, position_end, line.length ]);

    //Stop reading the file
    if(next === false){ return cb(); }

    //Next line
    return self._getLine(cb);
  });
};

//Exports to node
module.exports = readl;
