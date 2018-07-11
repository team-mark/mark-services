# File takes csv data and 
import pandas as pd
import tensorflow as tf
import numpy as np
import preprocess_twitter as twitter_pr
import import_data
import array
import sys
import getopt
import itertools
import numpy as np
from tensorflow.python.keras.preprocessing import sequence

TWEET_LENGTH = 50
FILES = ['genuine_accounts.csv/tweets.csv',
    'social_spambots_1.csv/tweets.csv',
    'social_spambots_2.csv/tweets.csv',
    'social_spambots_3.csv/tweets.csv',
    'traditional_spambots_1.csv/tweets.csv']
LABELS = [0, 1, 1, 1, 1]

# Fill in features you want to extract along with the type of data
features = ['text', 'favorite_count', 'num_hashtags', 'num_urls', 'reply_count']
types =    [np.str, np.int64, np.int64, np.int64, np.int64]

def _bytes_feature(value):
    return tf.train.Feature(bytes_list=tf.train.BytesList(value=[str.encode(value)]))

def _int64_feature(value):
    return tf.train.Feature(int64_list=tf.train.Int64List(value=[value]))

def _float_feature(value):
    return tf.train.Feature(float_list=tf.train.FloatList(value=[value]))

features_functions = {
    np.int64: _int64_feature,
    int: _int64_feature,
    float: _float_feature,
    str: _bytes_feature
}

types_dict = dict(zip(features, types))

word2id, embedding_matrix = import_data.load_embeddings()

# processes tweets replacing url, hashtags, etc with tags and
# retrieves the word ids for GloVe embeddings
def tweet_preprocess(tweet):
    text = twitter_pr.tokenize(tweet)
    split = text.split()
    tweet = [word2id.get(word, import_data.UNKNOWN_INDEX) for word in split]
    
    tweet_len = len(tweet)

    # sequence.pad_sequences expects ndarray
    tweet = sequence.pad_sequences([tweet],
        maxlen=TWEET_LENGTH,
        truncating='post',
        padding='post',
        value=import_data.PAD_INDEX)
		
    # need to remove extra dimension we put    
    return tweet[0], tweet_len

def main(argv):
    files = FILES
    dfs = []
    
    print("FILES:", files)

	# read files, extract columns
    for f in files:
        df = pd.read_csv(f, header=0, usecols=features, low_memory=False, na_filter=True, error_bad_lines=False).dropna()
        
        for col, _type in zip(features, types):
            df[col] = df[col].astype(_type)

        dfs.append(df)
        print("Read:", f)

    with tf.python_io.TFRecordWriter("eval_data.tfrecord") as writer:
        itr_list = []
        quit = False
		
		# add data to TFRecord using a round robin queue
        for index, df in enumerate(dfs):
            itr_list.append((df.iterrows(), index, len(df)))
        
        cycle = itertools.cycle(itr_list)

        while(not quit):
            tf_features = {}
            tf_attributes = []
			
            try:
                itr, index, df_size = next(cycle)
                _, row = next(itr)
            except StopIteration as err:
                itr_list.remove((itr, index, df_size))

                print(files[index], "conversion finished")

                if(len(itr_list) != 0):
                    cycle = itertools.cycle(itr_list)
                    continue
                else:
                   break
            
            for feature in features:
                if(feature == 'text'):
                    tweet, tweet_len = tweet_preprocess(row[feature])
                    tf_features['text'] = tf.train.Feature(int64_list=tf.train.Int64List(value=tweet))
                    tf_features['len'] = features_functions[type(tweet_len)](tweet_len)
                else:
                    tf_attributes.append(row[feature])

            tf_features['attributes'] = tf.train.Feature(int64_list=tf.train.Int64List(value=tf_attributes))
            tf_features['label'] = _int64_feature(int(LABELS[index]))

            example = tf.train.Example(features=tf.train.Features(feature=tf_features))

            writer.write(example.SerializeToString())

if __name__ == "__main__":
    main(sys.argv[1:])

