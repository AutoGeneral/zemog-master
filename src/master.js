const AWS = require('aws-sdk');
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});

/**
 * Sends a message to SQS queue
 * @param {Object} event
 * @param {Object} context
 */
function addTasksToTheQueue (event, context) {
	SQS.getQueueUrl({QueueName: event.QUEUE_NAME}).promise()
		.then(data => {
			return data.QueueUrl;
		})
		.then(queueUrl => {
			return Promise.all(event.TESTS.map(task => addTaskToQueue(queueUrl, task)));
		})
		.then(data => {
			const message = `Tasks has been added: ${data.length}`;
			console.info(message); // eslint-disable-line no-console
			context.done(null, message);
		})
		.catch(err => {
			console.error('Fail Send Message' + err); // eslint-disable-line no-console
		});
}

/**
 * @param {String} queueUrl
 * @param {Object} task
 * @returns {Promise<Object>}
 */
function addTaskToQueue (queueUrl, task) {
	return SQS.sendMessage({
		MessageBody: JSON.stringify(task),
		QueueUrl: queueUrl
	}).promise();
}

module.exports.master = (event, context) => {
	if (!event.TESTS) {
		throw new Error('TESTS env variable must be specified');
	}
	addTasksToTheQueue(event, context);
};
