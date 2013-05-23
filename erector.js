console.log("Compiling pages to html");

var jade = require('jade'),
  fs = require('fs'),
  finish = require('finish'),
  slideNames = [],
  _ = require('lodash');

// loop through all the programs in the data dir
fs.readdir(__dirname+'/data', function(err, programs){
  if(err){console.dir(err);}
  programs.forEach(function(program){
    var programDir = __dirname+'/data/'+program;
    
    // make sure it's a directory (not a hidden one either)
    if(program[0] !== '.'){
      fs.stat(programDir, function(err, stat){
        if(err){console.dir(err);}
        if(stat && stat.isDirectory()){
          console.log(program);
          
          // loop through the json files
          fs.readdir(programDir, function(err, pages){
            if(err){console.dir(err);}
            pages.forEach(function(file){
              if(file[0] !== '.'){ // skip hidden files
                
                var slide = file.slice(0, -5);
                slideNames.push(slide);
                
                // load the JSON
                fs.readFile(programDir+'/'+file, 'utf8', function(err, fileData){
                  if(err){console.dir(err);}
                  if(fileData){
                    console.log("Reading JSON from "+file);
                    var pageData = JSON.parse(fileData);
                    
                    // begin the recursive template build routine
                    var outputHTML = buildTemplate(pageData);
                    
                    // write the output to the file
                    var outputFile = '../programs/'+program+'/'+slide+'.html';
                    fs.writeFile(outputFile, outputHTML, 'utf8', {flag: 'w+'}, function(err){
                      if(err){console.dir(err);}
                      console.log("Wrote html to "+outputFile);
                    });
                  }
                });
              }
            });
            
            // write out the manifest stuff
            fs.writeFile(programDir+'/.slide_names.json', JSON.stringify(slideNames), 'utf8', {flag: 'w+'}, function(err){
              if(err){console.dir(err);}
              console.log("Wrote slide_names");
            });
            
            
          });
        } else {
          console.error('ERROR: '+program+' is not a directory');
          //console.dir(err);
        }
      });
    }
  });
});


function buildTemplate(data, callback){
  //console.dir(data);
  if(data.template && data.locals){
    console.log('Building template '+data.template);
    
    // load the template from the file
    var templatePath = __dirname+'/library/'+data.template+'.jade';
    var templateData = fs.readFileSync(templatePath);
    var template = jade.compile(templateData, {filename: templatePath, pretty: true});
    
    // iterate through all the properties that are not "template" or "locals"
    _.forOwn(data, function(num, key){
      if(key !== 'template' && key !== 'locals' && typeof data[key] === 'object'){
        //console.log("filling "+key);
        
        for(var i = 0, n = data[key].length; i < n; i++){
          
          var subTempHTML = buildTemplate(data[key][i]);
          
          //console.log("Adding subtemplate output to "+key);
          if(typeof data.locals[key] === 'undefined'){
            data.locals[key] = '';
          }
          data.locals[key] += subTempHTML;
        }
      }
    });
    
    //console.dir
    data.locals._ = _;
    return template(data.locals);
  }
}
