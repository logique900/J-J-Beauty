const fs = require('fs');
let code = fs.readFileSync('src/services/notificationService.ts', 'utf8');
code = code.replace(
  `  const filterIds = [userId];
  if (isAdmin) filterIds.push('admin');

  const q = query(
    collection(db, 'notifications'),
    where('userId', 'in', filterIds),
    orderBy('createdAt', 'desc'),
    limit(50)
  );`,
  `  let q;
  if (isAdmin) {
    q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [userId, 'admin']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  } else {
    q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }`
);
fs.writeFileSync('src/services/notificationService.ts', code);
