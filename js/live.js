// js/live.js

// Global variables at the top
let sfuSocket = null;
let localStream = null;
let currentRoomId = null;
let device;
let producerTransport;
let videoProducer;

// Bypass auth check temporarily for easy testing, or keep it if API is setup
// checkAuth(true);

// --- MEDIASOUP UPLOAD (PRODUCER) LOGIC ---
// YEH FUNCTION UPAR HAI TAAKI TEMPORAL DEAD ZONE ERROR NA AAYE
async function connectToMediasoup() {
    console.log("TRACKER 1: connectToMediasoup function start ho gaya hai!");

    if (!sfuSocket) {
        console.error("TRACKER ERROR: sfuSocket null hai, emit nahi ho payega!");
        return;
    }

    console.log("TRACKER 2: Server se RTP Capabilities maang rahe hain...");

    // 1. Get Router Capabilities
    sfuSocket.emit("getRouterRtpCapabilities", async (rtpCapabilities) => {
        console.log("TRACKER 3: Server ne RTP Capabilities bhej di hain!", rtpCapabilities);

        try {
            // Safety Check: Verify if Mediasoup actually loaded
            if (typeof window.mediasoupClient === 'undefined') {
                console.error("TRACKER ERROR: mediasoupClient is not loaded. Ensure UMD version is in js/ folder.");
                alert("Live streaming library failed to load.");
                return; 
            }

            // Initialize Mediasoup Device
            device = new window.mediasoupClient.Device();
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            
            console.log("TRACKER 4: Mediasoup Device successfully load ho gaya!");

            // 2. Ask Server to create a Transport
            sfuSocket.emit("createProducerTransport", async (response) => {
                console.log("TRACKER 5: Server se transport response aaya:", response);
                
                if (response.error) {
                    console.error("Transport error:", response.error);
                    return;
                }

                // Create local Transport using server parameters
                producerTransport = device.createSendTransport(response.params);

                // 3. Handle 'connect' event
                producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
                    try {
                        console.log("TRACKER 6: Transport Connect trigger hua!");
                        sfuSocket.emit("transport-connect", { dtlsParameters });
                        callback();
                    } catch (error) {
                        errback(error);
                    }
                });

                // 4. Handle 'produce' event
                // js/live.js ke andhar transport-produce wala hissa yahan se replace karein:

// 4. Handle 'produce' event
producerTransport.on("produce", async (parameters, callback, errback) => {
    try {
        console.log("TRACKER 7: Transport Produce trigger hua!");
        
        // Yahan hume rtpParameters ke sath currentRoomId bhi bhejna zaroori hai!
        sfuSocket.emit("transport-produce", {
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            roomId: currentRoomId // <-- Yeh line add ki gayi hai
        }, ({ id }) => {
            callback({ id });
        });
    } catch (error) {
        errback(error);
    }
});

                // 5. FINALLY: Send the Video Track!
               // 5. FINALLY: Send BOTH Video and Audio Tracks!
                const videoTrack = localStream.getVideoTracks()[0];
                const audioTrack = localStream.getAudioTracks()[0];

                try {
                    if (videoTrack) {
                        await producerTransport.produce({ track: videoTrack });
                        console.log("SUCCESS! Video track sent to server!");
                    }
                    if (audioTrack) {
                        await producerTransport.produce({ track: audioTrack });
                        console.log("SUCCESS! Audio track sent to server!");
                    }
                    document.getElementById('status-text').innerText = "Streaming LIVE successfully!";
                } catch (err) {
                    console.error("Error producing media:", err);
                }
            });
        } catch (err) {
            console.error("TRACKER ERROR: Device load hone me fail hua:", err);
        }
    });
}

// --- BROADCAST CONTROLS ---
// js/live.js ke andhar startBroadcast function ko is tarah update karein:
async function startBroadcast() {
    const statusText = document.getElementById('status-text');
    const startBtn = document.getElementById('start-btn');
    
    startBtn.disabled = true;
    statusText.innerText = "Connecting to SFU Server...";

    // Generate Room ID
    currentRoomId = `room_test_${Date.now()}`;
    
    // UI par Room ID dikhane ke liye
    const roomIdDisplay = document.getElementById('display-room-id');
    if(roomIdDisplay) {
        roomIdDisplay.innerText = currentRoomId;
    }

    connectToSFU();
}

function connectToSFU() {
    sfuSocket = io("https://reburial-savage-unhinge.ngrok-free.dev");

    sfuSocket.on("connect", async () => {
        console.log("Connected to SFU Socket:", sfuSocket.id);
        sfuSocket.emit("join_live_room", currentRoomId);
        document.getElementById('status-text').innerText = "Connected! Accessing Camera...";
        
        await enableCamera();
    });

    sfuSocket.on("disconnect", () => {
        console.log("Disconnected from SFU server");
        stopBroadcast();
    });
}

async function enableCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: true
        });

        const videoElement = document.getElementById('local-video');
        videoElement.srcObject = localStream;

        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('stop-btn').style.display = 'inline-block';
        document.getElementById('live-indicator').style.display = 'block';
        document.getElementById('status-text').innerText = "You are LIVE now!";

        console.log("Camera is ON. Ready to produce media to Mediasoup!");

        // Start upload process
        connectToMediasoup(); 

    } catch (err) {
        console.error("Camera access denied:", err);
        document.getElementById('status-text').innerText = "Camera/Mic access denied.";
        stopBroadcast();
    }
}

function stopBroadcast() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (sfuSocket) {
        sfuSocket.disconnect();
        sfuSocket = null;
    }
    
    document.getElementById('local-video').srcObject = null;
    document.getElementById('start-btn').style.display = 'inline-block';
    document.getElementById('start-btn').disabled = false;
    document.getElementById('stop-btn').style.display = 'none';
    document.getElementById('live-indicator').style.display = 'none';
    document.getElementById('status-text').innerText = "Broadcast ended.";
}
