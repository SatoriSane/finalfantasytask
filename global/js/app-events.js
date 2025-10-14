// app-events.js
// A simple pub/sub event bus for the application.
(function(App) {
    const topics = {};

    App.events = {
        /**
         * @description Subscribe to an event topic.
         * @param {string} topic The name of the event to subscribe to.
         * @param {function} listener The callback function to execute.
         */
        on: function(topic, listener) {
            if (!topics[topic]) {
                topics[topic] = [];
            }
            topics[topic].push(listener);
        },

        /**
         * @description Publish an event to a topic.
         * @param {string} topic The name of the event to publish.
         * @param {*} [data] Optional data to pass to the listeners.
         */
        emit: function(topic, data) {
            if (!topics[topic]) {
                return;
            }
            topics[topic].forEach(listener => {
                try {
                    listener(data);
                } catch (e) {
                    console.error(`Error in event listener for topic '${topic}':`, e);
                }
            });
        }
    };

})(window.App = window.App || {});
