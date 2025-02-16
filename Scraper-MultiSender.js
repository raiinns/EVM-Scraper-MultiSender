require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const readline = require("readline");

// 🔹 Konfigurasi Cypher Testnet
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

// 🔹 Fungsi untuk membaca input pengguna
async function getUserInput(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer);
    }));
}

// 🔹 Fungsi untuk scraping address
async function scrapeAddresses(blockNumber) {
    try {
        const block = await provider.getBlock(blockNumber);
        if (!block) {
            console.log(`Blok ${blockNumber} tidak ditemukan.`);
            return [];
        }

        console.log(`📦 Blok ${blockNumber} memiliki ${block.transactions.length} transaksi.`);

        if (block.transactions.length === 0) {
            console.log("Tidak ada transaksi dalam blok ini.");
            return [];
        }

        const addresses = new Set();

        // Ambil semua transaksi secara paralel untuk kecepatan maksimum
        const transactions = await Promise.all(
            block.transactions.map(txHash => provider.getTransaction(txHash))
        );

        // Kumpulkan semua alamat unik
        transactions.forEach(tx => {
            if (tx) {
                if (tx.from) addresses.add(tx.from);
                if (tx.to) addresses.add(tx.to);
            }
        });

        // Simpan ke file
        const addressList = [...addresses].join("\n");
        fs.writeFileSync("address.txt", addressList);

        console.log(`✅ ${addresses.size} alamat telah disimpan ke address.txt`);
        return [...addresses];

    } catch (error) {
        console.error("❌ Error saat scraping alamat:", error);
        return [];
    }
}

// 🔹 Fungsi untuk multi sender
async function sendTokens(addresses) {
    if (addresses.length === 0) {
        console.log("Tidak ada alamat untuk dikirim.");
        return;
    }

    console.log(`🚀 Mengirim token ke ${addresses.length} alamat...`);

    for (const address of addresses) {
        try {
            const tx = await tokenContract.transfer(address, amountToSend, {
                gasLimit: gasLimit
            });

            console.log(`✅ Token dikirim ke ${address} | TX: ${tx.hash}`);
            await tx.wait(); // Tunggu konfirmasi transaksi
        } catch (error) {
            console.error(`❌ Gagal mengirim ke ${address}:`, error);
        }
    }

    console.log("🎉 Transaksi selesai silahkan cek block explorer!");
}

// 🔹 Jalankan Program
async function main() {
    const blockNumber = await getUserInput("Masukkan nomor blok untuk discrape: ");
    const addresses = await scrapeAddresses(parseInt(blockNumber));

    if (addresses.length > 0) {
        console.log("⏳ Tunggu sebentar sebelum mengirim token...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendTokens(addresses);
    } else {
        console.log("Tidak ada alamat yang ditemukan, program berhenti.");
    }
}

main();
