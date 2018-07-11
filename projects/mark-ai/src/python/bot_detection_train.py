import os
import numpy as np
import tensorflow as tf
import pandas as pd
import import_data as in_dat
import lstm_model as lstm
import matplotlib.pyplot as plt
import preprocess_twitter as twitter_pr

from tensorboard import summary as summary_lib

EPOCH = 1
BATCH_SIZE = 100
# Make sure that this matches the data
TWEET_LENGTH = 50

tf.logging.set_verbosity(tf.logging.INFO)

files = 'eval_data.tfrecord'

word2id, embedding_matrix = in_dat.load_embeddings()

def parser(example_proto):
    features = {"text": tf.FixedLenFeature((TWEET_LENGTH), tf.int64),
                "len": tf.FixedLenFeature((), tf.int64),
                "attributes": tf.FixedLenFeature((4), tf.int64),
                "label": tf.FixedLenFeature((), tf.int64, default_value=0)}
    
    parsed_features = tf.parse_single_example(example_proto, features)
    print(parsed_features['text'])
    print(parsed_features['len'])
    return parsed_features, parsed_features['label']

def tfrecord_input():
    dataset = tf.data.TFRecordDataset(files)
    dataset = dataset.map(parser)
    dataset = dataset.apply(tf.contrib.data.batch_and_drop_remainder(BATCH_SIZE))
    dataset = dataset.shuffle(BATCH_SIZE)
    iterator = dataset.make_one_shot_iterator()
    print(iterator.output_shapes)
    return iterator.get_next()

column = tf.feature_column.categorical_column_with_identity('x', len(embedding_matrix))

def my_initializer(shape=None, dtype=tf.float32, partition_info=None):
    assert dtype is tf.float32
    return embedding_matrix

params={'dimensions': 25,
        'embedding_ini': my_initializer,
        'vocab_size': len(embedding_matrix),
        'batch_size': BATCH_SIZE
        }
classifier = tf.estimator.Estimator(model_fn=lstm.model_fn,
                                model_dir='./model_training',
                                params=params
                                )

def serving_input_receiver_fn():
    features_placeholders = {
        'text': tf.placeholder(tf.int64, shape=[TWEET_LENGTH]),
        'len': tf.placeholder(tf.int32, shape=[]),
        'attributes': tf.placeholder(tf.int64, shape=[4])
    }
    features = {
        key: tf.expand_dims(tensor, 0)
        for key, tensor in features_placeholders.items()
    }
    return tf.estimator.export.ServingInputReceiver(features, features_placeholders)
    
print('train')

classifier.train(input_fn= tfrecord_input, steps=30000)
classifier.evaluate(input_fn=tfrecord_input) 

classifier.export_savedmodel('./lstm_export', serving_input_receiver_fn)