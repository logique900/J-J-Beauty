const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const oldIsAdmin = `    function isAdmin() {
      return isSignedIn() && (
        (request.auth.token.get('email', '').lower() == 'logique900@gmail.com') ||
        (request.auth.token.get('email', '').lower() == 'admin@j-jbeauty.tn') ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', 'user') == 'admin')
      );
    }`;

const newIsAdmin = `    function isAdmin() {
      return isSignedIn() && (
        (request.auth.token.email != null && request.auth.token.email.lower() == 'logique900@gmail.com') ||
        (request.auth.token.email != null && request.auth.token.email.lower() == 'admin@j-jbeauty.tn') ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }`;

if (code.includes('request.auth.token.get(')) {
    code = code.replace(oldIsAdmin, newIsAdmin);
    fs.writeFileSync('firestore.rules', code);
    console.log("Patched isAdmin in firestore.rules!");
} else {
    console.log("Not found or already patched.");
}
