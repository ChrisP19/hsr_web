# this file imports custom routes into the experiment server
import sys

sys.path.append('/Users/michaelluskey/Documents/RL/LFD/lapmaster1.1/')
#sys.path.append('/home/laskeymd/RL')


import IPython
import cv2
import numpy as np
from PIL import Image
from flask import send_file
import os

import cPickle as pickle
from flask import Blueprint, render_template, request, jsonify, Response, abort, current_app,make_response
from jinja2 import TemplateNotFound
from flask import Flask
from flask.ext.jsonpify import jsonify
from functools import wraps,update_wrapper
from sqlalchemy import or_

from psiturk.psiturk_config import PsiturkConfig
from psiturk.experiment_errors import ExperimentError
from psiturk.user_utils import PsiTurkAuthorization, nocache
from datetime import timedelta

# # Database setup
from psiturk.db import db_session, init_db
from psiturk.models import Participant
from json import dumps, loads
from cStringIO import StringIO
import cv2
# load the configuration options
config = PsiturkConfig()
config.load_config()
myauth = PsiTurkAuthorization(config)  # if you want to add a password protect route use this

#
# explore the Blueprint
custom_code = Blueprint('custom_code', __name__, template_folder='templates', static_folder='static')
custom_code = Flask(__name__)
custom_code.config['PROPAGATE_EXCEPTIONS'] = True


#rc11 = pickle.load(open('/Users/michaelluskey/Documents/RL/LFD/AMT_Experiment/RoboCont.p'))

def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator

worker_ind = 0
edited = False

def get_ind(ind, direction):
    num_images = 10
    return 0 if direction == 0 else (ind + direction) % (num_images + 1)

def get_dir(val):
    return {"start": 0, "next": 1, "prev": -1}[val]

def gen(username, direction):
    global worker_ind
    global edited
    if not edited:
        worker_ind = get_ind(worker_ind, direction)
        edited = True
    else:
        edited = False
    frame = open("data/images/frame_" + str(worker_ind) + ".png", "rb").read()
    return (b'--frame\r\n'
           b'Content-Type: image/png\r\n\r\n' + frame + b'\r\n')

@custom_code.route('/image_<direction>/<username>')
@crossdomain(origin='*')
def image_get(direction, username):
    return Response(gen(username, get_dir(direction)),mimetype='multipart/x-mixed-replace; boundary=frame')

labelclasses = ["oatmeal", "mustard", "syrup", "mayonnaise", "salad dressing"] #preserve js ordering

@custom_code.route('/state_feed')
@crossdomain(origin='*')
def state_feed():
    global worker_ind
    global edited
    data = dict(request.args)['undefined']
    direction = data[0]
    d = get_dir(direction)

    if not edited:
        worker_ind = get_ind(worker_ind, d) #needs to be synced
        edited = True
    else:
        edited = False
    objects = []
    #group by 3s
    for datapoint in zip(*[data[1:][i::3] for i in range(3)]):
        obj = {}
        obj['box_index'] = datapoint[0]
        obj['num_class_label'] = labelclasses.index(datapoint[1])
        obj['wID'] = datapoint[2]
        objects.append(obj)
    old_ind = get_ind(worker_ind, d * -1)
    path = "data/labels/" + str(old_ind) + ".p"

    if len(objects) > 0:
        label_data = {}
        label_data['num_labels'] = len(objects)
        label_data['objects'] = objects
        pickle.dump(label_data, open(path,'wb'))
    elif d != 0:
        try:
            os.remove(path)
        except OSError:
            pass

    try:
        next_data = pickle.load( open("data/labels/" + str(worker_ind) + ".p", "rb"))
        all_data = []
        for obj in next_data['objects']:
            bounds = obj['box_index']
            label = labelclasses[obj['num_class_label']]
            all_data.append([bounds, label])
        return jsonify(result={"status": 200}, next_data=all_data)
    except (OSError, IOError) as e:
        return jsonify(result={"status": 200}, next_data=-1)


@custom_code.route('/save_data')
@crossdomain(origin='*')
def save_data():
	"""Return states of current image."""
	data = dict(request.args)

	return jsonify(result={"status": 200})

if __name__ == '__main__':
    print "running"

    custom_code.run(host='0.0.0.0', threaded = True)
