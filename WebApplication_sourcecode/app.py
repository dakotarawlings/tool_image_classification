# -*- coding: utf-8 -*-
"""
Created on Mon Feb  7 21:11:50 2022

@author: dakota

This script defines a flask application that implements a tool image classification
model on an image file sent via a POST request and returns a class prediction

"""


#import flask tools
from flask import Flask, jsonify, render_template, request

#Import image an file processing tools
from PIL import Image
import io
import numpy as np

#import model loading tools
import tensorflow as tf
from tensorflow.keras.models import model_from_json

#Call flask constructor
app=Flask(__name__)

#create matrix of clas names to interpret model output
class_names=['allen_key', 'circular_saw', 'drill', 'hacksaw', 'hammer', 'hand_saw', 'lug_wrench', 'pliers', 'screw_driver', 'wrench']

#Define flask endpoint for the main html page
@app.route('/')
def index():
    return render_template('index.html')

#defin a function that loads the saved tensorflow model
def load_model():
    #Load the model structure from model json file
    json_file=open('model/model.json','r')
    loaded_model_json=json_file.read()
    json_file.close()
    loaded_model=model_from_json(loaded_model_json)
    #load model weights from h5 file
    loaded_model.load_weights("model/model.h5")
    #compile model
    loaded_model.compile(loss='categorical_crossentropy', optimizer='adam',metrics=['accuracy'] )
    return loaded_model


#define an API endpoint that takes in an image file from a post reqest and returns
# a class prediction and an accuracy
@app.route('/predict', methods=['GET', 'POST'])
def predict():
    
    #monitor the success of the API through a success attribute
    response={'success': False}
    
    #Check for a post request    
    if request.method=='POST':
        
        #Check for a media attribute in the json input
        if request.files.get('media'):
            
            #retrieve the file sent by the post request
            img_requested=request.files['media'].read()
            
            #open the image file
            img=Image.open(io.BytesIO(img_requested))
            
            #check to make sure the image is in 'RGB format
            if img.mode!='RGB':
                img=img.convert('RGB')
            
            #resize the image to the format used to train the model
            img=img.resize((160,160))
            
            #convert the image to tensor    
            img=tf.keras.utils.img_to_array(img)
            img=tf.expand_dims(img, 0)
           
            #call our load_model fnction
            loaded_model=load_model()
            
            #call our model with the image
            predictions=loaded_model.predict(img)
            
            #transfrom the model output to a class name
            #we call the softmax function since the model returns logits
            score=tf.nn.softmax(predictions[0])
            response['predictions']=[]
            classname=str(class_names[np.argmax(score)])
            
            #retrieve the prediction accuracy from the model output
            accuracy=float(100*np.max(score))
            
            #create a JSON object with the relavent model outputs
            pred={'label':classname, 'probability':accuracy}
            response['predictions'].append(pred)

            #set our success attribute to true ince we have successfully run our model
            response['success']=True

            #return our resonse JSON
    return jsonify(response)
   
if __name__=='__main__':
    app.run(debug=False)
    
      
    
    
    
    
    
    
    