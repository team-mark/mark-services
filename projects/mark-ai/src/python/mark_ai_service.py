import queue
import import_data as i_data
import tensorflow as tf
import preprocess_twitter as pt
from tensorflow.python.keras.preprocessing import sequence
from threading import Event, Thread
from tensorflow.contrib import predictor

def run_model(q, stop, predict_fn, word2id):
   
    while(not stop.is_set()):
        try:
            message = q.get_nowait()
            split = pt.tokenize(message)
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
            inputs = {'x': ids, 'len':length}
            predictions = predict_fn(inputs)

            # Predictions: First array holds percentages of confidence of class
            # class at index 0 is a human
            # class at index 1 is a bot
            print(predictions)
        except queue.Empty:
            continue

if __name__ == "__main__":
    stop = Event()
    q = queue.Queue()
    word2id, _ = i_data.load_embeddings("../../embeddings/glove.twitter.27B.25d.txt")
    predict_fn = predictor.from_saved_model('../../models/bot_detection')
    thread = Thread(target=run_model, kwargs=dict(stop=stop, q=q, predict_fn=predict_fn, word2id=word2id))
    thread.start()
    print("Loaded... Enter message to evaluate, type quit to stop.")
    while(True):
        inp = input()
        if(inp == "quit"):
            break
        q.put(inp)
    print("setting stop")
    stop.set()
    print("thread.join")
    thread.join()

