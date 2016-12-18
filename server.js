//using express
var express = require('express');

// initialize app
var app = express();

// multer to upload the file
var multer = require('multer');

// library to convert xls / xlsx to json
var  xltojs = require("xlsx-to-json");

// library to convert csv / tsv to json
var tabson = require('tabson');

// body parser to parse the body of POST request
var bodyParser = require('body-parser');

// File System to read and write file
var fs = require('fs');

// Encoded data can be read
app.use(bodyParser.urlencoded());

// All static files are present in public folder. This line will tell node server, where to search the requested files
app.use(express.static(__dirname + "/public"));

var storage =   multer.diskStorage({
  // Define the path where multer will upload the files
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  // Give the name to the file with uploaded date + original filename
  filename: function (req, file, callback) {
    callback(null,Date.now()+file.originalname.trim());
  }
});

// Call multer with our file to be uploded
var upload = multer({ storage : storage}).single('upload_file');

// POST. When user uploaded the file
app.post('/upload',function(req,res) {
	// Call uplaod
    upload(req,res,function(err) {
        if(err) {
        	// Error
            return res.end("Error uploading file.");
        }
    });
    // Return to the page
    res.redirect('/calculations.html');
});

// GET. Downlod the result file
app.get('/download',function(req,res) {
	// Get the result file to be downloded. Get the path and send the file to download
    var dir_name = __dirname + "/public";
	var file = dir_name + '/output';
	res.download(file);
});

// GET. Download approach file
app.get('/downloadapproach',function(req,res) {
	// Get the approach file to be downloded. Get the path and send the file to download
    var dir_name = __dirname + "/public";
	var file = dir_name + '/PseudoCode.pdf';
	res.download(file);
});

// POST. write the result to the resultant file
app.post('/writeToFile',function(req,res) {
	// Create the path for the file
	var dir_name = __dirname + "/public";
	var file = dir_name + '/output';

	// Get the resultant data from request body
	var result = req.body.result;

	// Create the write stream for writing the file
	var file = fs.createWriteStream(file);

	file.on('error', function(err) {
	 	console.log('file could not be written') 
	});

	// Header of the file
	file.write('groupId' + ' \t ' + 'adId' + ' \t ' + 'status' + ' \t ' + 'remark' +'\n');
	// New line after header
	file.write('\n');

	// travers the result
	result.forEach(function(v) {
		// Write values to the file
	 	file.write(v.groupId + ' \t ' + v.adId + ' \t ' + v.status + ' \t ' + v.remark +'\n'); 
	});
	// End the file
	file.end();

	// Return success message
	res.json('success');
});

// GET. Fetch the data from the uploded file
app.get('/fetchData',function(req,res) {
	// Initialize
    var array = {};

    // File Path
    var dir_name = "./uploads";

    // Reading the whole directory, but we will have one file every time
    fs.readdir(dir_name, function(err, files) {
    	// error
        if (err) return;

        // Iterate all the file. In our case always one file
        files.forEach(function(currentfile) {
        	// Assign the file
		    var thisFile = dir_name + '/' + currentfile;

        	// Split the file name
	        var fileNameSplit = currentfile.split('.');

	        // Get the file format from splitted name
		    var fileFormat = fileNameSplit[fileNameSplit.length - 1];

		    
		    if (fileFormat == 'xlsx' || fileFormat == 'xls') {
		    	// For xls and xlsx
		    	// Convert to JSON
		        xltojs({
		          input: thisFile,
		          output: null
		        }, function(err, result) {
		          	if (err) {
		            	console.error(err);
		          	} else {
		          		// Get the converted file
		            	array = result;
		          	}
		          
			        // Move the original uploded file to the processed folder
			        var source = fs.createReadStream(thisFile);
				    var dest = fs.createWriteStream('./processedxls/' + currentfile);
				    source.pipe(dest);
				    source.on('end', function() { fs.unlinkSync(thisFile); });
				    source.on('error', function(err) {
				    	console.log('could not copy')
				    });

				    // Return the data
			        res.json(array);
		        });
		    } else if (fileFormat == 'tsv') {
		    	// For tsv
		    	// Convert to json
			  	tabson(thisFile, { type: 'object', sep: '\t' }, function(error, header, data) {
			  		// error
				  	if(error){ 
				  		return console.error(error.message); 
				  	}
				  	
				  	// Move the original uploded file to processed folder
				  	var source = fs.createReadStream(thisFile);
				    var dest = fs.createWriteStream('./processedcsvtsv/' + currentfile);
				    source.pipe(dest);
				    source.on('end', function() { fs.unlinkSync(thisFile); });
				    source.on('error', function(err) {});

				    // return data
				  	res.json(data);
				});
			} else if(fileFormat == 'csv') {
				// For csv
		    	// Convert to json
				tabson(thisFile, { type: 'object', sep: ',' }, function(error, header, data) {
					// error
				    if(error){
				    	return console.error(error.message); 
				    }

				    // Move the original uploded file to processed folder
				    var source = fs.createReadStream(thisFile);
				    var dest = fs.createWriteStream('./processedcsvtsv/' + currentfile);
				    source.pipe(dest);
				    source.on('end', function() { fs.unlinkSync(thisFile); });
				    source.on('error', function(err) {});

				    // return data
				    res.json(data);
				});
			}else {
				// If file format is not from supported file format
				res.json('error in file format');

				// move the filw to not porcessed folder
				var source = fs.createReadStream(thisFile);
				var dest = fs.createWriteStream('./wrong-format-files/' + currentfile);
		  		source.pipe(dest);
		  		source.on('end', function() {
		  			fs.unlinkSync(thisFile); 
		  		});

		  		source.on('error', function(err) {
		  			// error
		  		});
			}
    	});
  	});
});

// Listen on port
app.listen(3000);
console.log("server running on port 3000")