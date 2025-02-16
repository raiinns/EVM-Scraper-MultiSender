require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

// 🔹 Konfigurasi Jaringan
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const tokenAddress = process.env.TOKEN_ADDRESS; // Alamat kontrak token ERC-20
const amountToSend = ethers.parseUnits(process.env.AMOUNT, 18); // Konversi jumlah ke satuan token
const gasLimit = 90000; // Sesuaikan dengan kontrak ERC-20

// 🔹 ABI Minimal ERC-20
const erc20Abi = [
    "function transfer(address to, uint256 value) public returns (bool)"
];

const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);

// 🔹 Fungsi untuk membaca address.txt
function getAddresses() {
    try {
        const data = fs.readFileSync("address.txt", "utf-8");
        return data.split("\n").map(addr => addr.trim()).filter(addr => addr);
    } catch (error) {
        console.error("❌ Gagal membaca file address.txt:", error);
        return [];
    }
}

// 🔹 Fungsi untuk mengirim token ke semua alamat
async function sendTokens() {
    const addresses = getAddresses();
    if (addresses.length === 0) {
        console.log("❌ Tidak ada alamat untuk dikirim.");
        return;
    }

    console.log(`🔹 Mengirim token ke ${addresses.length} alamat di Cypher Testnet...`);

    for (const address of addresses) {
        try {
            const tx = await tokenContract.transfer(address, amountToSend, {
                gasLimit: gasLimit
            });

            console.log(`✅ Token dikirim ke ${address} | TX: ${tx.hash}`);
            await tx.wait(); // Menunggu konfirmasi transaksi
        } catch (error) {
            console.error(`❌ Gagal mengirim ke ${address}:`, error);
        }
    }

    console.log("🎉 Semua transaksi selesai!");
}

// 🔹 Jalankan Multi Sender
sendTokens();