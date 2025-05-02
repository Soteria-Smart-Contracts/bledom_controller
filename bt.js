let device = null;
let characteristic = null;
let commandInProgress = false;

function onDisconnected(event) {
    console.log('Device disconnected');
    device = null;
    characteristic = null;
    document.getElementById('connectBtn').style.display = 'block';
    document.getElementById('controls').style.display = 'none';
}

async function connect() {
    try {
        device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb']
        });

        device.addEventListener('gattserverdisconnected', onDisconnected);
        
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
        characteristic = await service.getCharacteristic('0000fff3-0000-1000-8000-00805f9b34fb');
        
        document.getElementById('connectBtn').style.display = 'none';
        document.getElementById('controls').style.display = 'block';
        
        // Initialize with white color at full brightness
        setBrightness(100);
        setColor(255, 255, 255);
        
    } catch(error) {
        console.error('Connection failed:', error);
        alert('Connection error: ' + error.message);
    }
}

function sendCommand(command) {
    if (!commandInProgress && characteristic) {
        commandInProgress = true;
        return characteristic.writeValue(command)
            .then(() => {
                commandInProgress = false;
            })
            .catch(err => {
                commandInProgress = false;
                console.error('Command failed:', err);
            });
    }
    return Promise.resolve();
}

function setColor(r, g, b) {
    if (!characteristic) return;
    const command = new Uint8Array([0x7e, 0x00, 0x05, 0x03, r, g, b, 0x00, 0xef]);
    return sendCommand(command);
}

function setBrightness(value) {
    if (!characteristic) return;
    const command = new Uint8Array([0x7e, 0x00, 0x01, value, 0x00, 0x00, 0x00, 0x00, 0xef]);
    return sendCommand(command);
}

function togglePower() {
    const powerBtn = document.getElementById('powerBtn');
    const isOn = powerBtn.classList.contains('on');
    
    if (isOn) {
        // Turn off
        const command = new Uint8Array([0x7e, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0xef]);
        sendCommand(command).then(() => {
            powerBtn.textContent = 'Power On';
            powerBtn.classList.remove('on');
        });
    } else {
        // Turn on (with last color)
        const command = new Uint8Array([0x7e, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0xef]);
        sendCommand(command).then(() => {
            powerBtn.textContent = 'Power Off';
            powerBtn.classList.add('on');
        });
    }
}

// Helper functions
function limitHex(value) {
    return Math.min(255, Math.max(0, parseInt(value)));
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}