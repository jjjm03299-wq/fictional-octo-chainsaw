const {onRequest} = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// Mock VPN State & 10 Countries with Flags & Servers
let vpnData = {
  connectionStatus: "DISCONNECTED",
  activeConnection: null,
  countries: [
    { id: "us", name: "United States", flag: "🇺🇸", servers: ["us-east-01", "us-west-02"] },
    { id: "uk", name: "United Kingdom", flag: "🇬🇧", servers: ["uk-lon-01", "uk-man-02"] },
    { id: "ca", name: "Canada", flag: "🇨🇦", servers: ["ca-tor-01", "ca-van-02"] },
    { id: "de", name: "Germany", flag: "🇩🇪", servers: ["de-fra-01", "de-ber-02"] },
    { id: "jp", name: "Japan", flag: "🇯🇵", servers: ["jp-tyo-01", "jp-osa-02"] },
    { id: "au", name: "Australia", flag: "🇦🇺", servers: ["au-syd-01", "au-mel-02"] },
    { id: "fr", name: "France", flag: "🇫🇷", servers: ["fr-par-01"] },
    { id: "br", name: "Brazil", flag: "🇧🇷", servers: ["br-sao-01"] },
    { id: "in", name: "India", flag: "🇮🇳", servers: ["in-mum-01", "in-blr-02"] },
    { id: "sg", name: "Singapore", flag: "🇸🇬", servers: ["sg-sin-01"] }
  ]
};

// Helper: Generate a random IP address
function generateMockIP() {
  return `${Math.floor(Math.random() * 190) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Router for all /api/vpn endpoints
const router = express.Router();

// 1. Get 10 Countries & Flags List
router.get("/countries", (req, res) => {
  const countryList = vpnData.countries.map(c => ({
    id: c.id,
    name: c.name,
    flag: c.flag
  }));
  res.status(200).json({ success: true, data: countryList });
});

// 2. Get Servers List for a Specific Country (e.g., /api/vpn/servers?country=us)
router.get("/servers", (req, res) => {
  const countryId = req.query.country;
  if (!countryId) {
    return res.status(400).json({ success: false, error: "Country query parameter is required" });
  }
  const country = vpnData.countries.find(c => c.id === countryId.toLowerCase());
  if (!country) {
    return res.status(404).json({ success: false, error: "Country not found" });
  }
  res.status(200).json({ 
    success: true, 
    country: country.name, 
    flag: country.flag, 
    servers: country.servers 
  });
});

// 3. Get VPN Status & Active Connection Info
router.get("/status", (req, res) => {
  res.status(200).json({
    success: true,
    status: vpnData.connectionStatus,
    activeConnection: vpnData.activeConnection
  });
});

// 4. Connect VPN (Generates dynamic IP and assigns country/server)
router.post("/connect", (req, res) => {
  const { countryId, serverId } = req.body;
  
  if (!countryId) {
    return res.status(400).json({ success: false, error: "countryId is required in request body" });
  }

  const country = vpnData.countries.find(c => c.id === countryId.toLowerCase());
  if (!country) {
    return res.status(404).json({ success: false, error: "Invalid country ID" });
  }

  const targetServer = serverId || country.servers[0];
  const generatedIp = generateMockIP();

  vpnData.connectionStatus = "CONNECTED";
  vpnData.activeConnection = {
    country: country.name,
    flag: country.flag,
    server: targetServer,
    ip: generatedIp,
    connectedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    message: `Successfully connected to ${country.name}`,
    data: vpnData.activeConnection
  });
});

// 5. Disconnect VPN
postPath = router.post("/disconnect", (req, res) => {
  vpnData.connectionStatus = "DISCONNECTED";
  vpnData.activeConnection = null;

  res.status(200).json({
    success: true,
    message: "VPN disconnected successfully",
    status: vpnData.connectionStatus
  });
});

// Mount router on /api/vpn
app.use("/api/vpn", router);

// Export API to Firebase Cloud Functions
exports.api = onRequest(app);
