# tabson

> Convert a tab file (TSV) to JSON

[![npm](https://img.shields.io/npm/v/tabson.svg?style=flat-square)](https://www.npmjs.com/package/tabson)
[![npm](https://img.shields.io/npm/dt/tabson.svg?style=flat-square)](https://www.npmjs.com/package/tabson)

## Install

Install the package using NPM:

```
npm install --save tabson
```

## Usage

```javascript
//Import dependencies
var fs = require('fs');
var tabson = require('tabson');

// file.txt content:
// col1	col2	col3	col4
// element1.1	element1.2	element1.3	element1.4
// element2.1	element2.2	element2.3	element2.4
// element3.1	element3.2	element3.3	element3.4

//Read the test tab file
tabson('./file.txt', { type: 'object', sep: '\t' }, function(error, header, data)
{
  //Check for error
  if(error){ return console.error(error.message); }

  //Save the file
  fs.writeFileSync('./file.json', JSON.stringify(data), 'utf8');

  // file.json content:
  // [
  //   {"col1":"element1.1","col2":"element1.2","col3":"element1.3","col4":"element1.4"},
  //   {"col1":"element2.1","col2":"element2.2","col3":"element2.3","col4":"element2.4"},
  //   {"col1":"element3.1","col2":"element3.2","col3":"element3.3","col4":"element3.4"}
  // ]
});
```

### tabson(file, options, callback)

Read the content of the file and return his content in a JSON format.

#### file

A `string` with the path of the file to read.

#### options (optionally)

An `object` with the following options:

- `encoding`: set the encoding. Default: `utf8`.
- `chunk`: set the chunk size. Default is 4098.
- `sep`: set the file separator. Default is a tabulation `\t`.
- `empty`: set the value for the empty columns. Default is an empty string.
- `type`: set the output type:
   - `array`: each row of the table will be saved as an array object.
   - `object`: each row of the table will he saved as an object with the format `column_name : column_content`.

#### callback

A function that will be called when the file is full read. This function will be called with the following arguments:

- `error`: an `error` object.
- `header`: an `array` with the column names.
- `data`: an `array` with the table content.

## Related

- [tabson-cli](https://github.com/jmjuanes/tabson-cli): CLI for this module.

## License

[MIT LICENSE](./LICENSE) &copy; Josemi Juanes.
