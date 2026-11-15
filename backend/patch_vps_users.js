const bcrypt = require('bcryptjs');
const fs = require('fs');

const usersToAdd = [
  {
    "id": "shriraj_patil",
    "username": "Shriraj.Patil@vigithink.com",
    "passwordHash": bcrypt.hashSync("Patil@123", 10),
    "name": "Shriraj Patil",
    "firstName": "Shriraj",
    "lastName": "Patil",
    "role": "Data Entry",
    "email": "Shriraj.Patil@vigithink.com",
    "createdAt": new Date().toISOString()
  },
  {
    "id": "sweety_gade",
    "username": "Sweety.Gade@vigithink.com",
    "passwordHash": bcrypt.hashSync("Gade@123", 10),
    "name": "Sweety Gade",
    "firstName": "Sweety",
    "lastName": "Gade",
    "role": "Data Entry",
    "email": "Sweety.Gade@vigithink.com",
    "createdAt": new Date().toISOString()
  },
  {
    "id": "mansi_agrawal",
    "username": "Mansi.Agrawal@vigithink.com",
    "passwordHash": bcrypt.hashSync("Agrawal@123", 10),
    "name": "Mansi Agrawal",
    "firstName": "Mansi",
    "lastName": "Agrawal",
    "role": "Data Entry",
    "email": "Mansi.Agrawal@vigithink.com",
    "createdAt": new Date().toISOString()
  }
];

const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function addUsersToVPS() {
  await ssh.connect({ host: '185.199.53.21', username: 'root', password: 'Swami@28031999' });
  await ssh.getFile('vps_users.json', '/var/www/vigithinksafety/backend/data/users.json');
  
  let users = JSON.parse(fs.readFileSync('vps_users.json', 'utf8'));
  
  for (let u of usersToAdd) {
    if (!users.find(x => x.username === u.username)) {
      users.push(u);
    }
  }

  fs.writeFileSync('vps_users.json', JSON.stringify(users, null, 2));
  
  await ssh.putFile('vps_users.json', '/var/www/vigithinksafety/backend/data/users.json');
  
  console.log("Users added directly to VPS database!");
  process.exit(0);
}
addUsersToVPS().catch(console.error);
