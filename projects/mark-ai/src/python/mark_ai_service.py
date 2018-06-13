import queue
import import_data as i_data
import tensorflow as tf
import preprocess_twitter as pt
import redis
import json
import numpy as np
from tensorflow.python.keras.preprocessing import sequence
from threading import Event, Thread
from tensorflow.contrib import predictor

CONFIG = {
    'host': 'localhost',
    'port': 6379,
    'db': 0
}
CHANNEL = 'bots-req-*'
CHANNEL_REPLY = 'bots-reply-'

def run_model(q, stop, predict_fn, word2id, red):
   
    while(not stop.is_set()):
        try:
            message = q.get_nowait()
            content = message['content']
            channel = message['channel'].decode("utf-8")
            split = pt.tokenize(content)
            split = split.split()
            # extra dimension is for feeding through sequence.pad_sequence
            ids = [[word2id.get(x, i_data.UNKNOWN_INDEX) for x in split]]
            length = len(ids)
            ids = sequence.pad_sequences(ids, 
                                        maxlen=50,
                                        truncating='post',
                                        padding='post',
                                        value=i_data.UNKNOWN_INDEX)
            # remove extra dimension
            ids = ids[0]

            # model expects dict below
            inputs = {'x': ids, 'len':length}

            predictions = predict_fn(inputs)

            # Predictions: First array holds percentages of confidence of class
            # class at index 0 is a human
            # class at index 1 is a bot

            resp = {}
            resp['class'] = predictions['pred_output_classes'][0].item()    # .item() converts to native python type
            resp['percent0'] = predictions['probabilities'][0][0].item()
            resp['percent1'] = predictions['probabilities'][0][1].item()

            channel = channel.split("-")
            channel = CHANNEL_REPLY + channel[1]

            red.publish(channel, json.dumps(resp))
        # when there is nothing in the queue continue to loop
        except queue.Empty:
            continue

if __name__ == "__main__":
    red = redis.StrictRedis(**CONFIG)
    stop = Event()
    q = queue.Queue()
    word2id, _ = i_data.load_embeddings("../../embeddings/glove.twitter.27B.25d.txt")
    predict_fn = predictor.from_saved_model('../../models/bot_detection')
    thread = Thread(target=run_model, kwargs=dict(
                                                stop=stop,  # Thread Stop signal  
                                                q=q,        # Queue of Marks to run through predict_fn
                                                predict_fn=predict_fn, 
                                                word2id=word2id, # dictionary for common words to word ids 
                                                red=red))        # redis connection instance (thread safe)
    
    thread.start()
    
    sub = red.pubsub()
    sub.psubscribe(CHANNEL)

    print("Loaded... listening on channel", CHANNEL)

    # TODO: figure out some way to kill it
    while(True):
       for item in sub.listen():

            # Skip subscription confirmation
            if(item['pattern'] == None):
                continue

            content = json.loads(item['data'])['content']
            job = dict(
                    channel=item['channel'],
                    content=content)
            q.put(job)

    print("setting thread stop")
    stop.set()
    print("thread.join")
    thread.join()

