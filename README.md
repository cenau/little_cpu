# Little CPU simulator

8 bit space for opcodes ( just using first 4 bits (16 opcodes) for now ) 
8 bit ALU 
1 x 8 bit onboard EEPROM ( for 256 bytes of program code - this is automatically loaded into the first MU on powerup)
8 x 8 bit address space memory units (for 4096 bytes of addressible memory)
2 x 8 bit general registers (A and B) 
load/store design (everything operates on register A) 

## notes on memory

The value in REGISTER B selects which memory unit to address.

The system _cannot_ write to the onboard EEPROM, an external programmer is required. This ensures the integrity of the system's program code.  

External EEPROM units are available if additional progam space is needed or for storing data that will persist after a reboot.

## notes on hardware

The value in REGISTER B selects which hardware to address. The value in REGISTER A is the command to send to the hardware. The value in ADDRESS is the argument to send the the hardware. 

0x0 and 0x1 are SPECIAL PORTS which share priveliged access to the CPU's Memory Units, and therefore can read and write directly to the MU's (Devices which implement this can only access _one_ MU at a time). This is typically used to map memory to display devices or data storage. 

## command types

type 0 commands are OPCODE (8 bit) - they take no operands and produce no side effects
type 1 commands are OPCODE (8 bit) and ADDRESS (8 bit)
type 2 commands are OPCODE (8 bit) and use the value in REGISTER A as an operand
type 3 commands are OPCODE (8 bit) and use the value in REGISTER A as HARDWARE ADDRESS and the value in ADDRESS as HARDWARE COMMAND ( so can address 256 pieces of hardware, and 256 things in each ) 

## comamnds

command |	opcode | type	| description
_____________________________________
NOP	| 0x0 |	0	do nothing
LOAD |	0x1	| 1	load from ADDRESS into REGISTER A, and push previous REG A value to REG B
STORE	| 0x2 |	1	store REGISTER A into ADDRESS , pop REG B value into REG A (clearing REG B )
ADD	| 0x3	| 1	add value at ADDRESS to REGISTER A  
SUB	| 0x4 |	1	subtract value at ADDRESS from REGISTER A
MUL	| 0x5	| 1	multiply value at ADDRESS with REGISTER A
DIV	| 0x6	| 1	divide value at ADDRESS by REGISTER A
CMP	| 0x7	| 1	compare value at ADDRESS with REGISTER A. Sets the EQ (equality) bits 
JMP	| 0x8	| 2	jump to memory address at the value in REGISTER A
JE	| 0x9	| 2	jump if equal ( ie EQ == 1)
JG	| 0xA	| 2	jump if greater (ie, EQ ==0 AND EM == 1)
JL	| 0xB	| 2	jump if less (ie, EQ == 0 AND EM == 0)
IN 	| 0xC	| 3       get value at HARDWARE COMMAND (in ADDRESS) from hardware at HARDWARE ADDRESS ( in REGISTER A )
OUT	| 0XD	| 3
LIT	0XE	4  	set REGISTER A to VALUE 
TBD	0XF	  	 

## build stuff

source goes in `src`

`npm install` to install deps and dev deps 

`npm run dev` for dev server 

`npm run build` to build

`npm run lint` to lint 

`npm run lint:fix` to autofix 

transpiled stuff ends up in `dist`
