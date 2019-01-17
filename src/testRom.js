let testRom = new Array(256).fill(0);
      //hello prog 
      //letters
  testRom[0x7F] = 0b10000001
  testRom[0x80] = 0b10000001
  testRom[0x81] = 0b10000001
  testRom[0x82] = 0b11111111
  testRom[0x83] = 0b11111111
  testRom[0x84] = 0b10000001
  testRom[0x85] = 0b10000001
  testRom[0x86] = 0b10000001


  testRom[0x87] = 0b11111111
  testRom[0x88] = 0b10000000
  testRom[0x89] = 0b10000000
  testRom[0x8A] = 0b11111111
  testRom[0x8B] = 0b11111111
  testRom[0x8C] = 0b10000000
  testRom[0x8D] = 0b10000000
  testRom[0x8E] = 0b11111111
  
  testRom[0x8F] = 0b10000000
  testRom[0x90] = 0b10000000
  testRom[0x91] = 0b10000000
  testRom[0x92] = 0b10000000
  testRom[0x93] = 0b10000000
  testRom[0x94] = 0b10000000
  testRom[0x95] = 0b11111111
  testRom[0x96] = 0b11111111
  
  testRom[0x97] = 0b11111111
  testRom[0x98] = 0b10000001
  testRom[0x99] = 0b10000001
  testRom[0x9A] = 0b10000001
  testRom[0x9B] = 0b10000001
  testRom[0x9C] = 0b10000001
  testRom[0x9D] = 0b11111111
  testRom[0x9E] = 0b11111111
  
  testRom[0x9F] = 0b00000000
  testRom[0xA0] = 0b00000000
  testRom[0xA1] = 0b00000000
  testRom[0xA2] = 0b00011000
  testRom[0xA3] = 0b00011000
  testRom[0xA4] = 0b00000000
  testRom[0xA5] = 0b00000000
  testRom[0xA6] = 0b00000000

  //word index
  testRom[0xA7] = 0x7F 
  testRom[0xA8] = 0x9F 
  testRom[0xA9] = 0x87 
  testRom[0xAA] = 0x9F 
  testRom[0xAB] = 0x8F 
  testRom[0xAC] = 0x9F 
  testRom[0xAD] = 0x8F 
  testRom[0xAE] = 0x9F 
  testRom[0xAF] = 0x97

  //word end 
  testRom[0xB0] = 0xA7 + 0x9 


  //prog 
  testRom[0x0] = 0x0 //to get over 1st step bug

  //set 0xFE to amount to increment 
  testRom[0x1] = 0xE 
  testRom[0x2] = 0x1
  testRom[0x3] = 0x2
  testRom[0x4] = 0xFE


  //set A to where the word index starts
  testRom[0x5] = 0xE 
  testRom[0x6] = 0xA7

  // store from A into 0XFF
  testRom[0x7] = 0x2
  testRom[0x8] = 0xFF
  
  //load from index into A
  testRom[0x9] = 0x1 
  testRom[0xA] = 0xFF
  testRom[0xB] = 0x2 
  testRom[0xC] = 0xE
  testRom[0xD] = 0x1
  testRom[0xE] = 0x00

  
  // store from A into 0XFD
  testRom[0xF] = 0x2
  testRom[0x10] = 0xFD

  //set A to 0x1 ( the map-offset command in the display)
  testRom[0x11] = 0xE
  testRom[0x12] = 0x1

  //tell 0x0 (the display) to offset to 0xFF, where index is stored
  testRom[0x13] = 0xD
  testRom[0x14] = 0xFD

  //increment index 
  
  //load from index into A
  testRom[0x15] = 0x1
  testRom[0x16] = 0xFF
  testRom[0x17] = 0x3
  testRom[0x18] = 0xFE
  testRom[0x19] = 0x2
  testRom[0x1A] = 0xFF


  // load and compare
  testRom[0x1B] = 0x1
  testRom[0x1C] = 0xFF
  
  testRom[0x1D] = 0x7
  testRom[0x1E] = 0xB0
  
  //jump if less
  testRom[0x1F] = 0xE 
  testRom[0x20] = 0x9
  
  // if at end, go back to beginning
  testRom[0x21] = 0xB
  testRom[0x22] = 0xE 
  testRom[0x23] = 0x5 
  testRom[0x24] = 0x8



/*
  //OUT test prog 
  testRom[0x2] = 0xE
  testRom[0x3] = 0x1

  testRom[0x4] = 0x2 
  testRom[0x5] = 0x0
  
  testRom[0x6] = 0x1
  testRom[0x7] = 0x1

  testRom[0x8] = 0x3 
  testRom[0xA] = 0x0

  testRom[0xB] = 0x2 
  testRom[0xC] = 0x1

  testRom[0xD] = 0xE
  testRom[0xE] = 0x10

  testRom[0xF] = 0x1 
  testRom[0x10] = 0xFF
  
  testRom[0x11] = 0xD
  testRom[0x12] = 0x1
  
  testRom[0x13] = 0xE
  testRom[0x14] = 0x5
  testRom[0x15] = 0x8
*/

export default testRom
