import os
import numpy as np
import tensorflow as tf
import pandas as pd
import import_data as in_dat
import lstm_model as lstm
import matplotlib.pyplot as plt

from tensorflow.python.keras.preprocessing import sequence
from tensorboard import summary as summary_lib

EPOCH = 1
TWEET_LENGTH = 50
BATCH_SIZE = 100
CASES_PER_FILE = 200000

#There are 5 files
#Ill make this dynamic later
STEPS = ((CASES_PER_FILE * 5) / BATCH_SIZE) * EPOCH

tf.logging.set_verbosity(tf.logging.INFO)

word2id, embedding_matrix = in_dat.load_embeddings()

x_train_variable, y_train = in_dat.load_data('./data/train/ready', word2id, CASES_PER_FILE)

print(len(x_train_variable), 'train sequences')
print(len(y_train), "train labels")

x_eval_variable, y_eval = in_dat.load_data('./data/eval/ready', word2id, CASES_PER_FILE)

print(len(x_eval_variable), 'eval sequences')
print(len(y_eval), "eval labels")

cases = len(x_train_variable)

STEPS = int(cases / BATCH_SIZE) * EPOCH

print("Running with", STEPS, "Steps and", BATCH_SIZE, "sized batches and", int(cases / BATCH_SIZE) * BATCH_SIZE, "cases")

print("Pad sequences (samples x time)")
x_train = sequence.pad_sequences(x_train_variable,
    maxlen=TWEET_LENGTH,
    truncating='post',
    padding='post',
    value=in_dat.UNKNOWN_INDEX)
x_eval = sequence.pad_sequences(x_eval_variable,
    maxlen=TWEET_LENGTH,
    truncating='post',
    padding='post',
    value=in_dat.UNKNOWN_INDEX)

print("x_train_shape:", x_train.shape)
print("x_eval_shape:", x_eval.shape)

x_len_train = np.array([min(len(x), TWEET_LENGTH) for x in x_train_variable])
x_len_eval = np.array([min(len(x), TWEET_LENGTH) for x in x_eval_variable])

def parser(x, length, y):
    features = {'x':x, 'len':length}
    return features, y

def train_input_fn():
    dataset = tf.data.Dataset.from_tensor_slices((x_train, x_len_train, y_train))
    dataset = dataset.shuffle(buffer_size=len(x_train_variable))
    #dataset = dataset.batch(BATCH_SIZE)
    dataset = dataset.apply(tf.contrib.data.batch_and_drop_remainder(BATCH_SIZE))
    dataset = dataset.map(parser)
    dataset = dataset.repeat()
    iterator = dataset.make_one_shot_iterator()
    print(iterator.output_shapes)
    return iterator.get_next()

def eval_input_fn():
    dataset = tf.data.Dataset.from_tensor_slices((x_eval, x_len_eval, y_eval))
    #dataset = dataset.batch(BATCH_SIZE)
    dataset = dataset.apply(tf.contrib.data.batch_and_drop_remainder(BATCH_SIZE))
    dataset = dataset.map(parser)
    iterator = dataset.make_one_shot_iterator()
    return iterator.get_next()

column = tf.feature_column.categorical_column_with_identity('x', len(embedding_matrix))

print('embedding matrix len:', len(embedding_matrix))

def my_initializer(shape=None, dtype=tf.float32, partition_info=None):
    assert dtype is tf.float32
    return embedding_matrix

params={'dimensions': 25,
		'embedding_ini': my_initializer,
		'vocab_size': len(embedding_matrix),
		'batch_size': BATCH_SIZE
		}

classifier = tf.estimator.Estimator(model_fn=lstm.model_fn,
                                    model_dir='./lstm_model_smaller_set',
                                    params=params
                                    )

all_classifiers = {}
def train_and_evaluate(classifier):
    all_classifiers[classifier.model_dir] = classifier
    classifier.train(input_fn=train_input_fn, steps=STEPS)
    eval_results = classifier.evaluate(input_fn=eval_input_fn)
    predictions = np.array([p['logistic'][0] for p in classifier.predict(input_fn=eval_input_fn)])

    tf.reset_default_graph()
    trunc_val = int(len(y_eval) / BATCH_SIZE) * BATCH_SIZE
    y_eval2 = y_eval[:trunc_val]
    pr = summary_lib.pr_curve('precision_recall', predictions=predictions, labels=y_eval2.astype(bool), num_thresholds=21)
    with tf.Session() as sess:
        writer = tf.summary.FileWriter(os.path.join(classifier.model_dir, 'eval'), sess.graph)
        writer.add_summary(sess.run(pr), global_step=0)
        writer.close()

train_and_evaluate(classifier)