const { ethers } = require("ethers");
const { BigNumber } = require("bignumber.js");

const russianRoulette = {
    setup: {
        maxValidRange: 6
    },
    update: {
        maxValidRange: 8
    },
    newRussianRoulette: {
        prize: ethers.utils.parseUnits("1000", 18),
        cost: ethers.utils.parseUnits("10", 18),
        closeIncrease: 10000,
        endIncrease: 20000,
        win: {
            blankWinningNumber: "0",
            afterWinningNumber: "2",
            winningNumber: ["2"],
            loosingNumber: ["3"],
            winPrize: ethers.utils.parseUnits("1000", 18),
        }
    },
    chainLink: {
        keyHash: "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
        fee: ethers.utils.parseUnits("1", 19)
    },
    events: {
        new: "RussianRouletteOpen",
        mint: "NewBatchMint",
        request: "requestNumber"
    },
    buy: {
        cybar: ethers.utils.parseUnits("10000000", 18),
        one: {
            cost: "10000000000000000000"
        },
        ten: {
            cost: "100000000000000000000"
        },
        fifty: {
            cost: "500000000000000000000"
        },
    },
    draw: {
        random: ethers.utils.parseUnits("71812290232383789158325313353218754072886144180308695307717334628590412940628", 0)
    },
    errorData: {
        prize: ethers.utils.parseUnits("0", 18),
        cost: ethers.utils.parseUnits("0", 18),
        startTime: ethers.utils.parseUnits("0", 18),
        ticketNumber: [7],
    },
    errors: {
        invalid_rng: "Only random generator", // DONE
        invalid_sender_is_contract: "contract not allowed", //DONE
        invalid_sender_is_proxy: "proxy contract not allowed",  //DONE 
        invalid_contract_address_zero: "Contracts cannot be 0 address",  //DONE
        invalid_max_range: "Max range cannot be 0", //DONE
        invalid_draw_order: "Draw number first", //DONE
        invalid_mint_start: "Invalid time for mint:start", //DONE
        invalid_mint_end: "Invalid time for mint:end", //DONE
        invalid_mint_state: "Russian Roulette not in state for mint", //DONE
        invalid_batch_size: "Batch mint too large", //DONE
        invalid_admin: "Ownable: caller is not the owner",
        invalid_price_or_cost: "Prize or cost cannot be 0", // DONE
        invalid_timestamp: "Timestamps for russian roulette invalid", //DONE
        invalid_mint_timestamp: "Invalid time for mint",
        invalid_mint_numbers: "Only one number per ticket",
        invalid_mint_approve: "ERC20: transfer amount exceeds allowance",
        invalid_draw_time: "Cannot set winning number during russian roulette", //DONE
        invalid_draw_repeat: "Russian Roulette State incorrect for draw", //DONE
        invalid_claim_time: "Wait till end to claim", //DONE
        invalid_claim_draw: "Winning Number not chosen yet", //DONE
        invalid_claim_owner: "Only the owner can claim", //DONE
        invalid_claim_duplicate: "Ticket already claimed", //DONE
        invalid_claim_russian_roulette: "Ticket not for this russian roulette game", //DONE
        invalid_size_update_duplicate: "Cannot set to current size", //DONE
        invalid_number_range: "Number for ticket invalid", //DONE
        invalid_mint_address: "Only Russian roulette can mint", // DONE
        invalid_one_number_per_ticket: "Only one number per ticket",
        invalid_ticket_number_range: "Ticket number out of range", // DONE
        invalid_ticket_number_negative: "value out-of-bounds",
    }
};

const russianRouletteNFT = {
    newRussianRouletteNft: {
        uri: "https://testing.com/tokens/\{id\}"
    }
}

function generateRussianRouletteNumbers({
    numberOfTickets,
    maxRange
}) {
    var numberOfNumbers = [];
    let counterForNumbers = 0;
    for (let i = 0; i < numberOfTickets; i++) {
        numberOfNumbers[counterForNumbers] = Math.floor(Math.random() * maxRange + 1);
        counterForNumbers += 1;
    }
    return numberOfNumbers;
}

module.exports = {
    russianRoulette,
    russianRouletteNFT,
    BigNumber,
    generateRussianRouletteNumbers
}

