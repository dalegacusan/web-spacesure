const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const saltRounds = 12;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();
