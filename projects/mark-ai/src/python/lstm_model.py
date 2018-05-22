import tensorflow as tf

head = tf.contrib.estimator.binary_classification_head()

def model_fn(features, labels, mode, params):

	input_layer = tf.contrib.layers.embed_sequence(
		features['x'], params['vocab_size'], params['dimensions'], initializer=params['embedding_ini'],
		trainable=False
    )

	cell = tf.contrib.rnn.LSTMBlockCell(32)
    
	initial_state = cell.zero_state(params['batch_size'], dtype=tf.float32)
    
	_, final_state = tf.nn.dynamic_rnn(cell, input_layer,
                                initial_state=initial_state,
								sequence_length=features['len'],
                                dtype=tf.float32)
	outputs = final_state.h

	dense_out = tf.layers.dense(outputs, activation=tf.nn.relu, units = 128)
	dense2_out = tf.layers.dense(dense_out, activation=tf.nn.relu, units = 64)
	logits = tf.layers.dense(dense2_out, activation=tf.nn.relu, units = 1)

	if labels is not None:
		labels = tf.reshape(labels, [-1, 1])

	optimizer = tf.train.AdamOptimizer()

	def _train_op_fn(loss):
		tf.summary.scalar('loss', loss)
		return optimizer.minimize(
			loss=loss,
			global_step=tf.train.get_global_step())

	return head.create_estimator_spec(
		features=features,
		labels=labels,
		mode=mode,
		logits=logits,
		train_op_fn=_train_op_fn
	)