const QRCode = require('qrcode');

const generateTicket = async (data) => {
    try {
        const qrDataUrl = await QRCode.toDataURL(data, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });
        return qrDataUrl;
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw error;
    }
};

module.exports = { generateTicket };
