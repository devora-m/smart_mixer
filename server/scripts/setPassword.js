/*
 * Interactive CLI: generates an EDIT_PASSWORD_HASH for your .env file.
 * Run with: npm run set-password
 *
 * Asks for the password twice (confirmation), hashes with bcryptjs,
 * and prints the line to paste into .env. Does NOT write the file
 * itself (so you don't lose other env values).
 */
const bcrypt = require('bcryptjs');
const readline = require('readline');

const SALT_ROUNDS = 10;

function ask(question, { silent = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    if (silent) {
      // Hide typed characters
      const stdin = process.openStdin();
      process.stdin.on('data', () => { /* eaten by readline */ });
      rl._writeToOutput = (str) => {
        if (str.includes(question)) rl.output.write(str);
        else rl.output.write('*');
      };
    }

    rl.question(question, (answer) => {
      rl.close();
      if (silent) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\nSet the edit password for the Smart Mixer admin website.');
  console.log('Anyone with this password will be able to add/edit/delete recipes.\n');

  const pw1 = await ask('Password (min 6 chars): ', { silent: true });
  if (pw1.length < 6) {
    console.error('\nPassword too short. Aborted.');
    process.exit(1);
  }

  const pw2 = await ask('Confirm password: ', { silent: true });
  if (pw1 !== pw2) {
    console.error('\nPasswords do not match. Aborted.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(pw1, SALT_ROUNDS);

  console.log('\n------------------------------------------------------------');
  console.log('Add this line to your .env file (replacing any existing one):');
  console.log('------------------------------------------------------------');
  console.log(`EDIT_PASSWORD_HASH=${hash}`);
  console.log('------------------------------------------------------------');
  console.log('Then restart the server.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
