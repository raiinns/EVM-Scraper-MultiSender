require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

async function scrapeAddresses(blockNumber) {
    try {
        const block = await provider.getBlock(blockNumber);
        if (!block) {
            console.log(`Blok ${blockNumber} tidak ditemukan.`);
            return;
        }

        console.log(`Jumlah tx dalam blok ${blockNumber}: ${block.transactions.length}`);

        if (block.transactions.length === 0) {
            console.log("Blok ini tidak memiliki transaksi.");
            return;
        }

        const addresses = new Set();

        console.log("Proses sedang berjalan...")

        // Ambil semua transaksi secara paralel
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

        // Simpan alamat ke file
        const addressList = [...addresses].join("\n");
        fs.writeFileSync("address.txt", addressList); // Ubah nama file hasil scrape

        console.log(`Address dalam blok ${blockNumber} disimpan ke address.txt`);

    } catch (error) {
        console.error("Error saat scraping alamat:", error);
    }
}

// Fungsi untuk membaca input pengguna
async function getUserInput(query) {
    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => readline.question(query, answer => {
        readline.close();
        resolve(answer);
    }));
}

// Jalankan program
async function main() {
    const blockNumber = await getUserInput("Masukkan nomor blok: ");
    await scrapeAddresses(parseInt(blockNumber));
}

main();
