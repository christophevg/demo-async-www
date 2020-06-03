# Demo Async WWW

Small demo app to illustrate the difference between performing logic in a synchronous or asynchronous way, from the perspective of the browser issuing the call.

The browser app can POST a message to the REST API via two endpoints. One handles the message in a synchronous way, the second queues it and handles it asynchronously. Evidently, the former will block the UX for a while (in this case the handling introduced a delay of 2 seconds), while the latter will return immediatly after delivering the message.

In the asynchronous setup, the response is streamed back to the browser via a websocket. Of course this can be implemented using any other technology, as simple as polling another REST endpoint, depending on the needs.

Each step in both setups logs the time, adds it to the message and passes it on to the next step, until it returns to the browser:

![screenshot](media/demo.png?raw=true "demo")
