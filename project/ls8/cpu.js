/**
 * LS-8 v2.0 emulator skeleton code
 */

const fs = require('fs');

// Instructions

const HLT  = 0b00000001; // Halt CPU
const ADD  = 0b10101000;
const LDI  = 0b10011001; 
const MUL  = 0b10101010;
const PRN  = 0b01000011;
const NOP  = 0b00000000;
const PUSH = 0b01001101;
const POP  = 0b01001100;
const CMP  = 0b10100000;

const SP = 7; //according to Google Stack Pointer needs to point to Reg7

// values for flags 00000LGE
const FL_EQUALS  = 0b00000001;
const FL_GREATER = 0b00000010;
const FL_LESS    = 0b00000100;

/**
 * Class for simulating a simple Computer (CPU & memory)
 */
class CPU {
    /**
     * Initialize the CPU
     */
    constructor(ram) {
        this.ram = ram;

        this.reg = new Array(8).fill(0); // General-purpose registers
        
        // Special-purpose registers
        this.reg.PC = 0; // Program Counter
        this.reg.IR = 0; // Instruction Register
        this.reg.flag = 0; // Flags
        this.reg[SP] = 0xF4;

		this.setupBranchTable();
    }
	
	/**
	 * Sets up the branch table
	 */
	setupBranchTable() {
		let bt = {};

        bt[HLT]  = this.HLT;
        bt[ADD]  = this.ADD;
        bt[LDI]  = this.LDI;
        bt[MUL]  = this.MUL;
        bt[PRN]  = this.PRN;
        bt[NOP]  = this.NOP;
        bt[PUSH] = this.PUSH;
        bt[POP]  = this.POP;
        bt[CMP]  = this.CMP;

		this.branchTable = bt;
	}

    /**
     * Store value in memory address, useful for program loading
     */
    poke(address, value) {
        this.ram.write(address, value);
    }

    /**
     * Starts the clock ticking on the CPU
     */
    startClock() {
        const _this = this;

        this.clock = setInterval(() => {
            _this.tick();
        }, 1);
    }

    /**
     * Stops the clock
     */
    stopClock() {
        clearInterval(this.clock);
    }

    setFlag(flag, value) {
        if (value) {
            // set flag to 1 because of the OR
            this.reg.FL = this.reg.FL | flag;

        } else {
            //set flag to 0
            this.reg.FL = this.reg.FL & ~flag;
        }
    }
    /**
     * ALU functionality
     * 
     * op can be: ADD SUB MUL DIV INC DEC CMP
     */
    alu(op, regA, regB) {
        switch (op) {
            case 'ADD':
                this.reg[regA] = this.reg[regA] + this.reg[regB];
               break;
            case 'CMP':
                return this.setFlag(FL_EQUALS, this.reg[regA] === this.reg[regB]);
                break;
            case 'MUL':
                this.reg[regA] = this.reg[regA] * this.reg[regB];
                break;
        }
    }

    /**
     * Advances the CPU one cycle
     */
    tick() {
        // Load the instruction register (IR) from the current PC
        this.reg.IR = this.ram.read(this.reg.PC);

        // Debugging output
        console.log(`${this.reg.PC}: ${this.reg.IR.toString(2)}`);
        
        // Based on the value in the Instruction Register, locate the
        // appropriate hander in the branchTable
        let handler = this.branchTable[this.reg.IR];

        // Check that the handler is defined, halt if not (invalid
        // instruction)
        // !!! IMPLEMENT ME
        if (handler === undefined) {
            console.log('Unknown opcode ' + this.reg.IR);
            this.stopClock();
            return;
        } else {
            this.HLT();
        }


        let operandA = this.ram.read(this.reg.PC + 1);
        let operandB = this.ram.read(this.reg.PC + 2);
        // We need to use call() so we can set the "this" value inside
        // the handler (otherwise it will be undefined in the handler)
        handler.call(this, operandA, operandB);

        // Increment the PC register to go to the next instruction
        this.reg.PC += ((this.reg.IR >> 6) & 0b00000011) +1;

    }

    // INSTRUCTION HANDLER CODE:
    ADD(regA, regB) {
        this.alu('ADD', regA, regB);
    }
    CMP(regA, regB) {
        this.alu('CMP', regA, regB);
        console.log(this.reg.FL.toString(2));
    }
    HLT() {
        this.stopClock();
    }
    LDI(registerNumber, value) {
        this.reg[registerNumber] = value & 255; //anding with 255 limits the size to no more than 255
    }
    MUL(regA, regB) {
        this.alu('MUL', regA, regB);
    }
    NOP () {
        return; //NOP does nothing
    }
    popHelper() {
        const popped = this.ram.read(this.reg[SP]);
        this.reg[SP]++;
        return popped;
    }
    POP (registerNumber) {
        this.reg[registerNumber] = this.popHelper();
    }
    PRN(regA) {
        console.log(this.reg[regA]);
    }
    pushHelper(value) {
        this.reg[SP]--;
        this.ram.write(this.reg[SP], value);
    }
    PUSH (registerNumber) {
        this.pushHelper(this.reg[registerNumber]);
    }
}

module.exports = CPU;
