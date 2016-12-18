//Import dependencies
var tabson = require('./index.js');

//Read the test tab file
tabson('./file.txt', { type: 'object' }, function(error, header, data)
{
  //Check for error
  if(error){ return console.error(error.message); }

  //Display the header
  console.log('header: ' + header.join(' | '));

  //Read all the data elements
  for(var i = 0; i < data.length; i++)
  {
    //Display the data
    console.log(JSON.stringify(data[i]));
  }
});
