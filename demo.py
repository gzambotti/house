"""
__author__ = "Giovanni Zambotti"
__copyright__ = ""
__credits__ = ["Giovanni Zambotti"]
__license__ = "GPL"
__version__ = "1.0.0"
__maintainer__ = "Giovanni Zambotti"
__email__ = "g.zambotti@gmail.com"
__status__ = "Production"
__note__= Script to update a feature service from a text file
"""

#from  IPython.display import display
import arcgis, time, json
from arcgis.gis import GIS
import pandas as pd
import numpy as np
from copy import deepcopy
#import argparse
import configparser

import sys
#!flask/bin/python
from flask import Flask, render_template, request, redirect, Response, jsonify
import random, json

app = Flask(__name__)

@app.route('/')
def output():        
	# serve index template
	return render_template('index.html', name='Joe')


@app.route('/test', methods = ['get'])
def test():
    print ("Hello")
    #a = request.args.get('a', 0, type=int)
    #b = request.args.get('b', 0, type=str)
    #print( jsonify(result=a + b))
    #portal('{"attributes": {"id": 8118,"name": "z888","zipcode": "88555","date": "20181203"}}')
    return "nothing"

@app.route('/add', methods=['POST'])
def add():
        print ("Hello")
        a = request.form.get('a', 0, type=int)
        b = request.form.get('b', 0, type=str)
        portal('{"attributes": {"id": ' + a + ',"name": "z888","zipcode": "' + b + '","date": "20181203"}}')
        return jsonify(result=a + b)

@app.route('/receiver', methods = ['POST'])
def worker():        
	# read json + reply
	data = request.get_json(force=True)
	
	d = json.dumps(data[0])
	print (d)
	portal(d)
	result = ''
	for item in data:
                # loop over every row
		#result = str(item['id']) + "-" + str(item["name"]) + "-" + str(item['zipcode']) + "-" + str(item['date'])                
                result = 'test'
	return result

config = configparser.ConfigParser()
# path must be change according to the environment/OS
config.read(r"C:\gis\p2018\wireless\script\config_house.txt")
passwd = config.get("configuration","password")
#print (passwd)

gis = GIS("https://www.arcgis.com", "name", passwd, verify_cert=False)
# update wifi dataset (snr5, snr2.4, and nextgen)
def portal(house_json):    
    # get the snr feature service from portal
    snr5_features = gis.content.get('9fb9c869948e435e9fb5f2e1e8a85d50')
    snr5_fset = snr5_features.tables[0] #querying without any conditions returns all the features
    #snr5_fset.sdf.head()
    #all_features = snr5_fset.features
    #print (all_features[0])
    #house_dict = {"attributes": {"id": 222,"name": "z222","zipcode": "22222","date": time.strftime("%Y%m%d")}}
    print (house_json)
    d = json.loads(house_json)
    #add_result = snr5_fset.edit_features(adds = [house_dict])
    add_result = snr5_fset.edit_features(adds = [d])
    add_result
    #print (snr5_fset.sdf.head())
if __name__ == '__main__':
	# run!
	app.run()


