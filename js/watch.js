// js/watch.js

let socket;
let device;
let consumerTransport;

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');

async function startWatching() {
    if (!roomId) {
        console.error("Room ID missing in URL!");
        document.getElementById('watch-status').innerText = "Error: No Room ID provided in URL.";
        return;
    }

    socket = io("https://reburial-savage-unhinge.ngrok-free.dev");

    socket.on("connect", async () => {
        console.log("TRACKER 1: Connected to SFU as viewer:", socket.id);
        document.getElementById('watch-status').innerText = "Joined room. Fetching capabilities...";

        socket.emit("join_live_room", roomId);
        console.log("TRACKER 2: Requested to join room:", roomId);

        // 1. Get Router Capabilities
        socket.emit("getRouterRtpCapabilities", async (rtpCapabilities) => {
            console.log("TRACKER 3: Received RTP Capabilities from Server!");

            try {
                // Safety check: Is Mediasoup Library loaded?
                if (typeof window.mediasoupClient === 'undefined') {
                    console.error("TRACKER ERROR: mediasoupClient is undefined! Library failed to load.");
                    document.getElementById('watch-status').innerText = "Library load failed.";
                    return;
                }

                device = new window.mediasoupClient.Device();
                console.log("TRACKER 4: Mediasoup device instantiated.");

                await device.load({ routerRtpCapabilities: rtpCapabilities });
                console.log("TRACKER 5: Mediasoup device loaded successfully.");

                socket.emit("createConsumerTransport", async (response) => {
                    console.log("TRACKER 6: Consumer transport response received:", response);
                    
                    if (response.error) {
                        console.error("Transport error:", response.error);
                        return;
                    }

                    const transport = device.createRecvTransport(response.params);
                    console.log("TRACKER 7: RecvTransport created locally.");

                    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
                        console.log("TRACKER 8: Transport connect event triggered.");
                        try {
                            socket.emit("consumer-transport-connect", { dtlsParameters });
                            callback();
                        } catch (error) {
                            errback(error);
                        }
                    });

                    socket.emit("getProducers", roomId, async (producerIds) => {
                        console.log("TRACKER 9: Received producer IDs:", producerIds);

                        if (!producerIds || producerIds.length === 0) {
                            document.getElementById('watch-status').innerText = "Stream has not started yet or has ended.";
                            return;
                        }

                        const videoElement = document.getElementById('remote-video');
                        if (!videoElement.srcObject) {
                            videoElement.srcObject = new MediaStream();
                        }

                        for (const producerId of producerIds) {
                            console.log(`TRACKER 10: Consuming producer ID: ${producerId}`);
                            
                            socket.emit("consume", { 
                                rtpCapabilities: device.rtpCapabilities, 
                                roomId: roomId, 
                                producerId: producerId 
                            }, async (consumeResponse) => {
                                if (consumeResponse.error) {
                                    console.error("Consume error:", consumeResponse.error);
                                    return;
                                }

                                console.log(`TRACKER 11: Consume params received for ${consumeResponse.params.kind}`);

                                try {
                                    const consumer = await transport.consume({
                                        id: consumeResponse.params.id,
                                        producerId: consumeResponse.params.producerId,
                                        kind: consumeResponse.params.kind,
                                        rtpParameters: consumeResponse.params.rtpParameters,
                                    });

                                    videoElement.srcObject.addTrack(consumer.track);
                                    socket.emit("consumer-resume", { consumerId: consumer.id });

                                    console.log(`TRACKER 12: SUCCESS! Playing ${consumer.kind} track.`);
                                } catch (err) {
                                    console.error("TRACKER ERROR during transport.consume():", err);
                                }
                            });
                        }
                        document.getElementById('watch-status').innerText = "Streaming LIVE!";
                    });
                });
            } catch (err) {
                console.error("TRACKER FATAL ERROR:", err);
                document.getElementById('watch-status').innerText = "Failed to load live stream.";
            }
        });
    });
}

function enableAudio() {
    const videoElement = document.getElementById('remote-video');
    videoElement.muted = false;
    videoElement.play().then(() => {
        console.log("Audio successfully enabled.");
        const btn = document.getElementById('unmute-btn');
        if (btn) btn.style.display = 'none';
    }).catch(err => {
        console.error("Error playing audio:", err);
    });
}

startWatching();
