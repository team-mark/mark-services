import tensorflow as tf

def model_fn(features, labels, mode, params):

	input_layer = tf.contrib.layers.embed_sequence(
		features['x'], params['vocab_size'], params['dimensions'], initializer=params['embedding_ini'],
		trainable=True
    )
	batch_size = tf.shape(features['x'])[0]

	cell = tf.contrib.rnn.LSTMBlockCell(32)
    
	initial_state = cell.zero_state(batch_size, dtype=tf.float32)
    
	_, final_state = tf.nn.dynamic_rnn(cell, input_layer,
                                initial_state=initial_state,
								sequence_length=features['len'],
                                dtype=tf.float32)
	outputs = final_state.h

	dense_out = tf.layers.dense(outputs, activation=tf.nn.relu, units = 128)
	dense2_out = tf.layers.dense(dense_out, activation=tf.nn.relu, units = 64)
	logits = tf.layers.dense(dense2_out, activation=None, units = 2)

	predicted_classes = tf.argmax(logits, 1)
	if(mode == tf.estimator.ModeKeys.PREDICT):
		predictions = {
			'class_ids': predicted_classes[:, tf.newaxis],
			'probabilities': tf.nn.softmax(logits),
			'logits': logits,
		}
		export_outputs = {'predict_output': tf.estimator.export.PredictOutput({
			'pred_output_classes': predicted_classes,
			'probabilities':predictions['probabilities']})}
		return tf.estimator.EstimatorSpec(mode, predictions=predictions, export_outputs=export_outputs)

	loss = tf.losses.sparse_softmax_cross_entropy(labels=labels, logits=logits)

	accuracy = tf.metrics.accuracy(labels=labels,
								predictions=predicted_classes,
								name='acc_op')
	metrics = {'accuracy': accuracy}
	tf.summary.scalar('accuracy', accuracy[1])

	if(mode == tf.estimator.ModeKeys.EVAL):
		return tf.estimator.EstimatorSpec(mode, loss=loss, eval_metric_ops=metrics)
	
	assert mode == tf.estimator.ModeKeys.TRAIN

	optimizer = tf.train.AdagradOptimizer(learning_rate=0.1)
	train_op = optimizer.minimize(loss, global_step=tf.train.get_global_step())
	return tf.estimator.EstimatorSpec(mode, loss=loss, train_op=train_op)