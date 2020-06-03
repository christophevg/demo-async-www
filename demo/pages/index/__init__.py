import logging
logger = logging.getLogger(__name__)

import os
import time

from threading import Thread

# register the Vue component for the UI

from baseweb.interface import register_component

register_component("index.js", os.path.dirname(__file__))

from flask import request
from baseweb.socketio import socketio

def now():
  return int(round(time.time() * 1000))

# common handle functionality: adds 2s delay

def handle(msg):
  msg["log"]["start"] = now() - msg["log"]["received"]
  time.sleep(2)
  msg["log"]["end"] = now() - msg["log"]["received"] - msg["log"]["start"]
  return msg

# rudimentary threading setup to dispatch messages to handle functionality in an
# async-like way, in a less qnd solution one uses an async framework to do this
# in reality, this would be a dispatch to some published topic

queue = []

def run_handler():
  while len(queue) > 0:
    socketio.emit("log", handle(queue.pop(0)))

handler = None

def add_to_queue(msg):
  global handler
  queue.append(msg)
  if handler is None or not handler.isAlive():
    handler = Thread(target=run_handler, args=())
    handler.start()

# set up a REST resources to handle requests from the UI

from flask_restful import Resource
from baseweb.rest import api

class HandleSync(Resource):
  def post(self):
    msg = request.get_json()
    msg["log"] = { "received": now() }
    return handle(msg)

api.add_resource(HandleSync, "/api/handle/sync")

class HandleASync(Resource):
  def post(self):
    msg = request.get_json()
    msg["log"] = { "received": now() }
    add_to_queue(msg)

api.add_resource(HandleASync, "/api/handle/async")

class Timestamp(Resource):
  def get(self):
    return { "time" : now() }

api.add_resource(Timestamp, "/api/time")
