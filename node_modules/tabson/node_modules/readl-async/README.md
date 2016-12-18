# readl-async

> Read a file line by line asynchronously

[![npm](https://img.shields.io/npm/v/readl-async.svg?style=flat-square)](https://www.npmjs.com/package/readl-async)
[![npm](https://img.shields.io/npm/dt/readl-async.svg?style=flat-square)](https://www.npmjs.com/package/readl-async)

## Install

You can install the latest version of the package using **npm**:

```
$ npm install --save readl-async
```

## Usage

```javascript
//Import dependencies
var readl = require('readl-async');

//Initialize the reader object
var reader = new readl('file.txt', { encoding: 'utf8' });

//Emit this function when one line is read:
reader.on('line', function(line, index, start, end)
{
  //Do your magic with the line
  // ....
});

//Emit this function when the file is full read
reader.on('end', function()
{
  //Do more magic
  // ....
});

//Emit this function when an error occurs
reader.on('error', function(error)
{
  //Do some stuff with the error
  // ....
});

//Start reading the file
reader.read();
```

## API

### var reader = new readl(file, options)

Initialize the reader object. This method accepts the following arguments:

##### file

A `string` with the path to the file.

##### options

An `object` with the following options:

- `encoding`: set the encoding. Default: `utf8`.
- `emptyLines`: set it to `false` if you want to omit the empty lines. Default: `true`.
- `start`: start position. Default is 0.
- `chunk`: set the chunk size. Default is 1024.
- `endl`: set the end-line character. Default is `0x0a`.

### reader.read()

Starts the file read process.

### reader.on('line', handler)

Emit the provided function when one line of the file is read. The handler function will be called with the following arguments:

- `line`: a `string` with the read line.
- `index`: an `integer` with the line number. The line counter starts in 1.
- `start`: an `integer` with the start position of the line in the file.
- `end`: an `integer` with the end position of the line in the file.
- `length`: an `integer` with the number of bytes read.

You can stop the file reading at a particular line by making the callback function return `false`.  

### reader.on('end', handler)

Emit the provided function when the end of file is reached.

### reader.on('error', handler)

Emit the provided function if there was an error reading the file.


## Related

- [readl](https://github.com/jmjuanes/readl): synchronous version of this module.

## License

[MIT](./LICENSE) &copy; Josemi Juanes.
