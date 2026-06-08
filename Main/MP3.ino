//MP3
void initMP3() {
  // תקשורת למודול ה-MP3 (משתמשים ב-Hardware Serial 2)
  Serial2.begin(9600, SERIAL_8N1, DFPLAYER_RX_PIN, DFPLAYER_TX_PIN);
  delay(1000);
  // הגדרת עוצמת קול (30 זה מקסימום)
  byte setVol[] = {0x7e, 0xff, 0x06, 0x06, 0x00, 0x00, 0x1e, 0xef};
  sendCmd(setVol);
  delay(500);
  // ניגון ראשוני מנוהל ע"י מכונת המצבים – לא מנגנים כאן
}
void sendCmd(byte cmd[]) {
  for (int i = 0; i < 8; i++) {
    Serial2.write(cmd[i]);
  }
}
void playTrack(int folderNum, int fileNum) {
  byte playCmd[] = {0x7e, 0xff, 0x06, 0x0f, 0x00, (byte)folderNum, (byte)fileNum, 0xef};
  Serial.println("השמעת הקלטה");
  sendCmd(playCmd);
}


