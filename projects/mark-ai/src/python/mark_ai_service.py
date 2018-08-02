import os
import queue
import import_data as i_data
import tensorflow as tf
import preprocess_twitter as pt
import redis
import json
import numpy as np
import sys
import getopt
import logging
from tensorflow.python.keras.preprocessing import sequence
from threading import Event, Thread
from tensorflow.contrib import predictor
from pathlib import Path



CONFIG = {
    'host': None,
    'port': None,
    'db': 0,
    'password': None
}
CHANNEL = 'bots-*'
CHANNEL_REPLY = 'botsreply-'

def run_model(q, stop, predict_fn, word2id, red):
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
    logging.info("Loaded... listening on channel")
    while(not stop.is_set()):
        try:
            hashtags = 0
            urls = 0
            ids = []
            
            message = q.get_nowait()
            content = message['content'].decode("utf-8")
            channel = message['channel'].decode("utf-8")
            split = pt.tokenize(content)
            split = split.split()
        
            for word in split:
                index = word2id.get(word, i_data.UNKNOWN_INDEX)
                if(index == i_data.HASHTAG_INDEX):
                    hashtags += 1
                elif(index == i_data.URL_INDEX):
                    urls += 1
                ids.append(index)
            
            length = len(ids)
            # extra dimension is for feeding through sequence.pad_sequence
            ids = [ids]
            ids = sequence.pad_sequences(ids, 
                                        maxlen=50,
                                        truncating='post',
                                        padding='post',
                                        value=i_data.PAD_INDEX)
            # remove extra dimension
            ids = ids[0]

            # favorite_count, num_hashtags, num_urls, reply_count
            attributes = [0, hashtags, urls, 0]

            # model expects dict below
            inputs = {'text': ids, 'len':length, 'attributes': attributes}

            predictions = predict_fn(inputs)

            logging.info("output class: %d \n user propability: %f \n bot probability %f",
                predictions['pred_output_classes'][0],
                predictions['probabilities'][0][0],
                predictions['probabilities'][0][1])
            # Predictions: First array holds percentages of confidence of class
            # class at index 0 is a human
            # class at index 1 is a bot

            resp = {}
            resp['class'] = int(predictions['pred_output_classes'][0])    # .item() converts to native python type
            resp['percentage0'] = float(predictions['probabilities'][0][0])
            resp['percentage1'] = float(predictions['probabilities'][0][1])

            channel = channel.split("-")
            channel = CHANNEL_REPLY + channel[1]
            red.publish(channel, json.dumps(resp))
        # when there is nothing in the queue continue to loop
        except queue.Empty:
            continue


def main(argv):
    try:
        opts, args = getopt.getopt(argv, "h:s:p:", ['host=', 'password=', 'port='])
    except getopt.GetoptError as err:
        #logging.info('mark_ai_service.py -ip <ip address> -pw <password> -port <port>')
        #logging.info(err)
        sys.exit(2)

    for opt, arg in opts:
        if opt == "-h" or opt == "--host":
            CONFIG['host'] = arg
        elif opt == "-s" or opt == "--password":
            CONFIG['password'] = arg
        elif opt == "-p" or opt == "--port":
            CONFIG['port'] = arg

    if CONFIG['host'] == None or CONFIG['password'] == None or CONFIG['port'] == None:
        #logging.info('Missing arguments:')
        #logging.info('mark_ai_service.py -ip <ip address> -pw <password> -port <port>')
        sys.exit()
    
    red = redis.StrictRedis(**CONFIG)
    stop = Event()
    q = queue.Queue()


    pythonDir = os.path.dirname(os.path.abspath(__file__))

    # logging.info('pythonDir', pythonDir)
    # logging.info('out2', Path(pythonDir, "../../embeddings").resolve())
    # logging.info('embed', Path(pythonDir, "../../embeddings/glove.twitter.27B.25d.txt").resolve())
    # logging.info('predict', Path(pythonDir, "../../models/bot_detection").resolve())

    embeddingsPath = str(Path(pythonDir, "../../embeddings/glove.twitter.27B.25d.txt").resolve())
    predictFnPath =  str(Path(pythonDir, "../../models/bot_detection").resolve())

    # logging.info('embedding path', embeddingsPath)
    # logging.info('predict path', predictFnPath)

    word2id, _ = i_data.load_embeddings(embeddingsPath, 25)
    predict_fn = predictor.from_saved_model(bytes(predictFnPath, 'utf8'))
    thread = Thread(target=run_model, kwargs=dict(
                                                stop=stop,  # Thread Stop signal
                                                q=q,        # Queue of Marks to run through predict_fn
                                                predict_fn=predict_fn,
                                                word2id=word2id, # dictionary for common words to word ids
                                                red=red))        # redis connection instance (thread safe)

    
    thread.start()
    
    sub = red.pubsub()
    sub.psubscribe(CHANNEL)

    #logging.info("Loaded... listening on channel: %s", CHANNEL)

    # TODO: figure out some way to kill it
    while(True):
       for item in sub.listen():

            # Skip subscription confirmation
            if(item['pattern'] == None):
                continue

            job = dict(
                    channel=item['channel'],
                    content=item['data'])

            q.put(job)

    logging.info("setting thread stop")
    stop.set()
    logging.info("thread.join")
    thread.join()

if __name__ == "__main__":
    main(sys.argv[1:])