class SentimentFeatures:
    def __init__(self, input):
        self.input = input
        self.response = client.detect_sentiment(
            Text=input,
            LanguageCode='en'
        )
        self.negative_words_count = 0
        self.negative_words_ratio = 0
        self.negative_score = 0
        self.positive_words_count = 0
        self.positive_words_ratio = 0
        self.positive_score = 0
        self.subjectivity_score = 0
        self.adjectives = 0
        self.verbs = 0
        self.adverbs = 0
        self.smiles = 0
        self.high_smiles = 0
        self.sad_faces = 0
        self.deep_sad_faces = 0
        self.hashtags_percent = 0
        self.urls_percent = 0
        self.users_mention = 0

if __name__=="__main__":
    import boto3

    client = boto3.client('comprehend')

    input = "This is a test tweet."

    test_tweet = SentimentFeatures(input)

    print(test_tweet.response)

"""
TO DO:
- Install Python Natural Language Toolkit
- Use SentiWordNet Interface to get Objectivity score and Parts of Speech for each words
- Calculate all the Sentiment Features
- Create a dataset of Tweets using these Sentiment Features

- Create a Naive Bayes Classifier
- Create a J48 decision tree (http://data-mining.business-intelligence.uoc.edu/home/j48-decision-tree)
        ^ Mining Twitter, Tutorial

Return a content rating
"""