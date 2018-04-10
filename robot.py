import os
import Pyro4
import time
import cPickle as pickle
import cv2

sharer = Pyro4.Proxy("PYRONAME:shared.server")

#robot interface
def label_image(img):
    global sharer

    sharer.set_img(img)
    sharer.set_img_ready(True)

    print("robot waiting")
    while not sharer.is_labeled():
        pass

    label = sharer.get_label_data()
    sharer.set_labeled(False)

    return label

for ind in range(0, 6):
    frame = "data/images/frame_" + str(ind) + ".png"

    label_data = label_image(frame)
    print(label_data)
    print(float(label_data['time'])/1000.0)
    print(float(label_data['latency'])/1000.0)
    # time.sleep(5)
    # pickle.dump(label_data, open("data/labels/" + str(ind) + ".p",'wb'))
