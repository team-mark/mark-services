import os
import nltk
import numpy as np
import tensorflow as tf
import pandas as pd
import preprocess_twitter as pt

from os import listdir
from os.path import isfile, join

UNKNOWN_INDEX = 0

def load_embeddings():
	word2id = {'<unk>': 0, '<hashtag>': 1, '<all caps>': 2, '<url>': 3, '<smile>': 4,
				'lolface': 5, '<sadface>': 6, '<neutralface>': 7, '<heart>': 8, '<number>': 9,
				'<repeat>': 10, '<elong>': 11}
	token_start = len(word2id)
	embedding_matrix = [np.random.uniform(-1, 1, size=25) for _ in range(token_start)] # add in special tokens
	count = 0
	
	with open('glove.twitter.27B.25d.txt','r', encoding="utf-8") as file:
		for index, line in enumerate(file):
			if(index != 38522): #line 38522 has incorrect encoding (or something similar)
				row = line.split()
				word = row[0]
				word_vector = np.asarray(row[1:], dtype=np.float32)
				embedding_matrix.append(word_vector)
				word2id[word] = index + token_start #token start reserves spaces for special tokens
			if(count > 100):
				break

	return word2id, np.array(embedding_matrix, dtype=np.float32)

def load_data(path, word2id, cases_per_file=None):
	tweet_ids = []

	files = listdir(path)

	files = [path + '/' + file for file in files]
	
	features = pd.DataFrame()

	for file in files:
		if(cases_per_file == None):
			file_df = pd.read_csv(file, header=0, usecols=['text', 'label'])
		else:
			file_df = pd.read_csv(file, header=0, usecols=['text', 'label'], nrows=cases_per_file)
		features = pd.concat([features, file_df])

	labels = features.pop('label')
	features['text'] = features['text'].astype(str)

	for _, row in features.iterrows():
		string = pt.tokenize(row.values[0])
		split = string.split()

		tweet = [word2id.get(word, UNKNOWN_INDEX) for word in split]
    
		tweet_ids.append(tweet)

	labels = np.asarray(labels, dtype=np.int16)

	return tweet_ids, labels
    
def load_dummy_data(number, length, embedding):
	embed_len = len(embedding)

	features = [np.random.uniform(0, embed_len, size=length) for _ in range(number)]

	labels = [1 for _ in range(len(features))]

	return features, labels #labels