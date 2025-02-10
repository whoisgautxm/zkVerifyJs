const { zkVerifySession, ZkVerifyEvents } = require('zkverifyjs');
const fs = require('fs');
require('dotenv').config();

async function executeVerificationTransaction(proofPath, publicSignalsPath) {
  // Read the binary files
  const proofData = fs.readFileSync(proofPath);
  const publicSignalsData = fs.readFileSync(publicSignalsPath);

  // Convert binary data to hex strings with 0x prefix
  const proofHex = '0x' + Buffer.from(proofData).toString('hex');
  const publicSignalsHex = '0x' + Buffer.from(publicSignalsData).toString('hex');

  // Start a new zkVerifySession on testnet
  const session = await zkVerifySession.start()
    .Custom("wss://testnet-rpc.zkverify.io")
    .withAccount(process.env.SEED_PHRASE);

  // Execute the verification transaction
  const { events, transactionResult } = await session.verify().risc0()
    .waitForPublishedAttestation()
    .execute({
      proofData: {
        vk: "0x63b4b9a7e2a5d81202e760d3c6a1c3fa32728a69070d35907490987e3988cd5d",
        proof: proofHex,
        publicSignals: publicSignalsHex,
        version: "V1_0"
      }
    });

  // Listen for the 'includedInBlock' event
  events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
    console.log('Transaction included in block:', eventData);
    // Handle the event data as needed
  });

  // Listen for the 'finalized' event
  events.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Transaction finalized:', eventData);
    // Handle the event data as needed
  });

  // Handle errors during the transaction process
  events.on('error', (error) => {
    console.error('An error occurred during the transaction:', error);
  });

  try {
    // Await the final transaction result
    const transactionInfo = await transactionResult;

    // Log the final transaction result
    console.log('Transaction completed successfully:', transactionInfo);
  } catch (error) {
    // Handle any errors that occurred during the transaction
    console.error('Transaction failed:', error);
  } finally {
    // Close the session when done
    await session.close();
  }
}

// File paths
const proofPath = "/home/gautam/Desktop/zk_dtp/inner.bin";
const publicSignalsPath = "/home/gautam/Desktop/zk_dtp/journal.bin";

// Execute the transaction
executeVerificationTransaction(proofPath, publicSignalsPath);