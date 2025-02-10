const {zkVerifySession, ZkVerifyEvents} = require("zkverifyjs");
const fs = require("fs");

require('dotenv').config();

async function executeVerificationTransaction(proofPath, publicSignalsPath) {
  const proof = require("../proof.json"); // Following the Risc Zero tutorial


  const session = await zkVerifySession.start().Testnet().withAccount(process.env.SEED_PHRASE);
  // Execute the verification transaction
  const {events, txResults} = await session.verify().risc0().waitForPublishedAttestation()
  .execute({proofData:{
      proof: proof.proof,
      vk: proof.image_id,
      publicSignals: proof.pub_inputs,
      version: "V1_2" // Mention the R0 version
  }})

  let attestationId, leafDigest;
    events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
        console.log('Transaction included in block:', eventData);
        attestationId = eventData.attestationId;
        leafDigest = eventData.leafDigest;
        // Handle the event data as needed
    });

    // Listen for the 'finalized' event
    events.on(ZkVerifyEvents.Finalized, (eventData) => {
        console.log('Transaction finalized:', eventData);
        // Handle the event data as needed
    });

    events.on(ZkVerifyEvents.AttestationConfirmed, async(eventData) => {
        console.log('Attestation Confirmed', eventData);
        const proofDetails = await session.poe(attestationId, leafDigest);
        proofDetails.attestationId = eventData.id;
        fs.writeFileSync("attestation.json", JSON.stringify(proofDetails, null, 2));
        console.log("proofDetails", proofDetails);
    })

}

// File paths
const proofPath = "../proof.bin";
const publicSignalsPath = "../journal.bin";

// Execute the transaction
executeVerificationTransaction(proofPath, publicSignalsPath);