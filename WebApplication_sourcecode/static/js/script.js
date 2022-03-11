/* 
@author: dakota

this script file defines behaviors for the main (index.html) html file called 
by the tool image identification flask app

The script  gets an inputed image file from the file input element in the html
Updates the HTML file to display the uploaded image
Then sends a post request containing the image file to the image classification flask API
The response is then used to display the model's predicted class and predicted accuracy to the user

#This script also includes some basic client side validation of the uploaded file type
*/

//Define the URL for the flask API endpoint for the tool image classification model
const API_URL="/predict";

//Define a function to verify the user inputed file type and diplay the image on the HTML upon file upload
function onUpload() {
    
    //retieve the image from the file input HTML element
    const selectedFile = document.getElementById('toolFile').files[0];
    
    //Use our functions defined below to check the filetype and throw an errow/reload the page if the filetype is not correct
    checkRealMimeType(selectedFile)
    resetPredictions()
    
    //Call our empty HTML element that will display the uploaded image
    var uploadedImageElement=d3.select('#output');
    
    // create a temporary url for the image, input the URL into an image element, and input the element into our empty HTML container
    URLImage = URL.createObjectURL(selectedFile,{type: 'text/plain'});
    var ImageTemplate=`<img src=${String(URLImage)} alt="Selected Image" class="uploadedIm"/>`;
    uploadedImageElement.html(String(ImageTemplate))
}

//create a function to use the inputed image file to call the flask API and display the predictions on the HTML file
function onSubmit() {
    
    // get the image file from the file input HTML element
    const selectedFile = document.getElementById('toolFile').files[0];
    
    //create a temporary URL witht the file 
    URLImage = URL.createObjectURL(selectedFile,{type: 'text/plain'});
    console.log('this is the img url:')
    console.log(URLImage)



    //Define a form containing the image file to be sent to the flask API
    const formData = new FormData()
    formData.append('media', selectedFile)
    
    //Send a post request to the flask API with the image file
    fetch(API_URL, {
      method:"POST",
      body: formData,
      headers: {
        "Accept-Encoding": "*",
        "Connection": "keep-alive"
      }
      //define functions that handle API response
        }).then(response => response.json()
        .then(function(data) {
            //get the class prediction and the accuracy from the API response
            predictedClass=data['predictions'][0]['label'];
            probability=data['predictions'][0]['probability'];
            
            //call our classToTool function defined below to clean up the class name
            className=classToToolName(predictedClass);
            
            //call our GetRecomendation function to get a text element and formatting for our "suggestio" element that gives the user a suggestion if the prediction is not good
            [txtcolor, suggestionTemplate]=GetReccomendation(probability);
            
            //Call our function that updates the prediction element in the HTML
            updatePrediction(className, txtcolor);
            
            //Call our function that updates the prediction accuracy in the HTML
            updateProbability(probability,txtcolor, suggestionTemplate);
            
             }))
    
}

//Simple function that takes in the class prediction from the API and updates the HTML element that displays the class
function updatePrediction(prediction, txtcolor) {
    
    var predictionElement=d3.select('#prediction');
    
    var predictionTemplate=`Name of tool: <span style= "font-weight: bold; background: ${txtcolor}; color: white;"> ${prediction}</span>`;
    
    predictionElement.html(predictionTemplate)

}

//Simple function that takes in the accuracy of the prediction, a font color, and a suggestion and updates the HTML elements that displays the accuracy and a suggestion (when relevent)
function updateProbability(probability, txtcolor, suggestionTemplate) {
    
    var probabilityElement=d3.select('#probability');
    
    var suggestionElement=d3.select('#suggestion');
    
    var probabilityTemplate=`Accuracy: <span style= " font-weight: bold; color: ${txtcolor};"> ${Math.round(probability)}%</span>`;
    
    probabilityElement.html(probabilityTemplate)
    
    suggestionElement.html(suggestionTemplate)

}


//Simple function that takes in the accuracy of the class prediction and outputs a font color to help the user visualize the quality of the prediction
//If the accuracy is low, the function returns a message for the user to retake the photo or to inform the user that the tool may "not be in the database"
function GetReccomendation(probability) {

    var suggestionTemplate
    var txtcolor
    
    if (probability>75) {txtcolor='Green'}
    if (probability<75 && probability>45) {txtcolor='Yellow'; suggestionTemplate="<br>(Please check the quality of your image)</br><br> (Otherwise we may not have this tool in out database)</br>"}
    if (probability<75 && probability>45) {txtcolor='Red'; suggestionTemplate="<br>(Please check the quality of your image)</br><br> (Otherwise we may not have this tool in out database)</br>"}
 
    return [txtcolor, suggestionTemplate]
    

}

//Simple function to reformat the class text returned by the API
function classToToolName(predictedClass) {
    const classNames=['allen_key', 'circular_saw', 'drill', 'hacksaw', 'hammer', 'hand_saw', 'lug_wrench', 'pliers', 'screw_driver', 'wrench']
    const toolNames=['Allen key', 'Circular saw', 'Drill', 'Hacksaw', 'Hammer', 'Hand saw', 'Lug wrench', 'Pliers', 'Screw driver', 'Wrench']
    
    return toolNames[classNames.indexOf(predictedClass)]

}

//Simple function to empty the HTML elements that display the model predictions
//MEant to be called when the user inputs a new image before the user presses submit
function resetPredictions() {
    
    var probabilityElement=d3.select('#probability');
    
    var suggestionElement=d3.select('#suggestion');
    
    var predictionElement=d3.select('#prediction');
    
    probabilityElement.html('')
    
    suggestionElement.html('')
    
    predictionElement.html('')
    
    

}


//This function returns the rela mime type of the image inputed by the user
function checkRealMimeType(blob) {

    //define a funciton for the filereader to get the first 4 bytes of the file
    var fileReader = new FileReader();
    fileReader.onloadend = function(e) {
      var arr = (new Uint8Array(e.target.result)).subarray(0, 4);
      var header = "";
      for(var i = 0; i < arr.length; i++) {
         header += arr[i].toString(16);
      }
      
      //Call our headertofiletype funciton to conver the bytes to a file type
      fileType=headerToFileType(header)
      
      //call our functio to check if the file type is a jpeg or png      
      checkFileType(fileType)

    }
    
    //pass our file into our filereader object
    fileReader.readAsArrayBuffer(blob);
    
    }
      
     
// Simple function that takes in first 4 bytes of the inputed file and 
//checks if they are representative of a jpeg or png
function headerToFileType(header) {
    
    var type;

    switch (header) {
        case "89504e47":
            type = "image/png";
            break;
        case "47494638":
            type = "image/gif";
            break;
        case "ffd8ffe0":
        case "ffd8ffe1":
        case "ffd8ffe2":
        case "ffd8ffe3":
        case "ffd8ffe8":
            type = "image/jpeg";
            break;
        default:
            type = "unknown"; // Or you can use the blob.type as fallback
            break;
    }
    
    return type
}


//Function takes in filetype as a string and checks if it is a jpeg or png
//If not it raises an error and reloads the page
function checkFileType(FileType) {

    var fileInput = document.getElementById('toolFile');
  
    var filePath = fileInput.value;
    
    var allowedExtensions =["image/jpeg", "image/png"];
      
    if (!allowedExtensions.includes(FileType)) {
        alert('Invalid file type');
        fileInput.value = '';
        location.reload();
        return false;
        }
    }

//define event listeners for when the user inputs an image 
d3.select("#toolFile").on("change",onUpload);

//Event listener for when the user clicks submit
d3.select("#button").on("click",onSubmit);





