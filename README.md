#Little CPU simulator

8 bit space for opcodes ( just using first 4 bits (16 opcodes) for now ) 
8 bit ALU 
8 bit address space 
load/store design (everything operates on register A) 

type 0 commands are OPCODE (8 bit) - they take no operands and produce no side effects
type 1 commands are OPCODE (8 bit) and ADDRESS (8 bit)
type 2 commands are OPCODE (8 bit) and use the value in REGISTER A as an operand
type 3 commands are OPCODE (8 bit) and use the value in REGISTER A as HARDWARE ADDRESS and the value in ADDRESS as HARDWARE COMMAND ( so can address 256 pieces of hardware, and 256 things in each ) 

command	opcode	type	description 
NOP	0x0 	0	do nothing
LOAD	0x1	1	load from ADDRESS into REGISTER A
STORE	0x2 	1	store REGISTER A into ADDRESS and clear REGISTER A (
ADD	0x3	1	add value at ADDRESS to REGISTER A  
SUB	0x4 	1	subtract value at ADDRESS from REGISTER A
MUL	0x5	1	multiply value at ADDRESS with REGISTER A
DIV	0x6	1	divide value at ADDRESS by REGISTER A
CMP	0x7	1	compare value at ADDRESS with REGISTER A. Sets the EQ (equality) bits 
JMP	0x8	2	jump to memory address at the value in REGISTER A
JE	0x9	2	jump if equal ( ie EQ == 1)
JNE	0xA	2	jump if not equal
JG	0xB	2	jump if greater (ie, EQ ==0 AND EM == 1)
JL	0xC	2	jump if less (ie, EQ == 0 AND EM == 0)
IN 	0xD	3       get value at HARDWARE COMMAND (in ADDRESS) from hardware at HARDWARE ADDRESS ( in REGISTER A )
OUT	0XE	3
LIT	0XF	4  	set REGISTER A to VALUE 

source goes in `src`

`npm install` to install deps and dev deps 

`npm run dev` for dev server 

`npm run build` to build

`npm run lint` to lint 

`npm run lint:fix` to autofix 

transpiled stuff ends up in `dist`
